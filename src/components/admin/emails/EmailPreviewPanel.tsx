"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Info, Mail } from "lucide-react";
import type { EmailPreview } from "@/lib/emailPreview";

/**
 * Rendu du gabarit tel que le serveur le composera.
 *
 * Le seul moyen de voir un gabarit était jusqu'ici de s'envoyer un courriel de
 * test — bouton désactivé tant qu'il restait des modifications, donc il fallait
 * publier en production ce qu'on voulait justement relire avant.
 *
 * Le rendu passe par un `iframe` en bac à sable plutôt que par
 * `dangerouslySetInnerHTML`. Le texte des zones n'est volontairement pas
 * échappé — le serveur ne l'échappe pas non plus, c'est ce qui permet d'écrire
 * un `<strong>` — donc l'assainir ici ferait mentir la prévisualisation. Le
 * bac à sable, lui, neutralise les scripts sans rien changer à l'apparence :
 * c'est exactement ce que fait un client de messagerie.
 */
export default function EmailPreviewPanel({
  preview,
  zoneLabel,
}: {
  preview: EmailPreview;
  zoneLabel: (zone: string) => string;
}) {
  const t = useTranslations("admin.emails.preview");

  const document = useMemo(() => {
    const sections = preview.zones
      .map(({ zone, html }) => {
        const titre = zoneLabel(zone);
        const corps =
          html ||
          `<p style="margin:0;color:#9ca3af;font-style:italic;">${t("emptyZone")}</p>`;
        return `<section><h2>${titre}</h2>${corps}</section>`;
      })
      .join("");

    return `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { margin:0; padding:20px; background:#fff; color:#374151;
         font-family: ui-sans-serif, system-ui, sans-serif; font-size:15px; }
  section { margin: 0 0 22px 0; }
  section:last-child { margin-bottom: 0; }
  h2 { margin:0 0 6px 0; font-size:11px; font-weight:600; letter-spacing:.06em;
       text-transform:uppercase; color:#9ca3af; }
  p { line-height: 1.6; }
</style></head><body>${sections}</body></html>`;
  }, [preview.zones, zoneLabel, t]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="text-xs text-muted-foreground">{t("sampleHint")}</p>
      </div>

      {preview.unknownVariables.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {t("unknown", {
            variables: preview.unknownVariables.map((v) => `{${v}}`).join(", "),
          })}
        </p>
      )}

      {preview.unusedVariables.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t("unused", {
            variables: preview.unusedVariables.map((v) => `{${v}}`).join(", "),
          })}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border">
        {/* L'objet est la premiere chose que voit le destinataire ; il se
            relisait mal noye dans un champ de formulaire. */}
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">
            {preview.subject || (
              <span className="italic text-muted-foreground">
                {t("noSubject")}
              </span>
            )}
          </span>
        </div>

        <iframe
          title={t("title")}
          // Bac a sable total : aucun script, aucune navigation, aucun acces
          // au document parent.
          sandbox=""
          srcDoc={document}
          className="h-[420px] w-full bg-white"
        />
      </div>
    </div>
  );
}
