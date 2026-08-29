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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, ImagePlus, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { displayConsole, type GameRow } from "@/components/admin/games/types";

type Props = {
  games: GameRow[];
  onEdit: (game: GameRow) => void;
};

/**
 * Vue en tableau : lecture dense, pour le travail en lot. La ligne entière est
 * cliquable à la souris ; le bouton reste le point d'entrée clavier.
 */
export default function GamesImagesTable({ games, onEdit }: Props) {
  const t = useTranslations("admin.gamesImages");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">{t("table.image")}</TableHead>
          <TableHead>{t("table.title")}</TableHead>
          <TableHead className="hidden md:table-cell">
            {t("table.platform")}
          </TableHead>
          <TableHead className="text-center hidden sm:table-cell">
            {t("table.status")}
          </TableHead>
          <TableHead className="text-end">{t("table.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {games.map((game) => (
          <TableRow
            key={game.id}
            onClick={() => onEdit(game)}
            className="cursor-pointer"
          >
            <TableCell>
              {game.picture ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted/30">
                  <Image
                    src={game.picture}
                    alt={game.titre}
                    fill
                    unoptimized
                    loading="lazy"
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-dashed border-amber-300 bg-amber-50/60">
                  <ImageIcon className="h-5 w-5 text-amber-400" />
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium max-w-[280px]">
              <span className="line-clamp-2">{game.titre}</span>
            </TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {displayConsole(game)}
            </TableCell>
            <TableCell className="text-center hidden sm:table-cell">
              {game.picture ? (
                <Badge className="bg-green-100 text-green-800 border-0">
                  {t("status.withImage")}
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-0">
                  {t("status.withoutImage")}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-end">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(game);
                }}
                className="gap-2"
              >
                {game.picture ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {game.picture ? t("editImage") : t("addImage")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
