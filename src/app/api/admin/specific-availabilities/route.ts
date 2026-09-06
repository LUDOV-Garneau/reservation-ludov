import { NextResponse } from "next/server";
import db from "@/db";
import { specificDates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { readYmd } from "@/lib/dates";
import { findDateErrors } from "@/lib/availabilityValidation";

type HourRange = {
  id: number;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
};
type Exception = { date: string; timeRange: HourRange };

export const POST = withAdmin(async (req) => {
  try {
    const body = (await req.json().catch(() => null)) as Exception[] | null;
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, message: "specificDates object is required." },
        { status: 400 },
      );
    }

    const parsedSpecificDates: Exception[] = [];
    for (const sd of body) {
      const date = readYmd(sd?.date);
      if (!date) {
        return NextResponse.json(
          {
            success: false,
            message: "Date invalide (format attendu : YYYY-MM-DD).",
          },
          { status: 400 },
        );
      }
      parsedSpecificDates.push({ date, timeRange: sd.timeRange });
    }

    // Même validation que le formulaire, appliquee ici pour qu'un appel direct
    // ne puisse pas ecrire des plages qui se chevauchent.
    const erreurs = findDateErrors(parsedSpecificDates);
    if (Object.keys(erreurs).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Plages horaires invalides.",
          errors: erreurs,
        },
        { status: 400 },
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(specificDates).where(eq(specificDates.isException, 0));
      for (const sd of parsedSpecificDates) {
        await tx.insert(specificDates).values({
          date: sd.date,
          startHour: sd.timeRange.startHour,
          startMinute: sd.timeRange.startMinute,
          endHour: sd.timeRange.endHour,
          endMinute: sd.timeRange.endMinute,
          isException: 0,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Specific dates saved successfully.",
    });
  } catch (err) {
    // Le message d'exception reste dans les journaux du serveur.
    console.error("Erreur lors de l'enregistrement des dates :", err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 },
    );
  }
});
