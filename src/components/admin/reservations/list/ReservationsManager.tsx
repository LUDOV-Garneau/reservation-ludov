"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/admin/EmptyState";
import {
  RESERVATIONS_PAGE_SIZES,
  useReservationsFilters,
} from "@/hooks/useReservationsFilters";
import { useAlert } from "@/hooks/useAlert";
import { useReservations } from "./hooks/useReservations";
import PaginationControls from "@/components/admin/Pagination";
import ReservationsFilters from "./ReservationsFilters";
import ReservationsStatsBar from "./ReservationsStatsBar";
import ReservationsSkeleton from "./ReservationsSkeleton";
import ReservationsTable from "./ReservationsTable";

/**
 * Onglet « Réservations » de l'admin.
 *
 * Recherche, bornes de date, statut, tri et pagination vivent dans l'URL et
 * sont appliqués par l'API : un filtre porte sur toute la base et non sur la
 * page affichée, et le lien se partage tel quel.
 */
export default function ReservationsManager() {
  const t = useTranslations("admin.reservations");
  const locale = useLocale();
  const { showAlert } = useAlert();
  const {
    filters,
    setFilters,
    clearFilters,
    toggleSort,
    activeFilterCount,
    toApiQuery,
  } = useReservationsFilters();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    reservations,
    total,
    metrics,
    loading,
    metricsLoading,
    refresh,
    refreshSilent,
    markCancelled,
  } = useReservations(filters, toApiQuery, showAlert);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  // Annulation : la ligne passe immédiatement à « annulée » (pas de squelette),
  // puis les stats sont resynchronisées en arrière-plan.
  const handleCancelSuccess = useCallback(
    (id: string) => {
      markCancelled(id);
      refreshSilent();
    },
    [markCancelled, refreshSilent],
  );

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <ReservationsStatsBar
        metrics={metrics}
        loading={metricsLoading}
        status={filters.status}
        onStatusChange={(status) => setFilters({ status })}
        onReset={() => setFilters({ status: "all" })}
      />

      <Card className="shadow-md">
        <CardHeader className="border-b p-4 pb-3 sm:p-6 sm:pb-4">
          <ReservationsFilters
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            totalItems={total}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            locale={locale}
          />
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <ReservationsSkeleton />
          ) : reservations.length > 0 ? (
            <>
              <ReservationsTable
                reservations={reservations}
                sortState={{ sort: filters.sort, dir: filters.dir }}
                onToggleSort={toggleSort}
                onAlert={showAlert}
                onCancelSuccess={handleCancelSuccess}
              />
              {/* Toujours affiché : le sélecteur « par page » doit rester
                  accessible même quand tout tient sur une page. */}
              <div className="px-4 pb-3 sm:px-6 sm:pb-4">
                <PaginationControls
                  page={filters.page}
                  totalItems={total}
                  pageSize={filters.pageSize}
                  onPageChange={(page) => setFilters({ page })}
                  siblingCount={1}
                  pageSizeOptions={RESERVATIONS_PAGE_SIZES}
                  onPageSizeChange={(pageSize) => setFilters({ pageSize })}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t("searchResult.noReservationsFound")}
              description={
                activeFilterCount > 0
                  ? t("searchResult.filtersHint")
                  : undefined
              }
              action={
                activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("filter.clearAll")}
                  </Button>
                ) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
