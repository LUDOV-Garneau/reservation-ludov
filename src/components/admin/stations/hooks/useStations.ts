"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { AlertType } from "@/hooks/useAlert";
import type { StationsFiltersState } from "@/hooks/useStationsFilters";
import type { Station, StationStats } from "@/components/admin/stations/types";

type ListResponse = {
  data?: { stations?: Station[]; total?: number };
};

type StatsResponse = {
  data?: {
    totalActiveStations?: number;
    totalInactiveStations?: number;
    mostUsedStationName?: string | null;
  };
};

const EMPTY_STATS: StationStats = { active: 0, inactive: 0, mostUsed: null };

/**
 * Charge une page de stations. Recherche, statut, tri et pagination sont
 * appliqués par l'API : ce hook ne fait que transporter l'état de la vue.
 *
 * Les statistiques viennent d'une seconde route et sont globales : elles ne
 * suivent pas les filtres, mais elles suivent les créations, modifications et
 * désactivations, donc elles sont rechargées avec la liste.
 */
export function useStations(
  filters: StationsFiltersState,
  toApiQuery: (state: StationsFiltersState) => string,
  onError: (type: AlertType, message: string) => void,
) {
  const t = useTranslations("admin.stations");
  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<StationStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchAll = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setStatsLoading(true);
      }

      const [listResult, statsResult] = await Promise.allSettled([
        fetch(`/api/admin/stations?${toApiQuery(filters)}`, {
          credentials: "include",
        }),
        fetch("/api/admin/stations/stats", { credentials: "include" }),
      ]);

      try {
        if (listResult.status === "rejected" || !listResult.value.ok) {
          throw new Error("Erreur API stations");
        }
        const body = (await listResult.value.json()) as ListResponse;
        setStations(body.data?.stations ?? []);
        setTotal(Number(body.data?.total ?? 0));
      } catch (error) {
        console.error(error);
        setStations([]);
        setTotal(0);
        onError("destructive", t("alert.fetchError"));
      } finally {
        setLoading(false);
      }

      try {
        if (statsResult.status === "rejected" || !statsResult.value.ok) {
          throw new Error("Erreur API stats stations");
        }
        const body = (await statsResult.value.json()) as StatsResponse;
        setStats({
          active: Number(body.data?.totalActiveStations ?? 0),
          inactive: Number(body.data?.totalInactiveStations ?? 0),
          mostUsed: body.data?.mostUsedStationName ?? null,
        });
      } catch (error) {
        // Les statistiques ne valent pas un message d'erreur à elles seules :
        // la liste, elle, s'affiche.
        console.error(error);
        setStats(EMPTY_STATS);
      } finally {
        setStatsLoading(false);
      }
    },
    [filters, toApiQuery, onError, t],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshSilent = useCallback(
    () => fetchAll({ silent: true }),
    [fetchAll],
  );

  return {
    stations,
    total,
    stats,
    loading,
    statsLoading,
    refresh: fetchAll,
    refreshSilent,
  };
}
