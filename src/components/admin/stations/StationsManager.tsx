"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Computer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/admin/EmptyState";
import PaginationControls from "@/components/admin/Pagination";
import { useAlert } from "@/hooks/useAlert";
import {
  STATIONS_PAGE_SIZES,
  useStationsFilters,
} from "@/hooks/useStationsFilters";
import { useStations } from "./hooks/useStations";
import DeleteStationDialog from "./DeleteStationDialog";
import StationFormDialog from "./StationFormDialog";
import StationsFilters from "./StationsFilters";
import StationsSkeleton from "./StationsSkeleton";
import StationsStatsBar from "./StationsStatsBar";
import StationsTable from "./StationsTable";
import type { Station } from "@/components/admin/stations/types";

/**
 * Onglet « Stations » de l'admin.
 *
 * Recherche, statut, tri et pagination vivent dans l'URL et sont appliqués par
 * l'API : un filtre porte sur toute la table et non sur la page affichée.
 */
export default function StationsManager() {
  const t = useTranslations("admin.stations");
  const locale = useLocale();
  const { showAlert } = useAlert();
  const {
    filters,
    setFilters,
    clearFilters,
    toggleSort,
    activeFilterCount,
    toApiQuery,
  } = useStationsFilters();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Station | null>(null);

  const { stations, total, stats, loading, statsLoading, refresh, refreshSilent } =
    useStations(filters, toApiQuery, showAlert);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((station: Station) => {
    setEditing(station);
    setFormOpen(true);
  }, []);

  const openDelete = useCallback((station: Station) => {
    setDeleting(station);
    setDeleteOpen(true);
  }, []);

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <StationsStatsBar
        stats={stats}
        loading={statsLoading}
        status={filters.status}
        onStatusChange={(status) => setFilters({ status })}
      />

      <Card className="shadow-md">
        <CardHeader className="border-b p-4 pb-3 sm:p-6 sm:pb-4">
          <StationsFilters
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            totalItems={total}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onCreate={openCreate}
          />
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <StationsSkeleton />
          ) : stations.length > 0 ? (
            <>
              <StationsTable
                stations={stations}
                locale={locale}
                sortState={{ sort: filters.sort, dir: filters.dir }}
                onToggleSort={toggleSort}
                onEdit={openEdit}
                onDelete={openDelete}
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
                  pageSizeOptions={STATIONS_PAGE_SIZES}
                  onPageSizeChange={(pageSize) => setFilters({ pageSize })}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={Computer}
              title={t("searchResult.noStationsFound")}
              description={
                activeFilterCount > 0
                  ? t("searchResult.filtersHint")
                  : t("searchResult.startByAdding")
              }
              action={
                activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("filter.clearAll")}
                  </Button>
                ) : (
                  <Button onClick={openCreate}>
                    {t("actionBar.addStation")}
                  </Button>
                )
              }
            />
          )}
        </CardContent>
      </Card>

      <StationFormDialog
        station={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={refreshSilent}
        onAlert={showAlert}
      />

      <DeleteStationDialog
        station={deleting}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={refreshSilent}
        onAlert={showAlert}
      />
    </div>
  );
}
