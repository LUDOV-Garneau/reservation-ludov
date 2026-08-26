import { NextResponse } from "next/server";
import db from "@/db";
import { docs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

const isLocale = (value: string | null): value is "fr" | "en" =>
  value === "fr" || value === "en";

/** Lecture d'un doc (admin), avec repli fr. */
export const GET = withAdmin<{ slug: string }>(async (req, _admin, params) => {
  try {
    const localeParam = new URL(req.url).searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : "fr";

    const row = await db.query.docs.findFirst({
      where: and(eq(docs.slug, params.slug), eq(docs.locale, locale)),
    });
    const fallback =
      !row && locale !== "fr"
        ? await db.query.docs.findFirst({
            where: and(eq(docs.slug, params.slug), eq(docs.locale, "fr")),
          })
        : null;

    const found = row ?? fallback;
    if (!found) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      slug: found.slug,
      locale: found.locale,
      requestedLocale: locale,
      title: found.title,
      content: found.content,
      isPublic: found.isPublic === 1,
      updatedAt: found.updatedAt,
    });
  } catch (error) {
    console.error("Erreur lecture doc admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});

/** Sauvegarde d'un doc (admin) pour une langue donnée. */
export const PUT = withAdmin<{ slug: string }>(async (req, admin, params) => {
  try {
    const localeParam = new URL(req.url).searchParams.get("locale");
    const locale = isLocale(localeParam) ? localeParam : "fr";

    const body = (await req.json().catch(() => null)) as {
      title?: string;
      content?: string;
    } | null;
    const title = body?.title?.trim();
    const content = body?.content;
    if (!title || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { success: false, error: "Titre et contenu requis." },
        { status: 400 },
      );
    }

    // Le slug doit exister en fr (créé par la migration) : pas de création
    // libre de nouvelles pages ici.
    const reference = await db.query.docs.findFirst({
      columns: { slug: true, isPublic: true },
      where: and(eq(docs.slug, params.slug), eq(docs.locale, "fr")),
    });
    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Document inconnu." },
        { status: 404 },
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const existing = await db.query.docs.findFirst({
      columns: { slug: true },
      where: and(eq(docs.slug, params.slug), eq(docs.locale, locale)),
    });

    if (existing) {
      await db
        .update(docs)
        .set({ title, content, updatedAt: now, updatedBy: admin.id })
        .where(and(eq(docs.slug, params.slug), eq(docs.locale, locale)));
    } else {
      await db.insert(docs).values({
        slug: params.slug,
        locale,
        title,
        content,
        isPublic: reference.isPublic,
        updatedAt: now,
        updatedBy: admin.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur sauvegarde doc:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la sauvegarde." },
      { status: 500 },
    );
  }
});
