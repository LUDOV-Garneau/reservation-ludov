import db from "@/db";
import { NextResponse } from "next/server";
import { policies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

const POLICY_TYPES = ["privacy", "usage"] as const;
type PolicyType = (typeof POLICY_TYPES)[number];

function parseType(url: string): PolicyType | null {
  const value = new URL(url).searchParams.get("type") ?? "privacy";
  return (POLICY_TYPES as readonly string[]).includes(value)
    ? (value as PolicyType)
    : null;
}

// GET public : les politiques sont consultées dès la page d'authentification.
export async function GET(req: Request) {
  try {
    const type = parseType(req.url);
    if (!type) {
      return NextResponse.json({ message: "Type de politique invalide." }, { status: 400 });
    }

    const row = await db.query.policies.findFirst({
      where: eq(policies.type, type),
    });
    return NextResponse.json({ policies: row ?? null });
  } catch (error) {
    console.error("Error querying policies:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withAdmin(async (req) => {
  try {
    const type = parseType(req.url);
    if (!type) {
      return NextResponse.json({ message: "Type de politique invalide." }, { status: 400 });
    }

    const body = await req.json();
    const { policies: policiesText } = body;

    if (!policiesText || policiesText.trim() === "") {
      return NextResponse.json({ error: "Le champ politiques est requis." }, { status: 400 });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const existing = await db.query.policies.findFirst({
      columns: { id: true },
      where: eq(policies.type, type),
    });

    if (existing) {
      await db
        .update(policies)
        .set({ policies: policiesText, lastUpdatedAt: now })
        .where(eq(policies.type, type));
    } else {
      await db
        .insert(policies)
        .values({ type, policies: policiesText, lastUpdatedAt: now });
    }

    return NextResponse.json({ success: true, message: "Politiques sauvegardées avec succès." });
  } catch (error) {
    console.error("Error saving policies:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
});
