import db from "@/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { policies } from "@/db/schema";

export async function GET() {
  try {
    const row = await db.query.policies.findFirst();
    return NextResponse.json({ policies: row ?? null });
  } catch (error) {
    console.error("Error querying policies:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = verifyToken(token);
  if (!user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { policies: policiesText } = body;

    if (!policiesText || policiesText.trim() === "") {
      return NextResponse.json({ error: "Le champ politiques est requis." }, { status: 400 });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const existing = await db.query.policies.findFirst({ columns: { id: true } });

    if (existing) {
      await db.update(policies).set({ policies: policiesText, lastUpdatedAt: now });
    } else {
      await db.insert(policies).values({ policies: policiesText, lastUpdatedAt: now });
    }

    return NextResponse.json({ success: true, message: "Politiques sauvegardées avec succès." });
  } catch (error) {
    console.error("Error saving policies:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
