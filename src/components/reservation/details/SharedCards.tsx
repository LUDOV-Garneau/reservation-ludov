"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Gamepad2, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Cartes partagées des pages de détails de réservation (client et admin) :
 * une seule implémentation pour garantir un affichage uniforme.
 */

export type DetailsGame = {
  nom: string;
  picture: string | null;
  biblio?: number;
};

export type DetailsConsole = {
  nom: string;
  picture?: string | null;
};

export type DetailsAccessory = {
  id: number;
  nom: string;
};

/** Grille commune des jeux (identique côté client et admin). */
export const GAMES_GRID_CLASSES =
  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

export function GameCard({ game }: { game: DetailsGame }) {
  const t = useTranslations();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg rounded-xl border-gray-200 shadow-md flex flex-col p-0 flex-1">
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="relative w-full h-96 bg-gray-100">
          {game.picture ? (
            <Image
              src={game.picture}
              alt={game.nom}
              fill
              className="object-contain p-4"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gamepad2 className="h-16 w-16 text-gray-300" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-6">
          <h3 className="text-xl font-semibold text-gray-900 text-center line-clamp-2 mb-4">
            {game.nom}
          </h3>

          <div className="flex-1" />

          {game.biblio && (
            <Link
              href={`https://ludov.inlibro.net/cgi-bin/koha/opac-detail.pl?biblionumber=${game.biblio}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-cyan-500 hover:bg-cyan-600 transition-colors w-full">
                {t("reservation.details.detailsButton")}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ConsoleCard({ item }: { item: DetailsConsole }) {
  return (
    <Card className="flex-1 overflow-hidden group border-gray-200 shadow-md p-0">
      <CardContent className="p-0 relative flex-1 min-h-[280px]">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
          {item.picture ? (
            <Image
              src={item.picture}
              alt={item.nom}
              fill
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cyan-500">
              <Monitor className="h-32 w-32 text-cyan-900" aria-hidden="true" />
            </div>
          )}

          <div
            className={
              item.picture
                ? `absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent`
                : `group-hover:from-black/90 transition-all duration-500`
            }
          />
        </div>

        <div className="relative z-10 flex flex-col justify-end h-full p-6">
          <div className="transform transition-transform duration-500">
            <h4 className="text-3xl font-black text-white mb-2 drop-shadow-2xl">
              {item.nom}
            </h4>

            <div className="h-1 bg-cyan-500 rounded-full w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccessoriesSection({
  accessories,
}: {
  accessories: DetailsAccessory[];
}) {
  const t = useTranslations();
  if (!accessories?.length) {
    return (
      <Card className="w-full flex-1 border-gray-200 shadow-md">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[160px]">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg text-gray-400 italic">
            {t("reservation.details.noAccessory")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full flex-1 p-0 border-gray-200 shadow-md">
      <CardContent className="p-6">
        <div className="flex gap-2 flex-wrap">
          {accessories.map((accessory) => (
            <div
              key={accessory.id}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-cyan-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-500 group-hover:animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                {accessory.nom}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
