"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/admin/EmptyState";
import { Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  PAGE_SIZE_OPTIONS,
  usePlatformsFilters,
} from "@/hooks/usePlatformsFilters";
import PaginationControls from "@/components/admin/reservations/list/Pagination";
import PlatformsFilters from "@/components/admin/platforms/PlatformsFilters";
import PlatformsGrid from "@/components/admin/platforms/PlatformsGrid";
import PlatformsTable from "@/components/admin/platforms/PlatformsTable";
import PlatformsSkeleton from "@/components/admin/platforms/PlatformsSkeleton";
import PlatformsStatsBar from "@/components/admin/platforms/PlatformsStatsBar";
import PlatformDialog from "@/components/admin/platforms/PlatformDialog";
import {
  computeStats,
  filterPlatforms,
} from "@/components/admin/platforms/platformsLogic";
import type { PlatformRow } from "@/components/admin/platforms/types";

/**
 * Onglet « Plateformes » : orchestre le chargement, l'écriture et le rendu de
 * la vue choisie. Les vues ne reçoivent que des données et des rappels ; seul
 * le hook touche au routeur.
 *
 * `console_type` compte quelques dizaines de lignes : la liste entière est
 * chargée une fois, puis filtrée en mémoire — pas de pagination, pas
 * d'aller-retour serveur à chaque frappe.
 */
export default function PlatformsManager() {
  const t = useTranslations("admin.platforms");
  const { filters, setFilters, clearFilters, activeFilterCount } =
    usePlatformsFilters();

  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Garde anti-course : seule la dernière requête émise peut écrire l'état.
  const requestIdRef = useRef(0);

  const showAlert = useCallback(
    (type: "success" | "destructive", message: string) => {
      if (type === "success") {
        toast.success(t("alerts.successTitle"), { description: message });
      } else {
        toast.error(t("alerts.errorTitle"), { description: message });
      }
    },
    [t],
  );

  const fetchPlatforms = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const res = await fetch("/api/admin/console-type?stats=1");
      if (!res.ok) throw new Error("Erreur API");
      const rows = (await res.json()) as PlatformRow[];

      if (requestId !== requestIdRef.current) return;
      setPlatforms(rows);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error(err);
      showAlert("destructive", t("alerts.fetchError"));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPlatforms();
    setIsRefreshing(false);
  }, [fetchPlatforms]);

  /**
   * Écriture d'un champ de la plateforme. La liste locale n'est mise à jour
   * qu'une fois le serveur d'accord : un échec doit laisser l'écran sur ce qui
   * est réellement enregistré.
   */
  const patchPlatform = useCallback(
    async (
      platform: PlatformRow,
      patch: Partial<Pick<PlatformRow, "picture" | "description">>,
      messages: { success: string; error: string },
    ) => {
      try {
        const res = await fetch(`/api/admin/console-type/${platform.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setPlatforms((prev) =>
          prev.map((row) =>
            row.id === platform.id ? { ...row, ...patch } : row,
          ),
        );
        showAlert("success", messages.success);
      } catch (err) {
        console.error(err);
        showAlert(
          "destructive",
          err instanceof Error && err.message !== "Erreur API"
            ? err.message
            : messages.error,
        );
      }
    },
    [showAlert],
  );

  const handlePictureChange = useCallback(
    async (platform: PlatformRow, picture: string | null) => {
      const isRemoval = picture === null;
      await patchPlatform(
        platform,
        { picture },
        {
          success: isRemoval
            ? t("alerts.removeSuccess")
            : t("alerts.updateSuccess"),
          error: isRemoval ? t("alerts.removeError") : t("alerts.updateError"),
        },
      );
    },
    [patchPlatform, t],
  );

  const handleDescriptionChange = useCallback(
    async (platform: PlatformRow, description: string | null) => {
      await patchPlatform(
        platform,
        { description },
        {
          success: t("alerts.descriptionSuccess"),
          error: t("alerts.descriptionError"),
        },
      );
    },
    [patchPlatform, t],
  );

  const visiblePlatforms = useMemo(
    () => filterPlatforms(platforms, filters),
    [platforms, filters],
  );
  const stats = useMemo(() => computeStats(platforms), [platforms]);

  // La liste complète est déjà en mémoire : la pagination ne fait que
  // découper, sans rappel au serveur.
  const { page, pageSize } = filters;
  const pagePlatforms = useMemo(
    () => visiblePlatforms.slice((page - 1) * pageSize, page * pageSize),
    [visiblePlatforms, page, pageSize],
  );

  // Page devenue hors bornes (URL modifiée à la main, filtre qui réduit la
  // liste) : on ramène à la dernière page réelle plutôt que d'afficher du vide.
  useEffect(() => {
    if (loading || visiblePlatforms.length === 0) return;
    const totalPages = Math.max(1, Math.ceil(visiblePlatforms.length / pageSize));
    if (page > totalPages) setFilters({ page: totalPages });
  }, [loading, visiblePlatforms.length, page, pageSize, setFilters]);

  // La plateforme éditée est relue dans la liste plutôt que copiée : après un
  // enregistrement, le dialogue doit montrer la valeur enregistrée.
  const editingPlatform =
    platforms.find((platform) => platform.id === editingId) ?? null;

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <PlatformsStatsBar
        stats={loading ? null : stats}
        loading={loading}
        photo={filters.photo}
        onPhotoChange={(photo) => setFilters({ photo })}
      />

      <Card className="shadow-md">
        <CardHeader className="border-b p-4 pb-3 sm:p-6 sm:pb-4">
          <PlatformsFilters
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            totalItems={visiblePlatforms.length}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <PlatformsSkeleton view={filters.view} />
          ) : visiblePlatforms.length === 0 ? (
            <EmptyState
              icon={Monitor}
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
            <PlatformsGrid
              platforms={pagePlatforms}
              onEdit={(platform) => setEditingId(platform.id)}
            />
          ) : (
            <PlatformsTable
              platforms={pagePlatforms}
              onEdit={(platform) => setEditingId(platform.id)}
            />
          )}

          {!loading && visiblePlatforms.length > 0 && (
            <PaginationControls
              page={page}
              totalItems={visiblePlatforms.length}
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

      <PlatformDialog
        platform={editingPlatform}
        onClose={() => setEditingId(null)}
        onPictureChange={handlePictureChange}
        onDescriptionChange={handleDescriptionChange}
      />
    </div>
  );
}
