"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Gamepad2,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Cable,
  Computer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import CancelledBanner from "@/components/reservation/details/CancelledBanner";
import {
  GameCard,
  ConsoleCard,
  AccessoriesSection,
  GAMES_GRID_CLASSES,
} from "@/components/reservation/details/SharedCards";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CancelReservationAlertDialog from "./components/CancelReservationAlertDialog";
import ReservationReminderDialog from "./components/ReservationReminderDialog";

interface Game {
  nom: string;
  picture: string | null;
  biblio?: number;
}

interface Console {
  nom: string;
  picture: string;
}

interface Accessory {
  id: number;
  nom: string;
}

interface ReservationDetailsProps {
  reservationId: string;
  jeux: Game[];
  console: Console;
  accessoires?: Accessory[];
  station?: string | null;
  date: string;
  heure: string;
  archived: boolean;
  cancellationReason?: string | null;
}

type AlertState = {
  show: boolean;
  type: "success" | "destructive";
  title: string;
  message: string;
} | null;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatICSDateTimeLocal(date: Date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(
    date.getDate(),
  )}T${pad2(date.getHours())}${pad2(date.getMinutes())}00`;
}

function toICSDateRange(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const start = new Date(y, m - 1, d, hh, mm, 0);
  const end = new Date(start.getTime() + 60 * 120 * 1000);
  return {
    dtStart: formatICSDateTimeLocal(start),
    dtEnd: formatICSDateTimeLocal(end),
  };
}

function sanitizeICSLine(input?: string) {
  if (!input) return "";
  return input.replace(/\r?\n/g, " ").slice(0, 900);
}

function downloadICS({
  title,
  description,
  date,
  time,
}: {
  title: string;
  description?: string;
  location?: string;
  date: string;
  time: string;
  uid: string;
}) {
  const { dtStart, dtEnd } = toICSDateRange(date, time);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dyonisos//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${sanitizeICSLine(title)}`,
    description ? `DESCRIPTION:${sanitizeICSLine(description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservation.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


function ReservationHeader({
  date,
  heure,
  reservationId,
  consoleName,
  station,
  archived,
  onCancelSuccess,
  onCancelError,
}: {
  date: string;
  heure: string;
  reservationId: string;
  consoleName: string;
  station?: string | null;
  archived: boolean;
  onCancelSuccess: () => void;
  onCancelError: (error: Error) => void;
}) {
  const t = useTranslations();

  const handleAddToCalendar = useCallback(() => {
    downloadICS({
      title: t("reservation.details.pageDetailsTitle"),
      description: `${t(
        "reservation.details.selectedConsole",
      )}: ${consoleName}`,
      date,
      time: heure,
      uid: reservationId,
    });
  }, [consoleName, date, heure, reservationId, t]);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-[white] shadow-sm p-8 mb-8 text-center lg:text-left">
      <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            {t("reservation.details.pageDetailsTitle")}
          </h1>

          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-lg text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <time dateTime={date} className="font-medium">
                {date}
              </time>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-cyan-600" />
              </div>
              <time dateTime={heure} className="font-medium">
                {heure}
              </time>
            </div>

            {station && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Computer className="h-5 w-5 text-cyan-600" />
                  </div>
                  <span className="font-medium">{station}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {!archived && new Date(`${date}T${heure}`) > new Date() && (
          <div className="flex flex-col items-center gap-4 max-w-80 lg:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-600 text-cyan-600 hover:bg-cyan-50 font-medium w-full"
              aria-label={t("reservation.details.addToCalendar")}
              onClick={handleAddToCalendar}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {t("reservation.details.addToCalendar")}
            </Button>

            <ReservationReminderDialog
              reservationId={reservationId}
              onSendReminder={() => {}}
              onError={() => {}}
            />

            <CancelReservationAlertDialog
              reservationId={reservationId}
              onSuccess={onCancelSuccess}
              onError={onCancelError}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailsReservation({
  reservationId,
  jeux = [],
  console,
  station,
  accessoires = [],
  date,
  heure,
  archived,
  cancellationReason,
}: ReservationDetailsProps) {
  const t = useTranslations();
  const [alert, setAlert] = useState<AlertState>(null);
  // Feedback immédiat : l'annulation bascule l'affichage sans rechargement.
  const [isCancelled, setIsCancelled] = useState(archived);

  const handleCancelSuccess = useCallback(() => {
    setIsCancelled(true);
    setAlert({
      show: true,
      type: "success",
      title: "Réservation annulée",
      message: "Votre réservation a été annulée avec succès.",
    });
  }, []);

  const handleCancelError = useCallback((error: Error) => {
    setAlert({
      show: true,
      type: "destructive",
      title: "Erreur",
      message: error.message || "Impossible d'annuler la réservation.",
    });
  }, []);

  return (
    <div className="sm:bg-[white] rounded-lg mb-10">
      <div className="sm:px-4 sm:py-8 lg:px-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="text-gray-600 hover:text-cyan-600"
                >
                  {t("reservation.layout.home")}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-gray-900 font-medium">
                  {t("reservation.details.titleSection")}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>

        {alert?.show && (
          <Alert
            variant={alert.type === "destructive" ? "destructive" : "default"}
            className={`mb-6 ${
              alert.type === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : ""
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {alert.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <AlertTitle className="font-semibold">
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription>
                    {alert.type === "destructive"
                      ? alert.message ||
                        "Une erreur est survenue. Veuillez essayer ultérieurement."
                      : alert.message}
                  </AlertDescription>
                </div>
              </div>
              <button
                onClick={() => setAlert(null)}
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-lg leading-none transition-colors ${
                  alert.type === "destructive"
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
                aria-label="Fermer l'alerte"
              >
                ×
              </button>
            </div>
          </Alert>
        )}

        {isCancelled && <CancelledBanner reason={cancellationReason} />}

        <ReservationHeader
          date={date}
          heure={heure}
          reservationId={reservationId}
          consoleName={console.nom}
          station={station}
          archived={isCancelled}
          onCancelSuccess={handleCancelSuccess}
          onCancelError={handleCancelError}
        />

        {/* CONTAINER */}
        <div className="md:mx-5 flex flex-col gap-10">
          {/* JEUX */}
          <div>
            {/* TEXTE DE SECTION */}
            <div className="flex items-center gap-3 mb-6">
              <Gamepad2 className="h-6 w-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t("reservation.details.selectedGames")}
              </h2>
            </div>
            {/* LAYOUT DES CARTES */}
            {jeux.length > 0 ? (
              <div className={GAMES_GRID_CLASSES}>
                {jeux.map((jeu, index) => (
                  <div
                    key={jeu.biblio ?? `game-${index}`}
                    className="mb-6 last:mb-0"
                  >
                    <GameCard game={jeu} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Card>
                  <CardContent className="p-12 text-center">
                    <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      {t("reservation.details.noGames")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          {/* CONSOLE ET ACCESSOIRS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CONSOLES */}
            <div>
              {/* TEXTE DE SECTION */}
              <div className="flex items-center gap-3 mb-6">
                <Monitor className="h-6 w-6 text-cyan-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("reservation.details.selectedConsole")}
                </h2>
              </div>
              {/* CONSOLES */}
              <div>
                <ConsoleCard item={console} />
              </div>
            </div>
            {/* ACCESSOIRS */}
            <div>
              {/* TEXTE DE SECTION */}
              <div className="flex items-center gap-3 mb-6">
                <Cable className="h-6 w-6 text-cyan-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("reservation.details.selectedAccessory")}
                </h2>
              </div>
              {/* CARTE */}
              <div>
                <AccessoriesSection accessories={accessoires} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
