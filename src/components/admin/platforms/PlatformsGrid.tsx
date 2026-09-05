"use client";

import Image from "next/image";
import { Gamepad2, ImageIcon, MapPin, Monitor, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  BookableBadge,
  PhotoBadge,
} from "@/components/admin/platforms/PlatformBadges";
import type { PlatformRow } from "@/components/admin/platforms/types";

type Props = {
  platforms: PlatformRow[];
  onEdit: (platform: PlatformRow) => void;
};

/**
 * Vue en grille : la photo occupe le haut de la carte, et une plateforme sans
 * photo affiche un emplacement franchement vide — c'est ce qui permet de
 * repérer les manques d'un coup d'œil. Sous la photo, les trois compteurs qui
 * disent si la plateforme est réellement proposable.
 */
export default function PlatformsGrid({ platforms, onEdit }: Props) {
  const t = useTranslations("admin.platforms");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          type="button"
          onClick={() => onEdit(platform)}
          aria-label={t("editFor", { name: platform.name })}
          className="group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        >
          <div className="relative aspect-[4/3] w-full bg-muted/30">
            {platform.picture ? (
              <Image
                src={platform.picture}
                alt={platform.name}
                fill
                unoptimized
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-contain p-3"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30">
                <ImageIcon className="h-8 w-8 text-amber-400" />
                <span className="px-2 text-center text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {t("status.withoutPhoto")}
                </span>
              </div>
            )}

            {/* Purement visuel : la carte entière porte déjà l'action, un vrai
                bouton ici serait un élément interactif imbriqué. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow">
                <Pencil className="h-3.5 w-3.5" />
                {t("edit")}
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="flex items-start gap-2">
              <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
              <span className="line-clamp-2 text-sm font-semibold leading-snug">
                {platform.name}
              </span>
            </div>

            <p className="line-clamp-2 min-h-[2rem] text-xs text-muted-foreground">
              {platform.description || t("card.noDescription")}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                {t("card.units", {
                  active: platform.unitsActive,
                  total: platform.unitsTotal,
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {t("card.stations", { count: platform.stationsCount })}
              </span>
              <span className="inline-flex items-center gap-1">
                <Gamepad2 className="h-3.5 w-3.5" />
                {t("card.games", { count: platform.gamesCount })}
              </span>
            </div>

            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              <PhotoBadge platform={platform} />
              <BookableBadge platform={platform} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
