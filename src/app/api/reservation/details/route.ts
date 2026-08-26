import { NextResponse } from "next/server";
import db from "@/db";
import { reservation, stations, accessoires } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { withAuth } from "@/lib/withAuth";

const REGEX_RESERVATION_ID =
  /^RESV-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const idReservation = searchParams.get("id");
    if (!idReservation || !REGEX_RESERVATION_ID.test(idReservation)) {
      return NextResponse.json(
        { error: "Missing or invalid id parameter." },
        { status: 400 },
      );
    }

    const row = await db.query.reservation.findFirst({
      columns: {
        id: true,
        userId: true,
        station: true,
        date: true,
        time: true,
        archived: true,
        cancellationReason: true,
        accessoryIds: true,
      },
      where: eq(reservation.id, idReservation),
      with: {
        consoleStock: {
          with: { consoleType: { columns: { name: true, picture: true } } },
        },
        game_game1Id: {
          columns: { titre: true, picture: true, biblioId: true },
        },
        game_game2Id: {
          columns: { titre: true, picture: true, biblioId: true },
        },
        game_game3Id: {
          columns: { titre: true, picture: true, biblioId: true },
        },
      },
    });

    if (!row) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 },
      );
    }

    if (row.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const stationRow =
      row.station != null
        ? await db.query.stations.findFirst({
            columns: { name: true },
            where: eq(stations.id, row.station),
          })
        : null;

    const accessoryIds = Array.isArray(row.accessoryIds)
      ? (row.accessoryIds as number[])
      : [];
    const accessoiresRows =
      accessoryIds.length > 0
        ? await db
            .select({ id: accessoires.id, name: accessoires.name })
            .from(accessoires)
            .where(inArray(accessoires.id, accessoryIds))
        : [];

    const jeux = [row.game_game1Id, row.game_game2Id, row.game_game3Id]
      .filter((g): g is NonNullable<typeof g> => g != null)
      .map((g) => ({
        nom: g.titre,
        picture: g.picture,
        biblio: g.biblioId ?? undefined,
      }));

    return NextResponse.json({
      id: row.id,
      console: {
        nom: row.consoleStock?.consoleType?.name ?? "",
        picture:
          row.consoleStock?.consoleType?.picture ??
          row.consoleStock?.picture ??
          null,
      },
      jeux,
      accessoires: accessoiresRows.map((a) => ({ id: a.id, nom: a.name })),
      // tinyint MySQL : sans conversion, un 0 arrive au client et React
      // l'affiche tel quel dans `{archived && …}`.
      archived: Boolean(row.archived),
      cancellationReason: row.cancellationReason ?? null,
      station: stationRow?.name ?? null,
      date: row.date,
      heure: row.time?.slice(0, 5) ?? null,
    });
  } catch (error) {
    console.error("ERREUR DETAILS RÉSERVATION:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la réservation." },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const idString = searchParams.get("id");
    if (!idString || !REGEX_RESERVATION_ID.test(idString)) {
      return NextResponse.json(
        { error: "Missing or invalid id parameter." },
        { status: 400 },
      );
    }

    const existing = await db.query.reservation.findFirst({
      columns: { id: true, userId: true },
      where: eq(reservation.id, idString),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 },
      );
    }

    if (existing.userId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await db
      .update(reservation)
      .set({ archived: 1 })
      .where(eq(reservation.id, idString));

    return NextResponse.json(
      { message: "Reservation supprimée avec succès." },
      { status: 200 },
    );
  } catch (error) {
    console.error("ERREUR DELETE RÉSERVATION:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation." },
      { status: 500 },
    );
  }
});
