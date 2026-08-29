"use client";

import Image from "next/image";
import { ImageIcon, ImagePlus, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { displayConsole, type GameRow } from "@/components/admin/games/types";

type Props = {
  games: GameRow[];
  onEdit: (game: GameRow) => void;
};

/**
 * Vue en grille : la jaquette occupe l'essentiel de la carte, et les jeux sans
 * image affichent un emplacement franchement vide — c'est ce qui permet de
 * repérer les manques d'un coup d'œil, la raison d'être de cet écran.
 */
export default function GamesImagesGrid({ games, onEdit }: Props) {
  const t = useTranslations("admin.gamesImages");

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {games.map((game) => (
        <button
          key={game.id}
          type="button"
          onClick={() => onEdit(game)}
          aria-label={
            game.picture
              ? t("editImageFor", { title: game.titre })
              : t("addImageFor", { title: game.titre })
          }
          className="group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        >
          <div className="relative aspect-[3/4] w-full bg-muted/30">
            {game.picture ? (
              <Image
                src={game.picture}
                alt={game.titre}
                fill
                unoptimized
                loading="lazy"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 bg-amber-50/60">
                <ImageIcon className="h-8 w-8 text-amber-400" />
                <span className="px-2 text-center text-[11px] font-medium text-amber-700">
                  {t("status.withoutImage")}
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
                {game.picture ? (
                  <Pencil className="h-3.5 w-3.5" />
                ) : (
                  <ImagePlus className="h-3.5 w-3.5" />
                )}
                {game.picture ? t("editImage") : t("addImage")}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 p-2">
            <span className="line-clamp-2 block text-sm font-medium leading-snug">
              {game.titre}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {displayConsole(game)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
