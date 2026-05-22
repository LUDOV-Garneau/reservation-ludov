"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  XCircle,
  CheckCircle,
  Trash2,
  Menu,
  Eye,
} from "lucide-react";
import DeleteReservationAction from "../DeleteReservationAction/DeleteReservationAction";
import type { Reservation } from "./hooks/useReservations";
import type { AlertType } from "./hooks/useAlert";

type ReservationStatus = "upcoming" | "past";

function getReservationStatus(date: string, heure: string): ReservationStatus {
  if (!date || !heure) return "past";
  return new Date(`${date}T${heure}:00`).getTime() >= Date.now()
    ? "upcoming"
    : "past";
}

function ReservationStatusBadge({
  date,
  heure,
  archived,
}: {
  date: string;
  heure: string;
  archived: boolean;
}) {
  const t = useTranslations();

  if (archived) {
    return (
      <Badge variant="reservationStatus" className="bg-red-500 border-red-500">
        <XCircle className="h-3 w-3" />
        <span className="hidden sm:inline">
          {t("admin.reservations.status.cancelled")}
        </span>
      </Badge>
    );
  }

  if (getReservationStatus(date, heure) === "upcoming") {
    return (
      <Badge
        variant="reservationStatus"
        className="bg-cyan-500 border-cyan-500"
      >
        <Clock className="h-3 w-3" />
        <span className="hidden sm:inline">
          {t("admin.reservations.status.upcoming")}
        </span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="reservationStatus"
      className="bg-green-500 border-green-500"
    >
      <CheckCircle className="h-3 w-3" />
      <span className="hidden sm:inline">Complétée</span>
    </Badge>
  );
}

type ReservationTableRowProps = {
  reservation: Reservation;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
};

export default function ReservationTableRow({
  reservation,
  onAlert,
  onSuccess,
}: ReservationTableRowProps) {
  const t = useTranslations();
  const router = useRouter();

  const detailsUrl = `/admin/reservation/details/${reservation.id}`;
  const cancelTarget = {
    id: reservation.id,
    userEmail: reservation.userNom,
    date: reservation.date,
    heure: reservation.heure,
  };

  return (
    <TableRow className="hover:bg-gray-200">
      <TableCell className="hidden lg:table-cell">
        <span className="truncate max-w-[220px]">{reservation.userNom}</span>
      </TableCell>

      <TableCell>
        <span className="truncate max-w-[160px] text-xs sm:text-base">
          {reservation.console}
        </span>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{reservation.date}</span>
        </div>
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{reservation.heure}</span>
        </div>
      </TableCell>

      <TableCell>
        <ReservationStatusBadge
          date={reservation.date}
          heure={reservation.heure}
          archived={reservation.archived}
        />
      </TableCell>

      <TableCell>
        {/* Desktop */}
        <div className="hidden sm:flex gap-2 justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(detailsUrl)}
                  className="hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-300 transition-colors h-8 w-8 p-0"
                  aria-label={t(
                    "admin.reservations.table.ActionToolTips.viewDetails",
                  )}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {t("admin.reservations.table.ActionToolTips.viewDetails")}
                </p>
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
                        disabled={loading || reservation.archived}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors h-8 w-8 p-0"
                        aria-label={t(
                          "admin.reservations.table.ActionToolTips.deleteReservation",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {t(
                          "admin.reservations.table.ActionToolTips.deleteReservation",
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </DeleteReservationAction>
          )}
        </div>

        {/* Mobile */}
        <div className="sm:hidden text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(detailsUrl)}>
                <Eye className="h-4 w-4 mr-2 text-cyan-600" />
                {t("admin.reservations.table.ActionToolTips.viewDetails")}
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
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      disabled={reservation.archived}
                    >
                      <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                      {t(
                        "admin.reservations.table.ActionToolTips.deleteReservation",
                      )}
                    </DropdownMenuItem>
                  )}
                </DeleteReservationAction>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
