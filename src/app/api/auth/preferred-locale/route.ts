import { NextResponse } from "next/server";
import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/withAuth";

/** Mémorise la langue préférée (courriels) quand l'utilisateur change de langue. */
export const POST = withAuth(async (req, user) => {
  try {
    const { locale } = (await req.json().catch(() => ({}))) as {
      locale?: string;
    };
    if (locale !== "fr" && locale !== "en") {
      return NextResponse.json(
        { success: false, error: "Locale invalide." },
        { status: 400 },
      );
    }

    await db
      .update(users)
      .set({ preferredLocale: locale })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur preferred-locale:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 },
    );
  }
});
