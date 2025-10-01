import { notFound } from "next/navigation";
import DetailsReservation from "@/components/reservation/DetailsReservation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type ApiReservation = {
    id: number;
    station: string;
    date: string;
    heure: string;
    console: { nom: string };
    jeux: { nom: string; description?: string; materielRequis?: string }[];
    accessoires?: { nom: string }[];
};

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

async function obtenirReservation(id: string): Promise<ApiReservation | null> {
    try {
        const idReservation = Number(id);
        if (isNaN(idReservation)) return null;

        const [rows] = await pool.query<ReservationHoldRow[]>(
            `
      SELECT 
        rh.id, rh.user_id, rh.station_id, rh.createdAt, c.name AS console_name, 
        g1.titre AS game1_title, g1.author AS game1_author,
        g2.titre AS game2_title, g2.author AS game2_author,
        g3.titre AS game3_title, g3.author AS game3_author,
        a.name  AS accessoire_name FROM reservation_hold rh
      JOIN consoles c ON c.id = rh.console_id
      LEFT JOIN games g1 ON g1.id = rh.game1_id
      LEFT JOIN games g2 ON g2.id = rh.game2_id
      LEFT JOIN games g3 ON g3.id = rh.game3_id
      LEFT JOIN accessoires a ON a.id = rh.accessoir_id
      WHERE rh.id = ?
      `,
            [idReservation]
        );

        if (!rows.length) return null;

        const row = rows[0];

        const dateString =
            row.createdAt instanceof Date
                ? row.createdAt.toISOString().replace("T", " ").substring(0, 19)
                : String(row.createdAt ?? "");
        const [datePart, timePart] = dateString.split(" ");
        const heure = (timePart ?? "").slice(0, 5);

        const jeux = [
            { titre: row.game1_title, author: row.game1_author },
            { titre: row.game2_title, author: row.game2_author },
            { titre: row.game3_title, author: row.game3_author },
        ]
            .filter(j => j.titre)
            .map(j => ({
                nom: j.titre as string,
                description: j.author ?? undefined,
            }));

        return {
            id: row.id,
            console: { nom: row.console_name },
            jeux,
            accessoires: row.accessoire_name ? [{ nom: row.accessoire_name }] : [],
            station: String(row.station_id),
            date: datePart ?? "",
            heure: heure ?? "",
        };
    } catch (error) {
        console.error('🔴 ERREUR DETAILS RÉSERVATION:', error);
        console.error("Erreur lors de la récupération de la réservation:", error);
        return null;
    }
}

export default async function PageDetails({
    params,
}: {
    params: { locale: string; id: string };
}) {
    const { id } = params;
    if (!id) notFound();

    const reservation = await obtenirReservation(id);
    if (!reservation) notFound();

    return (
        <div className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl">
            <DetailsReservation
                jeux={reservation.jeux}
                console={reservation.console}
                accessoires={reservation.accessoires ?? []}
                station={reservation.station}
                date={reservation.date}
                heure={reservation.heure}
            />
        </div>
    );
}
