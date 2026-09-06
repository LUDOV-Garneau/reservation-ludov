import { NextResponse } from "next/server";
import db, { insertedId } from "@/db";
import { weeklyAvailabilities, specificDates, hourRanges } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { readYmd } from "@/lib/dates";
import {
  findDateErrors,
  findWeeklyErrors,
} from "@/lib/availabilityValidation";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
type WeekDay = { label: string; enabled: boolean; hoursRanges: HourRange[] };
/**
 * Les dates circulent en « YYYY-MM-DD » (jour calendaire local), jamais en
 * objets Date sérialisés : un ISO UTC relu dans le fuseau du navigateur
 * affichait la veille (le 5 octobre devenait le 4).
 */
type Exception = { date: string; timeRange: HourRange };
type AvailabilityState = {
  weekly: Record<string, WeekDay>;
  dateRange: {
    alwaysApplies: boolean;
    range: { startDate: string | null; endDate: string | null } | null;
  };
  exceptions: { enabled: boolean; dates: Exception[] };
};

/**
 * Configuration des disponibilités.
 *
 * Le `GET` exige `isAdmin` comme le `POST` : il ne vérifiait auparavant que la
 * présence d'une session, si bien que n'importe quel usager connecté pouvait
 * lire la configuration. Seule l'interface d'administration appelle cette
 * route.
 */
export const GET = withAdmin(async () => {
  try {
    const [weeklyRows, specificRows, hoursRows] = await Promise.all([
      db.query.weeklyAvailabilities.findMany(),
      db.query.specificDates.findMany(),
      db.query.hourRanges.findMany(),
    ]);

    const fetchedAvailability: AvailabilityState = {
      weekly: {},
      dateRange: { alwaysApplies: false, range: null },
      exceptions: { enabled: false, dates: [] },
    };
    const fetchedSpecificDates: Exception[] = [];

    if (weeklyRows.length <= 0) {
      fetchedAvailability.dateRange = { alwaysApplies: false, range: null };
    } else if (weeklyRows[0].alwaysAvailable) {
      fetchedAvailability.dateRange = { alwaysApplies: true, range: null };
    } else {
      fetchedAvailability.dateRange = {
        alwaysApplies: false,
        range: {
          startDate: weeklyRows[0].startDate ?? null,
          endDate: weeklyRows[0].endDate ?? null,
        },
      };
    }

    fetchedAvailability.exceptions.enabled = specificRows.some(
      (sr) => sr.isException == 1,
    );

    for (const sr of specificRows) {
      const entry: Exception = {
        date: sr.date,
        timeRange: {
          id: sr.id,
          startHour: sr.startHour,
          startMinute: sr.startMinute,
          endHour: sr.endHour,
          endMinute: sr.endMinute,
        },
      };
      if (sr.isException) {
        fetchedAvailability.exceptions.dates.push(entry);
      } else {
        fetchedSpecificDates.push(entry);
      }
    }

    for (const wr of weeklyRows) {
      fetchedAvailability.weekly[wr.dayOfWeek] = {
        label: wr.dayOfWeek,
        enabled: Boolean(wr.enabled),
        hoursRanges: hoursRows
          .filter((hr) => hr.weeklyId === wr.weeklyId)
          .map((hr) => ({
            id: hr.rangeId,
            startHour: hr.startHour,
            startMinute: hr.startMinute,
            endHour: hr.endHour,
            endMinute: hr.endMinute,
          })),
      };
    }

    return NextResponse.json({
      availability: fetchedAvailability,
      specificDates: fetchedSpecificDates,
    });
  } catch (err) {
    // Le message d'exception n'est pas renvoyé : il porte des noms de tables
    // et de colonnes qui n'ont rien à faire dans une réponse HTTP.
    console.error("Erreur lors de la lecture des disponibilités :", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
});

export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.weekly || !body.dateRange || !body.exceptions) {
      return NextResponse.json(
        { success: false, message: "availabilities object is required." },
        { status: 400 },
      );
    }

    const exceptionDates: Exception[] = [];
    for (const ex of body.exceptions.dates as {
      date: unknown;
      timeRange: HourRange;
    }[]) {
      const date = readYmd(ex.date);
      if (!date) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Date d'exception invalide (format attendu : YYYY-MM-DD).",
          },
          { status: 400 },
        );
      }
      exceptionDates.push({ date, timeRange: ex.timeRange });
    }

    const parsedAvailability: AvailabilityState = {
      ...body,
      dateRange: {
        alwaysApplies: Boolean(body.dateRange.alwaysApplies),
        range: body.dateRange.range
          ? {
              startDate: readYmd(body.dateRange.range.startDate),
              endDate: readYmd(body.dateRange.range.endDate),
            }
          : null,
      },
      exceptions: {
        enabled: Boolean(body.exceptions.enabled),
        dates: exceptionDates,
      },
    };

    if (
      !parsedAvailability.dateRange.alwaysApplies &&
      !parsedAvailability.dateRange.range?.startDate
    ) {
      return NextResponse.json(
        { success: false, message: "Une période de validité est requise." },
        { status: 400 },
      );
    }

    // Les plages sont validées ici et non seulement dans le formulaire : sans
    // ce contrôle, un appel direct écrivait des horaires qui se chevauchent,
    // que le parcours de réservation relisait ensuite.
    const erreursSemaine = findWeeklyErrors(parsedAvailability.weekly);
    if (Object.keys(erreursSemaine).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Plages horaires invalides.",
          errors: erreursSemaine,
        },
        { status: 400 },
      );
    }

    if (parsedAvailability.exceptions.enabled) {
      const erreursExceptions = findDateErrors(
        parsedAvailability.exceptions.dates,
      );
      if (Object.keys(erreursExceptions).length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Plages horaires invalides.",
            errors: erreursExceptions,
          },
          { status: 400 },
        );
      }
    }

    await db.transaction(async (tx) => {
      await tx.delete(weeklyAvailabilities);
      await tx.delete(specificDates).where(eq(specificDates.isException, 1));

      for (const [day, { enabled, hoursRanges: ranges }] of Object.entries(
        parsedAvailability.weekly,
      )) {
        const startDate = parsedAvailability.dateRange.alwaysApplies
          ? null
          : parsedAvailability.dateRange.range?.startDate ?? null;
        const endDate = parsedAvailability.dateRange.alwaysApplies
          ? null
          : parsedAvailability.dateRange.range?.endDate ?? null;
        const alwaysAvailable = parsedAvailability.dateRange.alwaysApplies
          ? 1
          : 0;

        const inserted = await tx.insert(weeklyAvailabilities).values({
          startDate,
          endDate,
          dayOfWeek: day,
          enabled: enabled ? 1 : 0,
          alwaysAvailable,
        });
        const weeklyId = insertedId(inserted);
        if (!weeklyId) {
          throw new Error(
            `Identifiant manquant après l'insertion de la disponibilité (${day}).`,
          );
        }

        if (enabled) {
          for (const hr of ranges) {
            await tx.insert(hourRanges).values({
              weeklyId,
              startHour: hr.startHour,
              startMinute: hr.startMinute,
              endHour: hr.endHour,
              endMinute: hr.endMinute,
            });
          }
        }
      }

      if (parsedAvailability.exceptions.enabled) {
        for (const exception of parsedAvailability.exceptions.dates) {
          await tx.insert(specificDates).values({
            date: exception.date,
            startHour: exception.timeRange.startHour,
            startMinute: exception.timeRange.startMinute,
            endHour: exception.timeRange.endHour,
            endMinute: exception.timeRange.endMinute,
            isException: 1,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Availabilities saved successfully.",
    });
  } catch (err) {
    console.error("Erreur lors de l'enregistrement des disponibilités :", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
});
