import { sendEmail } from "@/lib/sendEmail";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/db";
import { otp, users } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const otpCode = searchParams.get("otp");

    if (!otpCode || !email) {
      return NextResponse.json({ message: "Le courriel et le code OTP sont requis." }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: (t) => eq(t.email, email),
    });

    if (!user) {
      return NextResponse.json({ message: "Code OTP invalide." }, { status: 400 });
    }

    const row = await db.query.otp.findFirst({
      columns: { id: true, otpCode: true, isUsed: true },
      where: (t) => eq(t.userId, user.id),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    const isValid = row && row.otpCode === otpCode && row.isUsed === 0;

    if (isValid) {
      await db.update(otp).set({ isUsed: 1 }).where(eq(otp.id, row.id));
      return NextResponse.json({ message: "Code OTP validé avec succès!" }, { status: 200 });
    } else {
      return NextResponse.json({ message: "Code OTP invalide." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ message: "Une erreur s'est produite de la validation du code OTP." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const randomBuffer = crypto.randomBytes(4);
    const otpValue = parseInt(randomBuffer.toString("hex"), 16) % 1000000;
    const otpCode = otpValue.toString().padStart(6, "0");

    const otpMessage = `Merci de vous être inscrit sur la plateforme de réservation LUDOV.\n\nVotre code de sécurité : ${otpCode}\n\nDemande effectuée en date du ${new Date().toLocaleString()}.`;

    const response = await sendEmail({
      to: email,
      subject: "Code OTP - LUDOV réservation",
      text: otpMessage,
    });

    if (response.rejected.length >= 1) throw new Error();

    const user = await db.query.users.findFirst({
      columns: { id: true },
      where: (t) => eq(t.email, email),
    });

    if (!user) throw new Error("User not found");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

    await db.insert(otp).values({
      userId: user.id,
      otpCode,
      createdAt: fmt(now),
      expiresAt: fmt(expiresAt),
      isUsed: 0,
    });

    return NextResponse.json({ message: "Email envoyé avec succès!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Une erreur s'est produite lors de l'envoi du courriel." }, { status: 500 });
  }
}
