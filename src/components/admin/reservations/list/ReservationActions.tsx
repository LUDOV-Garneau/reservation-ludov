"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Menu, Trash2 } from "lucide-react";
import DeleteReservationAction from "../DeleteReservationAction/DeleteReservationAction";
import type { Reservation } from "./hooks/useReservations";
import type { AlertType } from "@/hooks/useAlert";

type Props = {
  reservation: Reservation;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
  /** `menu` sur la carte mobile, `buttons` dans la table. */
  variant: "buttons" | "menu";
};

/**
 * Actions d'une réservation — voir les détails, annuler — partagées par la
 * ligne de table et la carte mobile, pour qu'elles ne divergent pas.
 */
export default function ReservationActions({
  reservation,
  onAlert,
  onSuccess,
  variant,
}: Props) {
  const t = useTranslations("admin.reservations.table.ActionToolTips");
  const router = useRouter();

  const detailsUrl = `/admin/reservation/details/${reservation.id}`;
  const cancelTarget = {
    id: reservation.id,
    userEmail: reservation.userNom,
    date: reservation.date,
    heure: reservation.heure,
  };

  if (variant === "menu") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => router.push(detailsUrl)}>
            <Eye className="mr-2 h-4 w-4" />
            {t("viewDetails")}
          </DropdownMenuItem>
          {!reservation.archived && (
            <DeleteReservationAction
              targetReservation={cancelTarget}
              onAlert={onAlert}
              onSuccess={onSuccess}
            >
              {({ open }) => (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    open();
                  }}
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteReservation")}
                </DropdownMenuItem>
              )}
            </DeleteReservationAction>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(detailsUrl)}
              className="h-8 w-8 p-0 transition-colors hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950 dark:hover:text-cyan-300"
              aria-label={t("viewDetails")}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("viewDetails")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {!reservation.archived && (
        <DeleteReservationAction
          targetReservation={cancelTarget}
          onAlert={onAlert}
          onSuccess={onSuccess}
        >
          {({ open, loading }) => (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={open}
                    disabled={loading}
                    className="h-8 w-8 p-0 transition-colors hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300"
                    aria-label={t("deleteReservation")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("deleteReservation")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DeleteReservationAction>
      )}
    </div>
  );
}
