import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { docs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Lecture publique d'un tutoriel PUBLIC (is_public = 1), avec repli fr quand
 * la variante dans la langue demandée n'existe pas.
 * Les tutoriels admin sont servis par la page /admin/tutorials (accès contrôlé).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const locale =
      request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";

    const row =
      (await db.query.docs.findFirst({
        where: and(
          eq(docs.slug, slug),
          eq(docs.locale, locale),
          eq(docs.isPublic, 1),
        ),
      })) ??
      (locale !== "fr"
        ? await db.query.docs.findFirst({
            where: and(
              eq(docs.slug, slug),
              eq(docs.locale, "fr"),
              eq(docs.isPublic, 1),
            ),
          })
        : null);

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      slug: row.slug,
      locale: row.locale,
      title: row.title,
      content: row.content,
    });
  } catch (error) {
    console.error("Erreur lecture doc:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
