"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Computer, MonitorCheck, MonitorX, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { StationStats } from "@/components/admin/stations/types";
import type { StationStatusFilter } from "@/lib/stationsQuery";

type TileProps = {
  icon: LucideIcon;
  label: string;
  value?: number | string;
  loading: boolean;
  accent: string;
  onClick?: () => void;
  active?: boolean;
};

function Tile({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  onClick,
  active = false,
}: TileProps) {
  const body = (
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
          <p
            className={cn(
              "truncate font-semibold tabular-nums",
              typeof value === "number" ? "text-2xl" : "text-lg",
            )}
            title={typeof value === "string" ? value : undefined}
          >
            {value ?? "—"}
          </p>
        )}
      </div>
    </CardContent>
  );

  // La tuile « la plus réservée » ne correspond à aucun filtre : elle reste une
  // information, pas un bouton.
  if (!onClick) {
    return <Card className="py-0">{body}</Card>;
  }

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
        {body}
      </button>
    </Card>
  );
}

/** Chaque tuile chiffrée pilote le filtre qu'elle mesure. */
export default function StationsStatsBar({
  stats,
  loading,
  status,
  onStatusChange,
}: {
  stats: StationStats;
  loading: boolean;
  status: StationStatusFilter;
  onStatusChange: (status: StationStatusFilter) => void;
}) {
  const t = useTranslations("admin.stations.stats");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={Computer}
        label={t("totalStations")}
        value={stats.active + stats.inactive}
        loading={loading}
        accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
        onClick={() => onStatusChange("all")}
        active={status === "all"}
      />
      <Tile
        icon={MonitorCheck}
        label={t("activeStations")}
        value={stats.active}
        loading={loading}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        onClick={() => onStatusChange("active")}
        active={status === "active"}
      />
      <Tile
        icon={MonitorX}
        label={t("inactiveStations")}
        value={stats.inactive}
        loading={loading}
        accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        onClick={() => onStatusChange("inactive")}
        active={status === "inactive"}
      />
      <Tile
        icon={Trophy}
        label={t("mostUsedStation")}
        value={stats.mostUsed ?? t("noStations")}
        loading={loading}
        accent="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
      />
    </div>
  );
}
