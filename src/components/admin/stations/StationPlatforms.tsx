"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

const VISIBLE_LIMIT = 3;

/**
 * Plateformes proposées par une station.
 *
 * Cette donnée existait dans la réponse de l'API et ne servait qu'à la
 * recherche locale : la table ne l'affichait nulle part, alors que c'est elle
 * qui décide de ce qu'une station peut accueillir. Au-delà de trois, le reste
 * est replié en « + n » avec la liste complète en infobulle.
 */
export default function StationPlatforms({
  platforms,
}: {
  platforms: string[];
}) {
  const t = useTranslations("admin.stations.table");

  if (platforms.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">{t("noPlatforms")}</span>
    );
  }

  const visible = platforms.slice(0, VISIBLE_LIMIT);
  const hidden = platforms.slice(VISIBLE_LIMIT);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((platform) => (
        <Badge
          key={platform}
          variant="outline"
          className="rounded-full border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200"
        >
          {platform}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <Badge
          variant="outline"
          className="rounded-full text-muted-foreground"
          title={hidden.join(", ")}
        >
          +{hidden.length}
        </Badge>
      )}
    </div>
  );
}
