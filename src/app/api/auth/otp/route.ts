import { sendEmail } from "@/lib/sendEmail";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type ValidCodeRow = RowDataPacket & { id: number; validCode: number };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const otp = searchParams.get("otp");

    if (!otp || !email) {
      return NextResponse.json(
        {
          message: "Le courriel et le code OTP sont requis.",
        },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<ValidCodeRow[]>(
      `SELECT id, (otp_code = ? AND is_used = 0 AND expires_at > NOW()) AS is_valid
      FROM otp
      WHERE user_id = (SELECT id FROM users WHERE email = ? LIMIT 1)
      ORDER BY created_at DESC
      LIMIT 1`,
      [otp, email]
    );

    const isValid = rows[0]?.is_valid === 1;
    if (isValid) {
      await pool.query("UPDATE otp SET is_used = 1 WHERE id = ?", [
        rows[0]?.id,
      ]);
      return NextResponse.json(
        { message: "Code OTP validé avec succès!" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Code OTP invalide." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Une erreur s'est produite de la validation du code OTP." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const randomBuffer = crypto.randomBytes(4);
    const otp = parseInt(randomBuffer.toString("hex"), 16) % 1000000;
    const otpMessage = `Merci de vous être inscrit sur la plateforme de réservation LUDOV.\n\nVotre code de sécurité : ${otp
      .toString()
      .padStart(
        6,
        "0"
      )}\n\nDemande effectuée en date du ${new Date().toLocaleString()}.`;

    const response = await sendEmail({
      to: email,
      subject: "Code OTP - LUDOV réservation",
      text: otpMessage,
    });

    if (response.rejected.length >= 1) {
      throw new Error();
    }

    await pool.query(
      `INSERT INTO otp (user_id, otp_code, created_at, expires_at, is_used)
      SELECT id, ?, NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE), false
      FROM users WHERE email = ? LIMIT 1`,
      [otp.toString().padStart(6, "0"), email]
    );

    return NextResponse.json(
      { message: "Email envoyé avec succès!" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Une erreur s'est produite lors de l'envoi du courriel.",
      },
      { status: 500 }
    );
  }
}
