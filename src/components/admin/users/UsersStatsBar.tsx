"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, MailWarning, Users, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserStats } from "./types";
import type { StatusFilter } from "@/hooks/useAdminUsersFilters";

type TileProps = {
  icon: LucideIcon;
  label: string;
  value?: number;
  loading: boolean;
  accent: string;
  /** Absent = tuile purement informative, sans affordance de clic. */
  onClick?: () => void;
  active?: boolean;
};

function Tile({ icon: Icon, label, value, loading, accent, onClick, active }: TileProps) {
  const body = (
    <CardContent className="flex items-center gap-3 px-4 py-3">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-7 w-12" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums">{value ?? "—"}</p>
        )}
      </div>
    </CardContent>
  );

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

/**
 * Les deux premières tuiles pilotent le filtre de statut : la stat qui pose la
 * question (« combien de comptes jamais configurés ? ») donne aussi la liste.
 *
 * La troisième reste informative — filtrer sur « a une réservation »
 * demanderait une jointure sur `reservation` dans la liste — et elle est rendue
 * sans curseur ni anneau pour que l'absence de clic se voie.
 */
export default function UsersStatsBar({
  stats,
  loading,
  status,
  onStatusChange,
}: {
  stats: UserStats | null;
  loading: boolean;
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
}) {
  const t = useTranslations("admin.users.stats");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile
        icon={Users}
        label={t("totalUsers")}
        value={stats?.totalUser}
        loading={loading}
        accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
        onClick={() => onStatusChange("all")}
        active={status === "all"}
      />
      <Tile
        icon={MailWarning}
        label={t("userNotBoarded")}
        value={stats?.totalUserNotBoarded}
        loading={loading}
        accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        onClick={() => onStatusChange("pending")}
        active={status === "pending"}
      />
      <Tile
        icon={CalendarCheck}
        label={t("userWithReservations")}
        value={stats?.totalUserWithReservation}
        loading={loading}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      />
    </div>
  );
}
