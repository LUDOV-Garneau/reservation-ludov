"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CircleSlash,
  ImageOff,
  ImageIcon,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PlatformStats } from "@/components/admin/platforms/types";
import type { PhotoFilter } from "@/hooks/usePlatformsFilters";

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

function Tile({
  icon: Icon,
  label,
  value,
  loading,
  accent,
  onClick,
  active,
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
 * Les trois premières tuiles pilotent le filtre photo : la stat qui pose la
 * question (« combien de plateformes sans photo ? ») donne aussi la liste.
 *
 * La dernière est informative — « non réservable » se lit sur chaque carte, et
 * en faire un filtre demanderait un quatrième état d'URL pour un cas rare. Elle
 * est rendue sans curseur ni anneau pour que l'absence de clic se voie.
 */
export default function PlatformsStatsBar({
  stats,
  loading,
  photo,
  onPhotoChange,
}: {
  stats: PlatformStats | null;
  loading: boolean;
  photo: PhotoFilter;
  onPhotoChange: (photo: PhotoFilter) => void;
}) {
  const t = useTranslations("admin.platforms.stats");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={Monitor}
        label={t("total")}
        value={stats?.total}
        loading={loading}
        accent="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
        onClick={() => onPhotoChange("all")}
        active={photo === "all"}
      />
      <Tile
        icon={ImageIcon}
        label={t("withPhoto")}
        value={stats?.withPhoto}
        loading={loading}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        onClick={() => onPhotoChange("yes")}
        active={photo === "yes"}
      />
      <Tile
        icon={ImageOff}
        label={t("withoutPhoto")}
        value={stats?.withoutPhoto}
        loading={loading}
        accent="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        onClick={() => onPhotoChange("no")}
        active={photo === "no"}
      />
      <Tile
        icon={CircleSlash}
        label={t("unbookable")}
        value={stats?.unbookable}
        loading={loading}
        accent="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
      />
    </div>
  );
}
