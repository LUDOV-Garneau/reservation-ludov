"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { isBookable } from "@/components/admin/platforms/platformsLogic";
import type { PlatformRow } from "@/components/admin/platforms/types";

/**
 * Deux pastilles partagées par la grille, le tableau et la fiche, pour qu'un
 * même état ne soit jamais dessiné de deux façons différentes.
 */

export function PhotoBadge({ platform }: { platform: PlatformRow }) {
  const t = useTranslations("admin.platforms.status");

  return platform.picture ? (
    <Badge className="border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      {t("withPhoto")}
    </Badge>
  ) : (
    <Badge className="border-0 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
      {t("withoutPhoto")}
    </Badge>
  );
}

export function BookableBadge({ platform }: { platform: PlatformRow }) {
  const t = useTranslations("admin.platforms.status");

  return isBookable(platform) ? (
    <Badge className="border-0 bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
      {t("bookable")}
    </Badge>
  ) : (
    <Badge className="border-0 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
      {t("unbookable")}
    </Badge>
  );
}
