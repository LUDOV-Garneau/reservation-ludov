"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, Info, Trash2, Menu } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PaginationControls from "./Pagination";
import ActionBar from "./ActionBar";
import CardReservationStats from "./CardStats";
import DeleteReservationAction from "./DeleteReservationAction";

type Reservation = {
  id: string;
  games: string[];
  console: string;
  date: string;
  heure: string;
  station: string | number | null;
  userEmail: string | null;
};

type ReservationsApiResponse = {
  rows?: Reservation[];
  total?: number;
  totalReservations?: number;
  futureReservations?: number;
  pastReservations?: number;
};

type AlertState =
  | {
    type: "success" | "error" | "info" | "warning";
    message: string;
    title?: string;
  }
  | null;

const ITEMS_PER_PAGE = 10;

function usePagination(totalItems: number, itemsPerPage: number = ITEMS_PER_PAGE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const goToNextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (pageNum: number) => {
      setPage(Math.max(1, Math.min(pageNum, totalPages)));
    },
    [totalPages]
  );

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    totalPages,
    itemsPerPage,
    goToNextPage,
    goToPrevPage,
    goToPage,
    resetPage,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}

export function ModernAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  if (!alert) return null;

  const icon =
    alert.type === "success" ? (
      <CheckCircle2 className="h-8 w-8 lg:h-6 lg:w-6 text-green-600" />
    ) : alert.type === "error" ? (
      <XCircle className="h-8 w-8 lg:h-6 lg:w-6 text-red-600" />
    ) : alert.type === "warning" ? (
      <AlertTriangle className="h-8 w-8 lg:h-6 lg:w-6 text-yellow-600" />
    ) : (
      <Info className="h-8 w-8 lg:h-6 lg:w-6 text-blue-600" />
    );

  return (
    <Alert
      className="mb-4"
      variant={
        alert.type === "success"
          ? "success"
          : alert.type === "error"
            ? "destructive"
            : "default"
      }
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
            <AlertDescription>{alert.message}</AlertDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 p-0 ml-auto"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

function useAlert() {
  const [alert, setAlert] = useState<AlertState>(null);

  const showAlert = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      message: string,
      title?: string
    ) => {
      setAlert({ type, message, title });
    },
    []
  );

  const clearAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, clearAlert };
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-24 hidden lg:block" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

type ReservationStatus = "upcoming" | "past";

function getReservationStatus(date: string, heure: string): ReservationStatus {
  if (!date || !heure) return "past";
  const reservationDate = new Date(`${date}T${heure}:00`);
  const now = new Date();
  return reservationDate.getTime() >= now.getTime() ? "upcoming" : "past";
}

function ReservationStatusBadge({ date, heure }: { date: string; heure: string }) {
  const t = useTranslations();
  const status = getReservationStatus(date, heure);

  if (status === "upcoming") {
    return (
      <Badge className="bg-emerald-600 text-white border-0 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">
          {t("admin.reservations.status.upcoming")}
        </span>
        <span className="sm:hidden">+</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="bg-gray-100 text-gray-700 border-gray-200 text-xs"
    >
      <Clock className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">
        {t("admin.reservations.status.past")}
      </span>
      <span className="sm:hidden">-</span>
    </Badge>
  );
}

function ReservationTableRow({
  reservation,
  onAlert,
  onSuccess,
}: {
  reservation: Reservation;
  onAlert: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations();

  return (
    <TableRow key={reservation.id} className="hover:bg-gray-200">
      {/* Utilisateur */}
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[220px]">
            {reservation.userEmail}
          </span>
        </div>
      </TableCell>

      {/* Console */}
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2 text-sm">
          <span className="truncate max-w-[160px]">
            {reservation.console}
          </span>
        </div>
      </TableCell>

      {/* Jeux */}
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm cursor-default truncate max-w-[220px] inline-block">
                {reservation.games.length > 0
                  ? reservation.games.join(", ")
                  : t("admin.reservations.table.noGames")}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {reservation.games.length > 0
                ? reservation.games.join(", ")
                : t("admin.reservations.table.noGames")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Station */}
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate max-w-[140px]">
            {reservation.station}
          </span>
        </div>
      </TableCell>

      {/* Date */}
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{reservation.date}</span>
        </div>
      </TableCell>

      {/* Heure */}
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{reservation.heure}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <ReservationStatusBadge date={reservation.date} heure={reservation.heure} />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="hidden sm:flex gap-2 justify-end">
          <DeleteReservationAction
            targetReservation={{
              id: reservation.id,
              userEmail: reservation.userEmail,
              date: reservation.date,
              heure: reservation.heure,
            }}
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
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors h-8 w-8 p-0"
                      aria-label={t("admin.reservations.table.ActionToolTips.deleteReservation")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("admin.reservations.table.ActionToolTips.deleteReservation")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </DeleteReservationAction>
        </div>

        {/* Mobile actions */}
        <div className="sm:hidden flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DeleteReservationAction
                targetReservation={{
                  id: reservation.id,
                  userEmail: reservation.userEmail,
                  date: reservation.date,
                  heure: reservation.heure,
                }}
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
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                    {t("admin.reservations.table.ActionToolTips.deleteReservation")}
                  </DropdownMenuItem>
                )}
              </DeleteReservationAction>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ReservationsTable() {
  const t = useTranslations();
  const { alert, showAlert, clearAlert } = useAlert();

  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [totalReservations, setTotalReservations] = useState(0);
  const [futureReservations, setFutureReservations] = useState(0);
  const [pastReservations, setPastReservations] = useState(0);

  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);

  const {
    page,
    goToPage,
    resetPage,
  } = usePagination(total, ITEMS_PER_PAGE);

  async function fetchReservations(page = 1, limit = ITEMS_PER_PAGE) {
    try {
      setLoading(true);
      setMetricsLoading(true);

      const res = await fetch(
        `/api/admin/reservations?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur API réservations");
      }

      const data = (await res.json()) as ReservationsApiResponse;

      const rows: Reservation[] = (data.rows ?? []).map((r) => ({
        id: String(r.id),
        games: Array.isArray(r.games) ? r.games : [],
        console: r.console ?? "",
        date: r.date,
        heure: r.heure ?? "",
        station: r.station ?? null,
        userEmail: r.userEmail ?? null,
      }));

      setReservations(rows);

      const totalCount = Number(data.total ?? data.totalReservations ?? rows.length);
      setTotal(totalCount);

      setTotalReservations(Number(data.totalReservations ?? totalCount));
      setFutureReservations(Number(data.futureReservations ?? 0));
      setPastReservations(Number(data.pastReservations ?? 0));
    } catch (error) {
      console.error(error);
      setReservations([]);
      setTotal(0);
      showAlert("error", t("admin.reservations.alert.fetchError"));
    } finally {
      setLoading(false);
      setMetricsLoading(false);
    }
  }

  useEffect(() => {
    fetchReservations(page, ITEMS_PER_PAGE);
  }, [page]);

  useEffect(() => {
    resetPage();
  }, [searchQuery, resetPage]);

  const filteredReservations = reservations.filter((reservation) => {
    const search = searchQuery.toLowerCase();
    const gamesText = reservation.games.join(", ").toLowerCase();

    return (
      (reservation.userEmail ?? "").toLowerCase().includes(search) ||
      reservation.console.toLowerCase().includes(search) ||
      gamesText.includes(search) ||
      String(reservation.station ?? "").toLowerCase().includes(search) ||
      reservation.date.toLowerCase().includes(search)
    );
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchReservations(page, ITEMS_PER_PAGE);
    setIsRefreshing(false);
  }, [page]);

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("admin.reservations.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("admin.reservations.subtitle")}
        </p>
      </div>

      <CardReservationStats
        loading={metricsLoading}
        totalReservations={totalReservations}
        futureReservations={futureReservations}
        pastReservations={pastReservations}
      />

      <ModernAlert alert={alert} onClose={clearAlert} />

      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <ActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={handleRefresh}
            onSuccess={handleRefresh}
            onAlert={showAlert}
            isRefreshing={isRefreshing}
          />
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6">
              <TableSkeleton />
            </div>
          ) : filteredReservations.length > 0 ? (
            <>
              <div className="px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.user")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.reservations.table.header.console")}
                      </TableHead>
                      <TableHead>
                        {t("admin.reservations.table.header.games")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.reservations.table.header.station")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.date")}
                      </TableHead>
                      <TableHead>
                        {t("admin.reservations.table.header.time")}
                      </TableHead>
                      <TableHead>
                        {t("admin.reservations.table.header.status")}
                      </TableHead>
                      <TableHead>
                        {t("admin.reservations.table.header.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredReservations.map((reservation) => (
                      <ReservationTableRow
                        key={reservation.id}
                        reservation={reservation}
                        onAlert={showAlert}
                        onSuccess={handleRefresh}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              {total > ITEMS_PER_PAGE && (
                <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                  <PaginationControls
                    page={page}
                    totalItems={total}
                    pageSize={ITEMS_PER_PAGE}
                    onPageChange={goToPage}
                    siblingCount={1}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {t("admin.reservations.searchResult.noReservationsFound")}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 mx-auto">
                {searchQuery
                  ? t("admin.reservations.searchResult.noMatch")
                  : t("admin.reservations.searchResult.empty")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
