"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/admin/EmptyState";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  PAGE_SIZE_OPTIONS,
  useAccessoriesFilters,
} from "@/hooks/useAccessoriesFilters";
import PaginationControls from "@/components/admin/reservations/list/Pagination";
import AccessoriesFilters from "@/components/admin/accessoires/AccessoriesFilters";
import AccessoriesGrid from "@/components/admin/accessoires/AccessoriesGrid";
import AccessoriesTable from "@/components/admin/accessoires/AccessoriesTable";
import AccessoriesSkeleton from "@/components/admin/accessoires/AccessoriesSkeleton";
import AccessoriesStatsBar from "@/components/admin/accessoires/AccessoriesStatsBar";
import AccessoriesBulkBar, {
  type BulkAction,
} from "@/components/admin/accessoires/AccessoriesBulkBar";
import AccessoryDialog from "@/components/admin/accessoires/AccessoryDialog";
import {
  computeStats,
  filterAccessories,
  sortAccessories,
} from "@/components/admin/accessoires/accessoriesLogic";
import type {
  AccessoryRow,
  ConsoleTypeOption,
} from "@/components/admin/accessoires/types";

/**
 * Onglet « Accessoires » : orchestre le chargement, l'écriture et le rendu de
 * la vue choisie. Les vues ne reçoivent que des données et des rappels ; seul
 * le hook touche au routeur.
 *
 * `accessoires` compte quelques centaines de lignes : la liste entière est
 * chargée une fois, puis filtrée, triée et paginée en mémoire — pas
 * d'aller-retour serveur à chaque frappe.
 */
export default function AccessoriesManager() {
  const t = useTranslations("admin.accessories");
  const { filters, setFilters, clearFilters, toggleSort, activeFilterCount } =
    useAccessoriesFilters();

  const [accessories, setAccessories] = useState<AccessoryRow[]>([]);
  const [consoleTypes, setConsoleTypes] = useState<ConsoleTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Garde anti-course : seule la dernière requête émise peut écrire l'état.
  const requestIdRef = useRef(0);

  const showAlert = useCallback(
    (type: "success" | "destructive" | "warning", message: string) => {
      if (type === "success") {
        toast.success(t("alerts.successTitle"), { description: message });
      } else if (type === "warning") {
        toast.warning(t("alerts.partialTitle"), { description: message });
      } else {
        toast.error(t("alerts.errorTitle"), { description: message });
      }
    },
    [t],
  );

  const fetchAccessories = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const res = await fetch("/api/admin/accessories");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

      if (requestId !== requestIdRef.current) return;
      setAccessories(data.accessories as AccessoryRow[]);
      setConsoleTypes(data.consoleTypes as ConsoleTypeOption[]);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error(err);
      showAlert("destructive", t("alerts.fetchError"));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    fetchAccessories();
  }, [fetchAccessories]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAccessories();
    setIsRefreshing(false);
  }, [fetchAccessories]);

  const patchAccessory = useCallback(
    async (id: number, body: { hidden?: boolean; consoles?: number[] }) => {
      const res = await fetch(`/api/admin/accessories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");
    },
    [],
  );

  /**
   * Le basculement est optimiste : c'est un clic isolé, immédiatement visible,
   * et l'échec ramène la ligne à l'état réellement enregistré.
   */
  const handleToggleHidden = useCallback(
    async (accessory: AccessoryRow) => {
      const nextHidden = !accessory.hidden;
      setTogglingId(accessory.id);
      setAccessories((prev) =>
        prev.map((row) =>
          row.id === accessory.id ? { ...row, hidden: nextHidden } : row,
        ),
      );
      try {
        await patchAccessory(accessory.id, { hidden: nextHidden });
        showAlert("success", t("alerts.updateSuccess"));
      } catch (err) {
        console.error(err);
        setAccessories((prev) =>
          prev.map((row) =>
            row.id === accessory.id
              ? { ...row, hidden: accessory.hidden }
              : row,
          ),
        );
        showAlert("destructive", t("alerts.updateError"));
      } finally {
        setTogglingId(null);
      }
    },
    [patchAccessory, showAlert, t],
  );

  /**
   * L'édition des plateformes attend l'accord du serveur : contrairement au
   * basculement, elle porte plusieurs valeurs à la fois et un demi-succès
   * affiché serait un mensonge sur ce qui est en base.
   */
  const handleSaveConsoles = useCallback(
    async (accessory: AccessoryRow, consoles: number[]) => {
      try {
        await patchAccessory(accessory.id, { consoles });
        const byId = new Map(consoleTypes.map((c) => [c.id, c.name]));
        setAccessories((prev) =>
          prev.map((row) =>
            row.id === accessory.id
              ? {
                  ...row,
                  consoles: consoles.map((id) => ({
                    id,
                    name: byId.get(id) ?? `#${id}`,
                  })),
                }
              : row,
          ),
        );
        showAlert("success", t("alerts.updateSuccess"));
        return true;
      } catch (err) {
        console.error(err);
        showAlert("destructive", t("alerts.updateError"));
        return false;
      }
    },
    [patchAccessory, consoleTypes, showAlert, t],
  );

  /**
   * Actions groupées : un seul appel, puis relecture de la liste. Le serveur
   * répond 200 même en succès partiel, et c'est son compte-rendu qui est
   * rapporté — pas une réussite supposée.
   */
  const handleBulk = useCallback(
    async (action: BulkAction, ids: number[], consoles?: number[]) => {
      try {
        const res = await fetch("/api/admin/accessories/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action, ids, consoles }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erreur API");

        const succeeded: number[] = data.succeeded ?? [];
        const failed: { id: number; error: string }[] = data.failed ?? [];

        await fetchAccessories();

        if (failed.length > 0) {
          showAlert(
            "warning",
            t("bulk.partial", {
              succeeded: succeeded.length,
              failed: failed.length,
            }),
          );
        } else {
          showAlert("success", t("bulk.success", { count: succeeded.length }));
          setSelectedIds([]);
        }
        return true;
      } catch (err) {
        console.error(err);
        showAlert(
          "destructive",
          err instanceof Error && err.message !== "Erreur API"
            ? err.message
            : t("bulk.error"),
        );
        return false;
      }
    },
    [fetchAccessories, showAlert, t],
  );

  const visibleAccessories = useMemo(
    () =>
      sortAccessories(
        filterAccessories(accessories, filters),
        filters.sort,
        filters.dir,
      ),
    [accessories, filters],
  );
  const stats = useMemo(() => computeStats(accessories), [accessories]);

  // La liste complète est déjà en mémoire : la pagination ne fait que
  // découper, sans rappel au serveur.
  const { page, pageSize } = filters;
  const pageAccessories = useMemo(
    () => visibleAccessories.slice((page - 1) * pageSize, page * pageSize),
    [visibleAccessories, page, pageSize],
  );

  // Page devenue hors bornes (URL modifiée à la main, filtre qui réduit la
  // liste) : on ramène à la dernière page réelle plutôt que d'afficher du vide.
  useEffect(() => {
    if (loading || visibleAccessories.length === 0) return;
    const totalPages = Math.max(
      1,
      Math.ceil(visibleAccessories.length / pageSize),
    );
    if (page > totalPages) setFilters({ page: totalPages });
  }, [loading, visibleAccessories.length, page, pageSize, setFilters]);

  // Un changement de filtre vide la sélection : garder des lignes cochées que
  // l'écran ne montre plus rendrait l'action groupée aveugle. La pagination,
  // elle, la conserve — c'est la même liste, vue par tranches.
  const filterKey = `${filters.search}|${filters.platform}|${filters.visibility}`;
  useEffect(() => {
    setSelectedIds([]);
  }, [filterKey]);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }, []);

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      const pageIds = pageAccessories.map((accessory) => accessory.id);
      setSelectedIds((prev) => {
        if (!checked) return prev.filter((id) => !pageIds.includes(id));
        return [...new Set([...prev, ...pageIds])];
      });
    },
    [pageAccessories],
  );

  // L'accessoire édité est relu dans la liste plutôt que copié : après un
  // enregistrement, le dialogue doit montrer la valeur enregistrée.
  const editingAccessory =
    accessories.find((accessory) => accessory.id === editingId) ?? null;

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <AccessoriesStatsBar
        stats={loading ? null : stats}
        loading={loading}
        visibility={filters.visibility}
        platform={filters.platform}
        onVisibilityChange={(visibility) => setFilters({ visibility })}
        onPlatformChange={(platform) => setFilters({ platform })}
        onReset={() => setFilters({ visibility: "all", platform: "all" })}
      />

      <Card className="shadow-md">
        <CardHeader className="border-b p-4 pb-3 sm:p-6 sm:pb-4">
          {selectedIds.length > 0 ? (
            <AccessoriesBulkBar
              selectedIds={selectedIds}
              consoleTypes={consoleTypes}
              onClear={() => setSelectedIds([])}
              onRun={handleBulk}
            />
          ) : (
            <AccessoriesFilters
              filters={filters}
              setFilters={setFilters}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
              consoleTypes={consoleTypes}
              totalItems={visibleAccessories.length}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <AccessoriesSkeleton view={filters.view} />
          ) : visibleAccessories.length === 0 ? (
            <EmptyState
              icon={Package}
              title={activeFilterCount > 0 ? t("emptyFiltered") : t("empty")}
              description={
                activeFilterCount > 0 ? t("emptyFilteredHint") : undefined
              }
              action={
                activeFilterCount > 0 ? (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    {t("filters.clearAll")}
                  </Button>
                ) : undefined
              }
            />
          ) : filters.view === "grid" ? (
            <AccessoriesGrid
              accessories={pageAccessories}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              togglingId={togglingId}
              onToggleHidden={handleToggleHidden}
              onOpen={(accessory) => setEditingId(accessory.id)}
            />
          ) : (
            <AccessoriesTable
              accessories={pageAccessories}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
              sort={filters.sort}
              dir={filters.dir}
              onSort={toggleSort}
              togglingId={togglingId}
              onToggleHidden={handleToggleHidden}
              onOpen={(accessory) => setEditingId(accessory.id)}
            />
          )}

          {!loading && visibleAccessories.length > 0 && (
            <PaginationControls
              page={page}
              totalItems={visibleAccessories.length}
              pageSize={pageSize}
              onPageChange={(next) => setFilters({ page: next })}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(next) => setFilters({ pageSize: next })}
              siblingCount={1}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <AccessoryDialog
        accessory={editingAccessory}
        consoleTypes={consoleTypes}
        onClose={() => setEditingId(null)}
        onSave={handleSaveConsoles}
      />
    </div>
  );
}
