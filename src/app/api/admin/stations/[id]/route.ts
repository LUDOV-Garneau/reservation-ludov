import { NextResponse } from "next/server";
import db from "@/db";
import { reservation, stations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import { splitLocalNow } from "@/lib/reservationsQuery";
import { toLocalDatetime } from "@/lib/dates";
import {
  readStationPatch,
  STATION_PAYLOAD_MESSAGES,
} from "@/lib/stationUpdate";
import { findStationByName, findUnknownConsoleIds } from "@/lib/stationsDb";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Modification d'une station : nom, plateformes, statut actif. */
export const PATCH = withAdmin<{ id: string }>(async (req, _admin, params) => {
  try {
    const id = parseId(params.id);
    if (id === null) {
      return NextResponse.json(
        { success: false, error: "Identifiant invalide." },
        { status: 400 },
      );
    }

    const parsed = readStationPatch(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: STATION_PAYLOAD_MESSAGES[parsed.error] },
        { status: 400 },
      );
    }

    const existing = await db.query.stations.findFirst({
      columns: { id: true },
      where: eq(stations.id, id),
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Station introuvable." },
        { status: 404 },
      );
    }

    const { name, consoles, isActive } = parsed.value;

    // L'unicité du nom n'était vérifiée qu'à la création : deux stations
    // pouvaient devenir homonymes par une simple modification.
    if (name !== undefined && (await findStationByName(name, id))) {
      return NextResponse.json(
        { success: false, error: "Une station avec ce nom existe déjà." },
        { status: 409 },
      );
    }

    if (consoles !== undefined) {
      const unknown = await findUnknownConsoleIds(consoles);
      if (unknown.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Plateforme inconnue : ${unknown.join(", ")}.`,
          },
          { status: 400 },
        );
      }
    }

    await db
      .update(stations)
      .set({
        lastUpdatedAt: toLocalDatetime(),
        ...(name === undefined ? {} : { name }),
        ...(consoles === undefined ? {} : { consoles }),
        ...(isActive === undefined ? {} : { isActive: isActive ? 1 : 0 }),
      })
      .where(eq(stations.id, id));

    return NextResponse.json(
      { success: true, message: "Station modifiée avec succès." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de la modification de la station :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 },
    );
  }
});

/**
 * Suppression d'une station.
 *
 * Refusée dès qu'une réservation y est rattachée. L'implémentation précédente
 * exécutait `DELETE FROM reservation WHERE station = ?` avant de supprimer la
 * station : elle emportait l'historique complet du poste, passé compris, sans
 * que la modale l'annonce. Désactiver la station la retire du parcours de
 * réservation et laisse l'historique intact ; c'est ce que la réponse 409
 * propose à l'interface.
 */
export const DELETE = withAdmin<{ id: string }>(async (_req, _admin, params) => {
  try {
    const id = parseId(params.id);
    if (id === null) {
      return NextResponse.json(
        { success: false, error: "Identifiant invalide." },
        { status: 400 },
      );
    }

    const existing = await db.query.stations.findFirst({
      columns: { id: true, name: true },
      where: eq(stations.id, id),
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Station introuvable." },
        { status: 404 },
      );
    }

    const { today, nowTime } = splitLocalNow();
    const [counts] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        upcoming: sql<number>`SUM(CASE WHEN ${reservation.archived} = 0 AND TIMESTAMP(${reservation.date}, ${reservation.time}) >= TIMESTAMP(${today}, ${nowTime}) THEN 1 ELSE 0 END)`,
      })
      .from(reservation)
      .where(eq(reservation.station, id));

    const total = Number(counts?.total ?? 0);
    if (total > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La station porte des réservations.",
          reservations: total,
          upcoming: Number(counts?.upcoming ?? 0),
        },
        { status: 409 },
      );
    }

    await db.delete(stations).where(eq(stations.id, id));

    return NextResponse.json(
      { success: true, message: "Station supprimée avec succès." },
      { status: 200 },
    );
  } catch (err) {
    console.error("Erreur lors de la suppression de la station :", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 },
    );
  }
});
