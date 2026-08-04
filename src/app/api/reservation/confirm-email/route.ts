import { NextRequest, NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/sendEmail";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { and, eq } from "drizzle-orm";
import { reservation, users, consoleType } from "@/db/schema";
import { alias } from "drizzle-orm/mysql-core";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { reservationId } = body;
  if (!reservationId) return NextResponse.json({ error: "Missing reservationId" }, { status: 400 });

  try {
    const rows = await db
      .select({
        id: reservation.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
        date: reservation.date,
        time: reservation.time,
        consoleName: consoleType.name,
      })
      .from(reservation)
      .innerJoin(users, eq(reservation.userId, users.id))
      .innerJoin(consoleType, eq(reservation.consoleTypeId, consoleType.id))
      .where(and(eq(reservation.id, reservationId), eq(reservation.userId, Number(user.id))));

    if (rows.length === 0) {
      return NextResponse.json({ error: "Reservation not found or access denied" }, { status: 404 });
    }

    const r = rows[0];
    await sendConfirmationEmail({
      to: r.email,
      userName: `${r.firstname} ${r.lastname}`,
      reservationId: r.id,
      date: r.date,
      time: r.time,
      consoleName: r.consoleName,
    });

    return NextResponse.json({ success: true, reservationId: r.id, email: r.email, message: "Reservation confirmed and email sent" }, { status: 200 });
  } catch (error) {
    console.error("Error sending reservation confirmation mail :", error);
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
