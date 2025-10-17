import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type ReservationHoldRow = RowDataPacket & {
  id: number;
  user_id: number;
  station_id: number;
  createdAt: Date | string;
  console_name: string;
  game1_title: string | null;
  game1_author: string | null;
  game2_title: string | null;
  game2_author: string | null;
  game3_title: string | null;
  game3_author: string | null;
  accessoire_name: string | null;
};

// --- GET ---
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
        rh.id, rh.user_id, rh.station_id, rh.createdAt, c.name AS console_name, 
        g1.titre AS game1_title, g1.biblio_id AS game1_biblio_id,
        g2.titre AS game2_title, g2.biblio_id AS game2_biblio_id,
        g3.titre AS game3_title, g3.biblio_id AS game3_biblio_id,
        a.name  AS accessoire_name
      FROM reservation_hold rh
      JOIN consoles c ON c.id = rh.console_id
      LEFT JOIN games g1 ON g1.id = rh.game1_id
      LEFT JOIN games g2 ON g2.id = rh.game2_id
      LEFT JOIN games g3 ON g3.id = rh.game3_id
      LEFT JOIN accessoires a ON a.id = rh.accessoir_id
      WHERE rh.id = ?
      `,
      [idReservation]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    const row = rows[0];
    const dateString =
      row.createdAt instanceof Date
        ? row.createdAt.toISOString().replace("T", " ").substring(0, 19)
        : String(row.createdAt ?? "");

    const [datePart, timePart] = dateString.split(" ");
    const heure = (timePart ?? "").slice(0, 5);

    const jeux = [
      { titre: row.game1_title, biblio: row.game1_biblio_id },
      { titre: row.game2_title, biblio: row.game2_biblio_id },
      { titre: row.game3_title, biblio: row.game3_biblio_id },
    ]
      .filter((j) => j.titre)
      .map((j) => ({
        nom: j.titre as string,
        biblio: j.biblio ?? undefined,
      }));

    return NextResponse.json({
      id: row.id,
      console: { nom: row.console_name },
      jeux,
      accessoires: row.accessoire_name ? [{ nom: row.accessoire_name }] : [],
      station: String(row.station_id),
      date: datePart ?? "",
      heure: heure ?? "",
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
