"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  Clock,
  Gamepad2,
  Monitor,
  AlertCircle,
  CheckCircle2,
  Cable,
  Computer,
  User,
  ExternalLink,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageShell, BackLink } from "@/components/layout/PageShell";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CancelledBanner from "@/components/reservation/details/CancelledBanner";
import {
  GameCard,
  ConsoleCard,
  AccessoriesSection,
  GAMES_GRID_CLASSES,
} from "@/components/reservation/details/SharedCards";
import DeleteReservationAction from "../DeleteReservationAction/DeleteReservationAction";

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
  station?: string | null;
  /** Cours indiqué lors de la réservation (sigle + nom). */
  cours?: { code: string; name: string } | null;
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


function ReservationHeader({
  date,
  heure,
  reservationId,
  station,
  cours,
  archived,
  firstname,
  lastname,
  email,
  user_id,
  onAlert,
  onCancelSuccess,
  router,
}: {
  date: string;
  heure: string;
  reservationId: string;
  consoleName: string;
  station?: string | null;
  cours?: { code: string; name: string } | null;
  archived: boolean;
  firstname: string;
  lastname: string;
  email: string;
  user_id: number;
  router: ReturnType<typeof useRouter>;
  onAlert: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string,
  ) => void;
  onCancelSuccess: (reason?: string) => void;
  onCancelError: (error: Error) => void;
}) {
  const t = useTranslations();

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-[white] shadow-md p-6 sm:p-8 mb-8 lg:text-left">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Détails de la réservation
          </h1>

          <Link
            href={`/admin/user/${user_id}`}
            className="
            flex items-center lg:justify-start gap-3 text-xl md:w-fit group hover:border-b-cyan-500 border-b-2 border-transparent pb-1 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
              <User className="h-5 w-5 text-cyan-600" />
            </div>
            <span className="font-semibold group-hover:text-cyan-500 transition-colors">
              {firstname} {lastname}
            </span>

            <ExternalLink className="h-5 w-5 group-hover:text-cyan-500 transition-colors" />
          </Link>

          <div className="flex flex-col sm:flex-row md:justify-start gap-6 text-lg text-gray-600">
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

            {cours && (
              <div className="flex items-center gap-2" title={cours.name}>
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-cyan-600" />
                </div>
                <span className="font-medium">
                  <span className="sr-only">{t("reservation.details.course")} </span>
                  {cours.code}
                </span>
              </div>
            )}
          </div>
        </div>

        {!archived && (
          <div className="flex flex-col items-center gap-4  lg:w-auto">
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
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {loading
                    ? t("reservation.details.canceling")
                    : t("reservation.details.cancelReservation")}
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
  cours,
  accessoires = [],
  date,
  heure,
  archived,
  cancellationReason,
}: ReservationDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  // Feedback immédiat : l'annulation bascule l'affichage sans redirection.
  const [isCancelled, setIsCancelled] = useState(archived);
  const [displayedReason, setDisplayedReason] = useState(cancellationReason);

  const handleCancelSuccess = useCallback((reason?: string) => {
    setIsCancelled(true);
    if (reason) setDisplayedReason(reason);
    setAlert({
      show: true,
      type: "success",
      title: "Réservation annulée",
      message: "La réservation a été annulée et l'utilisateur averti par courriel.",
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

  const handleAlert = useCallback(
    (
      type: "success" | "destructive" | "info" | "warning",
      message: string,
      title?: string,
    ) => {
      setAlert({
        show: true,
        type: type === "success" ? "success" : "destructive",
        title: title || (type === "success" ? "Succès" : "Erreur"),
        message: message,
      });

    },
    [],
  );

  return (
    <PageShell>
      <BackLink onClick={() => router.back()} label="Retour" />

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

        {isCancelled && <CancelledBanner reason={displayedReason} />}

        <ReservationHeader
          date={date}
          heure={heure}
          reservationId={reservationId}
          consoleName={console.nom}
          station={station}
          cours={cours}
          archived={isCancelled}
          firstname={firstname}
          lastname={lastname}
          email={email}
          user_id={user_id}
          onAlert={handleAlert}
          onCancelSuccess={handleCancelSuccess}
          onCancelError={handleCancelError}
          router={router}
        />

        <div className="md:mx-5 flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Gamepad2 className="h-6 w-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t("reservation.details.selectedGames")}
              </h2>
            </div>
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
              <Card>
                <CardContent className="p-12 text-center">
                  <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    {t("reservation.details.noGames")}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonnes en flex : la carte occupe la hauteur restante sous son
                titre (avec h-full elle valait 100 % de la cellule et débordait
                de la hauteur du titre). */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Monitor className="h-6 w-6 text-cyan-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("reservation.details.selectedConsole")}
                </h2>
              </div>
              <ConsoleCard item={console} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <Cable className="h-6 w-6 text-cyan-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("reservation.details.selectedAccessory")}
                </h2>
              </div>
              <AccessoriesSection accessories={accessoires} />
            </div>
          </div>
        </div>
    </PageShell>
  );
}
