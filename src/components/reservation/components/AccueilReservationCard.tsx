"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Monitor, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface AccueilReservationCardProps {
  games: string[];
  archived: boolean;
  console: string;
  station: string;
  date: string;
  heure: string;
  onDetailsClick?: () => void;
}

export default function AccueilReservationCard({
  games,
  archived,
  console: consoleType,
  station,
  date,
  heure,
  onDetailsClick,
}: AccueilReservationCardProps) {
  const t = useTranslations();

  return (
    <Card
      className={`${
        archived
          ? "border-red-500 hover:border-red-700"
          : "border-cyan-500 hover:border-cyan-700"
      } w-full max-w-sm bg-[white] overflow-hidden group h-full hover:scale-105 transition-all duration-500 shadow-xl relative`}
    >
      {archived && (
        <div className="absolute top-4 right-4 z-10">
          <span className="flex items-center px-3 py-1 gap-2 rounded-lg bg-red-50 border border-red-200 shadow-sm">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-xs font-semibold text-red-600 uppercase">
              {t("reservation.accueil.cancelled")}
            </span>
          </span>
        </div>
      )}
      <CardContent className="py-5 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div
            className={`${
              archived ? "bg-red-50" : "bg-cyan-50"
            } p-2 rounded-lg`}
          >
            <Monitor
              className={`${
                archived ? "text-red-600" : "text-cyan-600"
              } h-8 w-8`}
            />
          </div>
          <div>
            <p className="text-xl text-gray-500 tracking-wide font-medium">
              {t("reservation.accueil.console")}
            </p>
            <h3 className="font-bold text-gray-900 text-2xl">{consoleType}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {t("reservation.accueil.station")}: {station}
            </p>
          </div>
        </div>

        <div className="flex-grow mb-4">
          <p className="text-xs text-gray-500 tracking-wide font-medium mb-2">
            {t("reservation.accueil.games")}
          </p>
          <div className="space-y-2">
            {games.map((game, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-800"
              >
                <div
                  className={`${
                    archived ? "bg-red-500" : "bg-cyan-500"
                  } flex-shrink-0 h-1.5 w-1.5 rounded-full `}
                ></div>
                <span className="text-sm font-medium">{game}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`${
            archived ? "border-red-500" : "border-cyan-500"
          } grid grid-cols-2 gap-3 mb-4 p-3 border-1 rounded-lg`}
        >
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <Calendar
              className={`${
                archived ? "text-red-500" : "text-cyan-500"
              } h-4 w-4 flex-shrink-0`}
            />
            <div>
              <p className="text-xs text-gray-500">
                {t("reservation.accueil.date")}
              </p>
              <p className="text-sm font-semibold text-gray-800">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <Clock
              className={`${
                archived ? "text-red-500" : "text-cyan-500"
              } h-4 w-4 flex-shrink-0`}
            />
            <div>
              <p className="text-xs text-gray-500">
                {t("reservation.accueil.time")}
              </p>
              <p className="text-sm font-semibold text-gray-800">{heure}</p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className={`${
            archived
              ? "text-red-500 border-red-500 hover:bg-red-500"
              : "text-cyan-500 border-cyan-500 hover:bg-cyan-500"
          } w-full hover:text-white mt-auto transition-colors`}
          onClick={onDetailsClick}
        >
          {t("reservation.accueil.detailsButton")}
        </Button>
      </CardContent>
    </Card>
  );
}
