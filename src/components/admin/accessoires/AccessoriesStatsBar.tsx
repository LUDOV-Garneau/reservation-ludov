"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, MonitorX, Package, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AccessoryStats } from "@/components/admin/accessoires/types";
import type {
  PlatformFilter,
  VisibilityFilter,
} from "@/hooks/useAccessoriesFilters";

type TileProps = {
  icon: LucideIcon;
  label: string;
  value?: number;
  loading: boolean;
  accent: string;
  onClick: () => void;
  active: boolean;
};

function Tile({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  onClick,
  active,
}: TileProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer py-0 transition-colors hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring",
        active && "ring-2 ring-cyan-500",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="w-full text-left focus-visible:outline-none"
      >
        <CardContent className="flex items-center gap-3 px-4 py-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              accent,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-12" />
            ) : (
              <p className="text-2xl font-semibold tabular-nums">
                {value ?? "—"}
              </p>
            )}
          </div>
        </CardContent>
      </button>
    </Card>
  );
}

/**
 * Chaque tuile pilote le filtre qu'elle mesure : la stat qui pose la question
 * (« combien d'accessoires sans plateforme ? ») donne aussi la liste.
 *
 * « Sans plateforme » est le vrai signal de travail : après une synchronisation
 * Koha, ce sont les lignes que personne n'a encore rattachées, et donc celles
 * qui ne remonteront jamais dans le parcours de réservation.
 */
export default function AccessoriesStatsBar({
  stats,
  loading,
  visibility,
  platform,
  onVisibilityChange,
  onPlatformChange,
  onReset,
}: {
  stats: AccessoryStats | null;
  loading: boolean;
  visibility: VisibilityFilter;
  platform: PlatformFilter;
  onVisibilityChange: (visibility: VisibilityFilter) => void;
  onPlatformChange: (platform: PlatformFilter) => void;
  onReset: () => void;
}) {
  const t = useTranslations("admin.accessories.stats");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={Package}
        label={t("total")}
        value={stats?.total}
        loading={loading}
        accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
        onClick={onReset}
        active={visibility === "all" && platform === "all"}
      />
      <Tile
        icon={Eye}
        label={t("visible")}
        value={stats?.visible}
        loading={loading}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        onClick={() => onVisibilityChange("visible")}
        active={visibility === "visible"}
      />
      <Tile
        icon={EyeOff}
        label={t("hidden")}
        value={stats?.hidden}
        loading={loading}
        accent="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        onClick={() => onVisibilityChange("hidden")}
        active={visibility === "hidden"}
      />
      <Tile
        icon={MonitorX}
        label={t("withoutConsole")}
        value={stats?.withoutConsole}
        loading={loading}
        accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        onClick={() => onPlatformChange("none")}
        active={platform === "none"}
      />
    </div>
  );
}
