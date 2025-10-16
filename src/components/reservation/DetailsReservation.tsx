"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock9, Gamepad2, Monitor } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Jeu = { nom: string; biblio: number | undefined };
type Console = { nom: string };
type Accessoire = { nom: string };

type DetailsReservationProps = {
  jeux: Jeu[];
  console: Console;
  accessoires?: Accessoire[];
  station: string;
  date: string;
  heure: string;
};

function CarteJeu({ nom, biblio }: { nom: string; biblio: number | undefined }) {
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 rounded-lg border bg-white p-6 shadow-sm">
      {/* Imagen */}
      <div className="relative h-56 w-full lg:h-64 lg:w-64 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src="/image_game.jpg"
          alt={nom}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 256px"
          priority
        />
      </div>

      {/* Contenedor de texto */}
      <div className="relative flex flex-col items-center text-center w-full h-auto lg:h-64">
        <h4 className="text-2xl font-semibold text-gray-800">{nom}</h4>

        {biblio && (
          <Link
            href={`https://ludov.inlibro.net/cgi-bin/koha/opac-detail.pl?biblionumber=${biblio}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 lg:mt-0 lg:absolute lg:bottom-4 lg:left-1/2 lg:-translate-x-1/2"
          >
            <Button
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-cyan-500 hover:bg-transparent hover:text-cyan-400 text-sm lg:text-base"
            >
              Plus de détails sur le jeu
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function CarteConsole({ nom }: { nom: string }) {
  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 rounded-lg border bg-white p-6 shadow-sm">
      <div className="relative h-56 w-full lg:h-64 lg:w-64 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src="/placeholder_consoles.jpg"
          alt={nom}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 256px"
          priority
        />
      </div>

      <div className="flex w-full items-start justify-center lg:justify-start">
        <h4 className="text-2xl font-semibold text-gray-800 text-center lg:text-left">{nom}</h4>
      </div>
    </div>
  );
}

export default function DetailsReservation({
  jeux,
  console,
  accessoires,
  station,
  date,
  heure,
}: DetailsReservationProps) {
  return (
    <div className="mx-auto max-w-6xl p-4 xl:p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <h2 className="text-3xl lg:text-4xl font-bold border-b-4 border-cyan-300 pb-2">
          Votre réservation
        </h2>

        <div className="w-full lg:w-auto flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between rounded-md border bg-white p-3 shadow-sm">
          {date && heure && (
            <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap md:mr-auto lg:mr-8">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-5 w-5 flex-shrink-0" />
                {date}
              </span>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock9 className="h-5 w-5 flex-shrink-0" />
                {heure}
              </span>
            </span>
          )}

          <div className="flex flex-col gap-2 md:flex-row md:gap-2 w-full md:w-auto md:ml-auto">
            <Button
              type="button"
              className="h-auto py-1 px-3 w-full md:w-auto bg-cyan-300 text-black hover:bg-cyan-500 whitespace-nowrap text-sm"
            >
              Ajouter dans mon calendrier
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-auto py-1 px-3 w-full md:w-auto whitespace-nowrap text-sm"
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold mb-4">Jeux sélectionnés</h3>
          {jeux.map((jeu, index) => (
            <CarteJeu key={`${jeu.nom}-${index}`} nom={jeu.nom} biblio={jeu.biblio} />
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold mb-4">Console</h3>
          <CarteConsole nom={console.nom} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[70%_30%] gap-6">
        {!!accessoires?.length && (
          <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-cyan-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Gamepad2 className="h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  Accessoires inclus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {accessoires.map((acc) => (
                    <span
                      key={acc.nom}
                      className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm border"
                    >
                      {acc.nom}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Monitor className="h-6 w-6 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                Station assignée
              </h3>
              <p className="font-medium text-gray-700">{station}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}