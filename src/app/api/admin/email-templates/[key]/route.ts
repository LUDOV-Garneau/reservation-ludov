import { NextResponse } from "next/server";
import db from "@/db";
import { emailTemplates } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import {
  clearTemplateCache,
  findUnknownVariables,
  isEmailLocale,
  isEmailTemplateKey,
  TEMPLATE_ZONES,
} from "@/lib/emailTemplates";

/** Sauvegarde d'un gabarit (sujet + zones) pour une clé et une langue. */
export const PUT = withAdmin<{ key: string }>(async (req, admin, params) => {
  try {
    const key = params.key;
    if (!isEmailTemplateKey(key)) {
      return NextResponse.json(
        { success: false, error: "Gabarit inconnu." },
        { status: 404 },
      );
    }

    const locale = new URL(req.url).searchParams.get("locale") ?? "fr";
    if (!isEmailLocale(locale)) {
      return NextResponse.json(
        { success: false, error: "Locale invalide." },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      subject?: string;
      zones?: Record<string, string>;
    } | null;

    const subject = body?.subject?.trim();
    const zones = body?.zones;
    if (!subject || !zones || typeof zones !== "object") {
      return NextResponse.json(
        { success: false, error: "Sujet et zones requis." },
        { status: 400 },
      );
    }

    // Seules les zones attendues par ce gabarit sont acceptées.
    const expectedZones = TEMPLATE_ZONES[key];
    const cleanZones: Record<string, string> = {};
    for (const zone of expectedZones) {
      const value = zones[zone];
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          { success: false, error: `Zone manquante : ${zone}` },
          { status: 400 },
        );
      }
      cleanZones[zone] = value.trim();
    }

    const unknown = findUnknownVariables(key, {
      subject,
      zones: cleanZones,
    });
    if (unknown.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Variable(s) inconnue(s) pour ce gabarit : ${unknown
            .map((v) => `{${v}}`)
            .join(", ")}`,
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const existing = await db.query.emailTemplates.findFirst({
      columns: { templateKey: true },
      where: and(
        eq(emailTemplates.templateKey, key),
        eq(emailTemplates.locale, locale),
      ),
    });

    if (existing) {
      await db
        .update(emailTemplates)
        .set({ subject, zones: cleanZones, updatedAt: now, updatedBy: admin.id })
        .where(
          and(
            eq(emailTemplates.templateKey, key),
            eq(emailTemplates.locale, locale),
          ),
        );
    } else {
      await db.insert(emailTemplates).values({
        templateKey: key,
        locale,
        subject,
        zones: cleanZones,
        updatedAt: now,
        updatedBy: admin.id,
      });
    }

    clearTemplateCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur sauvegarde gabarit courriel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la sauvegarde." },
      { status: 500 },
    );
  }
});
