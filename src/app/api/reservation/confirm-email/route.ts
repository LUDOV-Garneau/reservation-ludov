import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { sendConfirmationEmail } from "@/lib/sendEmail";
import { verifyToken } from "@/lib/jwt";

interface Reservation extends RowDataPacket {
  id: string;
  user_id: number;
  email: string;
  firstname: string;
  lastname: string;
  date: string;
  time: string;
  console_name: string;
  confirmed: number;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = verifyToken(token);
  if (!user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reservationId } = body;
  if (!reservationId)
    return NextResponse.json(
      { error: "Missing reservationId" },
      { status: 400 }
    );

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<Reservation[]>(
      `SELECT r.*, u.email, u.firstname, u.lastname, ct.name AS console_name
       FROM reservation r
       INNER JOIN users u ON u.id = r.user_id
       INNER JOIN console_type ct ON ct.id = r.console_type_id
       WHERE r.id = ? AND r.user_id = ?`,
      [reservationId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Reservation not found or access denied" },
        { status: 404 }
      );
    }

    const reservation = rows[0];

    await sendConfirmationEmail({
      to: reservation.email,
      userName: `${reservation.firstname} ${reservation.lastname}`,
      reservationId: reservation.id,
      date: reservation.date,
      time: reservation.time,
      consoleName: reservation.console_name,
    });

    return NextResponse.json(
      {
        success: true,
        reservationId: reservation.id,
        email: reservation.email,
        message: "Reservation confirmed and email sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending reservation confirmation mail :", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
