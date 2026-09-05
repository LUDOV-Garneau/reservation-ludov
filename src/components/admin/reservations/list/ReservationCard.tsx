"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Gamepad2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import ReservationActions from "./ReservationActions";
import ReservationStatusBadge from "./ReservationStatusBadge";
import type { Reservation } from "./hooks/useReservations";
import type { AlertType } from "./hooks/useAlert";

/**
 * Rendu mobile de la liste. La table repliait six colonnes sur dix sous `md`,
 * au point qu'il ne restait que la plateforme, le statut et les actions :
 * impossible de savoir de qui ni de quand il s'agissait. La carte garde
 * l'usager, la date, l'heure et la plateforme visibles.
 */
export default function ReservationCard({
  reservation,
  onAlert,
  onSuccess,
}: {
  reservation: Reservation;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("admin.reservations.table.header");

  return (
    <Card className="py-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {reservation.userNom || "—"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {reservation.console}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ReservationStatusBadge
              date={reservation.date}
              heure={reservation.heure}
              archived={reservation.archived}
              showLabelOnMobile
            />
            <ReservationActions
              reservation={reservation}
              onAlert={onAlert}
              onSuccess={onSuccess}
              variant="menu"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {reservation.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {reservation.heure}
          </span>
          {reservation.station && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {reservation.station}
            </span>
          )}
          {reservation.coursCode && (
            <span className="font-mono" title={reservation.coursName}>
              {reservation.coursCode}
            </span>
          )}
        </div>

        {reservation.games.length > 0 && (
          <div className="flex gap-2 text-sm">
            <Gamepad2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0" title={reservation.games.join(", ")}>
              <span className="sr-only">{t("games")} : </span>
              {reservation.games.join(", ")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
