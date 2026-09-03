"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useAlert } from "./hooks/useAlert";
import EmptyState from "@/components/admin/EmptyState";
import { usePagination } from "@/hooks/usePagination";
import { useReservations } from "./hooks/useReservations";
import type { Reservation } from "./hooks/useReservations";
import PaginationControls from "./Pagination";
import ActionBar from "./ActionBar";
import CardReservationStats from "./CardStats";
import ReservationTableRow from "./ReservationTableRow";
import DateFilter, { parseDateString, normalizeDate } from "./DateFilter";
import type { DateFilterValue } from "./DateFilter";

/** Tailles de page proposées ; l'API refuse toute autre valeur. */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const EMPTY_DATE_FILTER: DateFilterValue = { mode: "specific" };

// La recherche texte est faite côté serveur ; seul le filtre de date reste local.
function filterReservations(
  reservations: Reservation[],
  dateFilter: DateFilterValue,
): Reservation[] {
  return reservations.filter((r) => {
    if (dateFilter.mode === "specific" && dateFilter.specificDate) {
      return (
        parseDateString(r.date).getTime() ===
        normalizeDate(dateFilter.specificDate).getTime()
      );
    }

    if (dateFilter.mode === "range") {
      const d = parseDateString(r.date);
      const { startDate, endDate } = dateFilter;
      if (startDate && endDate)
        return d >= normalizeDate(startDate) && d <= normalizeDate(endDate);
      if (startDate) return d >= normalizeDate(startDate);
      if (endDate) return d <= normalizeDate(endDate);
    }

    return true;
  });
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

export default function ReservationsTable() {
  const t = useTranslations();
  const { showAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] =
    useState<DateFilterValue>(EMPTY_DATE_FILTER);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Recherche débouncée (350 ms), envoyée au serveur.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { page, goToPage, resetPage } = usePagination(total, pageSize);
  const {
    reservations,
    metrics,
    loading,
    metricsLoading,
    refresh,
    refreshSilent,
    markCancelled,
  } = useReservations(page, pageSize, showAlert, setTotal, debouncedSearch);

  const filteredReservations = useMemo(
    () => filterReservations(reservations, dateFilter),
    [reservations, dateFilter],
  );

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, dateFilter, pageSize, resetPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  // Annulation : la ligne passe immédiatement à "annulée" (pas de squelette),
  // puis les stats sont resynchronisées en arrière-plan.
  const handleCancelSuccess = useCallback(
    (id: string) => {
      markCancelled(id);
      refreshSilent();
    },
    [markCancelled, refreshSilent],
  );

  const handleClearDateFilter = useCallback(() => {
    setDateFilter(EMPTY_DATE_FILTER);
  }, []);

  return (
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">

      <CardReservationStats
        loading={metricsLoading}
        totalReservations={metrics.total}
        futureReservations={metrics.future}
        pastReservations={metrics.past}
      />

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
          <div className="mt-4 pt-4 border-t">
            <DateFilter
              value={dateFilter}
              onChange={setDateFilter}
              onClear={handleClearDateFilter}
            />
          </div>
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
                  {/* Ordre demandé par le LUDOV : usager, date, heure,
                      station, plateforme, jeux, accessoires, sigle, statut,
                      actions. Les colonnes secondaires se replient sur les
                      petits écrans. */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.user")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.reservations.table.header.date")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.time")}
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        {t("admin.reservations.table.header.station")}
                      </TableHead>
                      <TableHead>
                        {t("admin.reservations.table.header.console")}
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        {t("admin.reservations.table.header.games")}
                      </TableHead>
                      <TableHead className="hidden 2xl:table-cell">
                        {t("admin.reservations.table.header.accessories")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.course")}
                      </TableHead>
                      <TableHead className="text-center">
                        {t("admin.reservations.table.header.status")}
                      </TableHead>
                      <TableHead className="text-end">
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
                        onSuccess={() => handleCancelSuccess(reservation.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Toujours affiché : le sélecteur « par page » doit rester
                  accessible même quand tout tient sur une page. */}
              <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                <PaginationControls
                  page={page}
                  totalItems={total}
                  pageSize={pageSize}
                  onPageChange={goToPage}
                  siblingCount={1}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t("admin.reservations.searchResult.noReservationsFound")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
