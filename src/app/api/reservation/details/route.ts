import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { reservation } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const REGEX_RESERVATION_ID = /^RSVP-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function testReservationIdRegex(id: string): boolean {
  return REGEX_RESERVATION_ID.test(id);
}

const toYMD = (d: string | Date): string => {
  if (!d) return "";
  if (typeof d === "string") {
    const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
    return d;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface DetailRow {
  id: string;
  user_id: number;
  station: number;
  date: string | Date;
  time: string;
  console_name: string;
  archived: number;
  station_name: string | null;
  game1_title: string | null;
  game1_biblio_id: number | null;
  game1_picture: string | null;
  game2_title: string | null;
  game2_biblio_id: number | null;
  game2_picture: string | null;
  game3_title: string | null;
  game3_biblio_id: number | null;
  game3_picture: string | null;
  accessoires_json: Array<{ id: number; name: string }> | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idReservation = searchParams.get("id");
    if (!idReservation || !testReservationIdRegex(idReservation)) {
      return NextResponse.json({ error: "Missing or invalid id parameter." }, { status: 400 });
    }

    const rows = await db.execute<DetailRow>(
      sql`SELECT
        r.id,
        r.user_id,
        r.station,
        DATE(r.date) AS date,
        r.time,
        c.name AS console_name,
        r.archived,
        s.name AS station_name,
        g1.titre AS game1_title, g1.biblio_id AS game1_biblio_id, g1.picture AS game1_picture,
        g2.titre AS game2_title, g2.biblio_id AS game2_biblio_id, g2.picture AS game2_picture,
        g3.titre AS game3_title, g3.biblio_id AS game3_biblio_id, g3.picture AS game3_picture,
        JSON_ARRAYAGG(JSON_OBJECT('id', a.id, 'name', a.name)) AS accessoires_json
      FROM reservation r
      JOIN console_type c ON c.id = r.console_type_id
      LEFT JOIN stations s ON s.id = r.station
      LEFT JOIN games g1 ON g1.id = r.game1_id
      LEFT JOIN games g2 ON g2.id = r.game2_id
      LEFT JOIN games g3 ON g3.id = r.game3_id
      LEFT JOIN JSON_TABLE(r.accessory_ids, '$[*]' COLUMNS(accessoir_id INT PATH '$')) jt ON TRUE
      LEFT JOIN accessoires a ON a.id = jt.accessoir_id
      WHERE r.id = ${idReservation}
      GROUP BY r.id, r.user_id, r.station, DATE(r.date), r.time, c.name, s.name,
        g1.titre, g1.biblio_id, g1.picture,
        g2.titre, g2.biblio_id, g2.picture,
        g3.titre, g3.biblio_id, g3.picture`
    );

    const rowsArr = rows as DetailRow[];
    if (!rowsArr.length) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }
    const row = rowsArr[0];

    const accessoires = Array.isArray(row.accessoires_json)
      ? row.accessoires_json
          .filter((x) => x && typeof x.id === "number" && typeof x.name === "string")
          .map((x) => ({ id: x.id, nom: x.name }))
      : [];

    const jeux = [
      { titre: row.game1_title, picture: row.game1_picture, biblio: row.game1_biblio_id },
      { titre: row.game2_title, picture: row.game2_picture, biblio: row.game2_biblio_id },
      { titre: row.game3_title, picture: row.game3_picture, biblio: row.game3_biblio_id },
    ]
      .filter((j) => j.titre)
      .map((j) => ({ nom: j.titre as string, picture: j.picture, biblio: j.biblio ?? undefined }));

    return NextResponse.json({
      id: row.id,
      console: { nom: row.console_name },
      jeux,
      accessoires,
      archived: row.archived,
      station: row.station_name,
      date: toYMD(row.date),
      heure: row.time.slice(0, 5),
    });
  } catch (error) {
    console.error("ERREUR DETAILS RÉSERVATION:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de la réservation." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idString = searchParams.get("id");
    if (!idString || !testReservationIdRegex(idString)) {
      return NextResponse.json({ error: "Missing or invalid id parameter." }, { status: 400 });
    }

    const existing = await db.query.reservation.findFirst({
      columns: { id: true },
      where: eq(reservation.id, idString),
    });

    if (!existing) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    await db.update(reservation).set({ archived: 1 }).where(eq(reservation.id, idString));

    return NextResponse.json({ message: "Reservation supprimée avec succès." }, { status: 200 });
  } catch (error) {
    console.error("ERREUR DELETE RÉSERVATION:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de la réservation." }, { status: 500 });
  }
}
