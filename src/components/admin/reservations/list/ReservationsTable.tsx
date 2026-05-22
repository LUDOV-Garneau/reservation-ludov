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
import { usePagination } from "@/hooks/usePagination";
import { useReservations } from "./hooks/useReservations";
import type { Reservation } from "./hooks/useReservations";
import { ModernAlert } from "./ModernAlert";
import PaginationControls from "./Pagination";
import ActionBar from "./ActionBar";
import CardReservationStats from "./CardStats";
import ReservationTableRow from "./ReservationTableRow";
import DateFilter, { parseDateString, normalizeDate } from "./DateFilter";
import type { DateFilterValue } from "./DateFilter";

const ITEMS_PER_PAGE = 10;

const EMPTY_DATE_FILTER: DateFilterValue = { mode: "specific" };

function filterReservations(
  reservations: Reservation[],
  searchQuery: string,
  dateFilter: DateFilterValue,
): Reservation[] {
  const search = searchQuery.toLowerCase();

  return reservations.filter((r) => {
    const matchesSearch =
      (r.userNom ?? "").toLowerCase().includes(search) ||
      r.console.toLowerCase().includes(search) ||
      r.date.toLowerCase().includes(search);

    if (!matchesSearch) return false;

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

function EmptyState({ searchQuery }: { searchQuery: string }) {
  const t = useTranslations();
  return (
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
  );
}

export default function ReservationsTable() {
  const t = useTranslations();
  const { alert, showAlert, clearAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] =
    useState<DateFilterValue>(EMPTY_DATE_FILTER);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const { page, goToPage, resetPage } = usePagination(total, ITEMS_PER_PAGE);
  const { reservations, metrics, loading, metricsLoading, refresh } =
    useReservations(page, ITEMS_PER_PAGE, showAlert, setTotal);

  const filteredReservations = useMemo(
    () => filterReservations(reservations, searchQuery, dateFilter),
    [reservations, searchQuery, dateFilter],
  );

  useEffect(() => {
    resetPage();
  }, [searchQuery, resetPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const handleClearDateFilter = useCallback(() => {
    setDateFilter(EMPTY_DATE_FILTER);
  }, []);

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
        totalReservations={metrics.total}
        futureReservations={metrics.future}
        pastReservations={metrics.past}
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.user")}
                      </TableHead>
                      <TableHead>Plateforme</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.reservations.table.header.date")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.reservations.table.header.time")}
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
            <EmptyState searchQuery={searchQuery} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
