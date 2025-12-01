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
  User,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import DeleteReservationAction from "./DeleteReservationAction";

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
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  jeux: Game[];
  console: Console;
  accessoires?: Accessory[];
  station?: number | null;
  date: string;
  heure: string;
  archived: boolean;
}

type AlertState = {
  show: boolean;
  type: "success" | "error";
  title: string;
  message: string;
} | null;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatICSDateTimeLocal(date: Date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(
    date.getDate()
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

function GameCard({ game }: { game: Game }) {
  const t = useTranslations();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-xl rounded-xl flex flex-col p-0 flex-1">
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
              <Gamepad2
                className="h-16 w-16 text-gray-300"
                aria-hidden="true"
              />
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
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 transition-colors w-full"
                size="default"
              >
                {t("reservation.details.detailsButton")}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ConsoleCard({ item }: { item: Console }) {
  return (
    <Card className="h-full overflow-hidden group border-0 shadow-xl p-0">
      <CardContent className="p-0 relative h-full min-h-[280px]">
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

function AccessoriesSection({ accessories }: { accessories: Accessory[] }) {
  const t = useTranslations();
  if (!accessories?.length) {
    return (
      <Card className="w-full h-full">
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
    <Card className="w-full h-full p-0">
      <CardContent className="p-6">
        <div className="flex gap-2 flex-wrap">
          {accessories.map((accessory) => (
            <div
              key={accessory.id}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all duration-200 shadow-sm hover:shadow-md group"
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

function ReservationHeader({
  date,
  heure,
  reservationId,
  station,
  archived,
  firstname,
  lastname,
  email,
  user_id,
  onAlert,
  onCancelSuccess,
}: {
  date: string;
  heure: string;
  reservationId: string;
  consoleName: string;
  station?: number | null;
  archived: boolean;
  firstname: string;
  lastname: string;
  email: string;
  user_id: number;
  onAlert: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
  onCancelSuccess: () => void;
  onCancelError: (error: Error) => void;
}) {
  const t = useTranslations();

  return (
    <div className="relative overflow-hidden rounded-xl border bg-[white] shadow-sm p-8 mb-8 text-center lg:text-left">
      <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Détails de la réservation
          </h1>

          {firstname && lastname && (
            <div className="flex items-center justify-center lg:justify-start gap-3 text-xl text-gray-700">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <User className="h-5 w-5 text-cyan-600" />
              </div>
              <span className="font-semibold">
                {firstname} {lastname}
              </span>
              <Link
                href={`/admin/user/${user_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 transition-colors group"
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Computer className="h-5 w-5 text-cyan-600" />
                </div>
                <span className="font-medium">{station}</span>
              </div>
            )}
          </div>
        </div>

        {!archived && (
          <div className="flex flex-col items-center gap-4 max-w-80 lg:w-auto">

            <DeleteReservationAction
              targetReservation={{
                id: reservationId,
                userEmail: email || "",
                date: date,
                heure: heure,
              }}
              onAlert={onAlert}
              onSuccess={onCancelSuccess}
            >
              {({ open, loading }) => (
                <Button
                  onClick={open}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {loading
                    ? t("reservation.details.canceling")
                    : t("reservation.details.cancelReservation")
                  }
                </Button>
              )}
            </DeleteReservationAction>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DetailsReservation({
  reservationId,
  firstname,
  lastname,
  email,
  user_id,
  jeux = [],
  console,
  station,
  accessoires = [],
  date,
  heure,
  archived,
}: ReservationDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);

  const handleCancelSuccess = useCallback(() => {
    setAlert({
      show: true,
      type: "success",
      title: "Réservation annulée",
      message: "Votre réservation a été annulée avec succès.",
    });
    setTimeout(() => {
      router.replace("/");
    }, 1600);
  }, [router]);

  const handleCancelError = useCallback((error: Error) => {
    setAlert({
      show: true,
      type: "error",
      title: "Erreur",
      message: error.message || "Impossible d'annuler la réservation.",
    });
  }, []);

  const handleAlert = useCallback((type: "success" | "error" | "info" | "warning", message: string, title?: string) => {
    setAlert({
      show: true,
      type: type === "success" ? "success" : "error",
      title: title || (type === "success" ? "Succès" : "Erreur"),
      message: message,
    });

    if (type === "success") {
      setTimeout(() => {
        router.replace("/admin/reservations");
      }, 1600);
    }
  }, [router]);

  return (
    <div className="sm:bg-[white] rounded-lg mb-10">
      <div className="sm:px-4 sm:py-8 lg:px-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
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
            variant={alert.type === "error" ? "destructive" : "default"}
            className={`mb-6 ${alert.type === "success"
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
                    {alert.type === "error"
                      ? alert.message ||
                      "Une erreur est survenue. Veuillez essayer ultérieurement."
                      : alert.message}
                  </AlertDescription>
                </div>
              </div>
              <button
                onClick={() => setAlert(null)}
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-lg leading-none transition-colors ${alert.type === "error"
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

        <ReservationHeader
          date={date}
          heure={heure}
          reservationId={reservationId}
          consoleName={console.nom}
          station={station}
          archived={archived}
          firstname={firstname}
          lastname={lastname}
          email={email}
          user_id={user_id}
          onAlert={handleAlert}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
