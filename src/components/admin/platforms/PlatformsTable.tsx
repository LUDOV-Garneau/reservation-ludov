"use client";

import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ImageIcon, Pencil } from "lucide-react";
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
 * Vue en tableau : lecture dense, pour comparer les plateformes entre elles.
 * La ligne entière est cliquable à la souris ; le bouton reste le point
 * d'entrée clavier.
 */
export default function PlatformsTable({ platforms, onEdit }: Props) {
  const t = useTranslations("admin.platforms");

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">{t("table.photo")}</TableHead>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead className="hidden text-center md:table-cell">
              {t("table.units")}
            </TableHead>
            <TableHead className="hidden text-center md:table-cell">
              {t("table.stations")}
            </TableHead>
            <TableHead className="hidden text-center lg:table-cell">
              {t("table.games")}
            </TableHead>
            <TableHead className="hidden text-center sm:table-cell">
              {t("table.status")}
            </TableHead>
            <TableHead className="text-end">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {platforms.map((platform) => (
            <TableRow
              key={platform.id}
              onClick={() => onEdit(platform)}
              className="cursor-pointer"
            >
              <TableCell>
                {platform.picture ? (
                  <div className="relative h-14 w-16 overflow-hidden rounded-md bg-muted/30">
                    <Image
                      src={platform.picture}
                      alt={platform.name}
                      fill
                      unoptimized
                      loading="lazy"
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-16 items-center justify-center rounded-md border-2 border-dashed border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30">
                    <ImageIcon className="h-5 w-5 text-amber-400" />
                  </div>
                )}
              </TableCell>

              <TableCell className="max-w-[320px]">
                <span className="block font-medium">{platform.name}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {platform.description || t("card.noDescription")}
                </span>
              </TableCell>

              <TableCell className="hidden text-center tabular-nums md:table-cell">
                {t("card.units", {
                  active: platform.unitsActive,
                  total: platform.unitsTotal,
                })}
              </TableCell>
              <TableCell className="hidden text-center tabular-nums md:table-cell">
                {platform.stationsCount}
              </TableCell>
              <TableCell className="hidden text-center tabular-nums lg:table-cell">
                {platform.gamesCount}
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <div className="flex flex-wrap justify-center gap-1.5">
                  <PhotoBadge platform={platform} />
                  <BookableBadge platform={platform} />
                </div>
              </TableCell>

              <TableCell className="text-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(platform);
                  }}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  {t("edit")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
