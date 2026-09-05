"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import ReservationPhoto from "./ReservationPhoto";

type ConfirmedConsole = { nom: string; picture?: string | null };
type ConfirmedGame = { nom: string; picture?: string | null };

interface ConfirmedReservationProps {
  reservationId: string;
  date: string;
  heure: string;
  console: ConfirmedConsole | null;
  jeux: ConfirmedGame[];
}

export default function ConfirmedReservation({
  reservationId,
  date,
  heure,
  console: consoleInfo,
  jeux,
}: ConfirmedReservationProps) {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto sm:p-6 mt-20">
      <div className="bg-[white] rounded-2xl shadow-lg px-10 py-10 text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>

        <h2 className="text-4xl font-bold mb-4">
          {t("reservation.confirmation.title")}
        </h2>

        <p className="text-gray-600 mb-6 text-lg">
          {t("reservation.confirmation.subtitle")}
        </p>

        <div className="p-6 bg-cyan-50 border border-cyan-200 rounded-xl mb-8 text-left inline-block">
          <p className="text-sm font-medium text-cyan-900 mb-2">
            {t("reservation.confirmation.detailsTitle")}
          </p>

          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-cyan-500" />
            <span className="text-cyan-800 font-medium">
              {date ? String(date).split("T")[0] : "-"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-cyan-500" />
            <span className="text-cyan-800 font-medium">{heure ?? "-"}</span>
          </div>
        </div>

        {consoleInfo && (
          <div className="mb-8 text-left">
            <p className="text-sm font-medium text-gray-500 mb-3">
              {t("reservation.confirmation.platform")}
            </p>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <ReservationPhoto
                  picture={consoleInfo.picture}
                  name={consoleInfo.nom}
                  sizes="80px"
                  iconClassName="h-8 w-8"
                />
              </div>
              <p className="text-lg font-medium">{consoleInfo.nom}</p>
            </div>
          </div>
        )}

        {jeux.length > 0 && (
          <div className="mb-8 text-left">
            <p className="text-sm font-medium text-gray-500 mb-3">
              {t("reservation.confirmation.games")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {jeux.map((jeu, index) => (
                <div
                  key={`${jeu.nom}-${index}`}
                  className="rounded-xl overflow-hidden shadow-sm border border-gray-100"
                >
                  <div className="relative aspect-[3/4] w-full bg-gray-100">
                    <ReservationPhoto
                      picture={jeu.picture}
                      name={jeu.nom}
                      sizes="(max-width: 640px) 50vw, 200px"
                      icon={Gamepad2}
                      iconClassName="h-10 w-10"
                    />
                  </div>
                  <p className="px-2 py-2 text-sm font-medium line-clamp-2">
                    {jeu.nom}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Button
            variant="outline"
            className="px-6 py-3"
            onClick={() => (window.location.href = "/")}
          >
            {t("reservation.confirmation.goHome")}
          </Button>

          <Button
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600"
            onClick={() => router.push(`/reservation/details/${reservationId}`)}
          >
            {t("reservation.confirmation.detailsBtn")}
          </Button>
        </div>

        {reservationId && (
          <p className="mt-6 text-xs text-gray-400">
            {t("reservation.confirmation.reservationId")} {reservationId}
          </p>
        )}
      </div>
    </div>
  );
}
