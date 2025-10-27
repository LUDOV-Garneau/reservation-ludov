import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type ReservationHoldRow = RowDataPacket & {
  id: number;
  user_id: number;
  station_id: number;
  date: string | Date;
  time: string;
  console_name: string;
  game1_title: string | null;
  game1_picture: string | null;
  game1_biblio_id: number | null;
  game2_title: string | null;
  game2_picture: string | null;
  game2_biblio_id: number | null;
  game3_title: string | null;
  game3_picture: string | null;
  game3_biblio_id: number | null;
  accessoires_json: Array<{ id: number; name: string }> | null;
};

const toYMD = (d: string | Date): string => {
  if (!d) return "";
  if (typeof d === "string") {
    const m = d.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const dd = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }
    return d;
  }
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idString = searchParams.get("id");
    if (!idString || !/^\d+$/.test(idString)) {
      return NextResponse.json(
        { error: "Missing or invalid id parameter." },
        { status: 400 }
      );
    }
    const idReservation = Number(idString);

    const [rows] = await pool.query<ReservationHoldRow[]>(
      `
      SELECT 
        rh.id,
        rh.user_id,
        rh.station_id,
        DATE(rh.date) AS date,
        rh.time,
        c.name AS console_name,

        g1.titre AS game1_title, g1.biblio_id AS game1_biblio_id, g1.picture AS game1_picture,
        g2.titre AS game2_title, g2.biblio_id AS game2_biblio_id, g2.picture AS game2_picture,
        g3.titre AS game3_title, g3.biblio_id AS game3_biblio_id, g3.picture AS game3_picture,

        JSON_ARRAYAGG(
          JSON_OBJECT('id', a.id, 'name', a.name)
        ) AS accessoires_json

      FROM reservation_hold rh
      JOIN console_type c ON c.id = rh.console_type_id
      LEFT JOIN games g1 ON g1.id = rh.game1_id
      LEFT JOIN games g2 ON g2.id = rh.game2_id
      LEFT JOIN games g3 ON g3.id = rh.game3_id

      LEFT JOIN JSON_TABLE(
        rh.accessoirs, '$[*]'
        COLUMNS(accessoir_id INT PATH '$')
      ) jt ON TRUE
      LEFT JOIN accessoires a ON a.id = jt.accessoir_id

      WHERE rh.id = ?
      GROUP BY
        rh.id, rh.user_id, rh.station_id, DATE(rh.date), rh.time,
        c.name,
        g1.titre, g1.biblio_id, g1.picture,
        g2.titre, g2.biblio_id, g2.picture,
        g3.titre, g3.biblio_id, g3.picture
      `,
      [idReservation]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }

    const row = rows[0];
   
    const accessoires = Array.isArray(row.accessoires_json)
      ? row.accessoires_json
          .filter(x => x && typeof x.id === "number" && typeof x.name === "string")
          .map(x => ({ id: x.id, nom: x.name }))
      : [];

    const jeux = [
      { titre: row.game1_title, picture: row.game1_picture, biblio: row.game1_biblio_id },
      { titre: row.game2_title, picture: row.game2_picture, biblio: row.game2_biblio_id },
      { titre: row.game3_title, picture: row.game3_picture, biblio: row.game3_biblio_id },
    ]
      .filter(j => j.titre)
      .map(j => ({ nom: j.titre as string, picture: j.picture, biblio: j.biblio ?? undefined }));

    return NextResponse.json({
      id: row.id,
      console: { nom: row.console_name },
      jeux,
      accessoires,
      station: String(row.station_id),
      date: toYMD(row.date),
      heure: row.time.slice(0, 5),
    });
  } catch (error) {
    console.error("🔴 ERREUR DETAILS RÉSERVATION:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la réservation." },
      { status: 500 }
    );
  }
}

// Delete une réservation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idString = searchParams.get("id");

    if (!idString || !/^\d+$/.test(idString)) {
      return NextResponse.json(
        { error: "Missing or invalid id parameter." },
        { status: 400 }
      );
    }

    const idReservation = Number(idString);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM reservation_hold WHERE id = ?",
      [idReservation]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    await pool.query("DELETE FROM reservation_hold WHERE id = ?", [
      idReservation,
    ]);

    return NextResponse.json(
      { message: "Reservation supprimée avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔴 ERREUR DELETE RÉSERVATION:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la réservation." },
      { status: 500 }
    );
  }
}
