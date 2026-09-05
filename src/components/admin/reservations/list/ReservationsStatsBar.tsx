"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, CalendarCheck, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ReservationMetrics } from "./hooks/useReservations";
import type { ReservationStatusFilter } from "@/lib/reservationsQuery";

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
 * (« combien d'annulations ? ») donne aussi la liste.
 *
 * Les compteurs sont globaux et ne suivent pas les filtres — c'est un tableau
 * de bord, pas un décompte du filtre courant. Ce dernier est annoncé par la
 * barre de filtres.
 *
 * « Total » exclut les annulées, donc `total = à venir + passées` : sans la
 * quatrième tuile, les annulations n'apparaissaient nulle part alors que l'API
 * les compte depuis toujours.
 */
export default function ReservationsStatsBar({
  metrics,
  loading,
  status,
  onStatusChange,
  onReset,
}: {
  metrics: ReservationMetrics;
  loading: boolean;
  status: ReservationStatusFilter;
  onStatusChange: (status: ReservationStatusFilter) => void;
  onReset: () => void;
}) {
  const t = useTranslations("admin.reservations.stats");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={CalendarDays}
        label={t("totalReservations")}
        value={metrics.total}
        loading={loading}
        accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
        onClick={onReset}
        active={status === "all"}
      />
      <Tile
        icon={Clock}
        label={t("upcomingReservations")}
        value={metrics.future}
        loading={loading}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        onClick={() => onStatusChange("upcoming")}
        active={status === "upcoming"}
      />
      <Tile
        icon={CalendarCheck}
        label={t("pastReservations")}
        value={metrics.past}
        loading={loading}
        accent="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        onClick={() => onStatusChange("past")}
        active={status === "past"}
      />
      <Tile
        icon={XCircle}
        label={t("cancelledReservations")}
        value={metrics.cancelled}
        loading={loading}
        accent="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        onClick={() => onStatusChange("cancelled")}
        active={status === "cancelled"}
      />
    </div>
  );
}
