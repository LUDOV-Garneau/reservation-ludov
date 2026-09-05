import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { AlertType } from "./useAlert";
import type { ReservationsFiltersState } from "@/hooks/useReservationsFilters";

export type Reservation = {
  id: string;
  console: string;
  station: string;
  games: string[];
  accessories: string[];
  coursCode: string;
  coursName: string;
  date: string;
  heure: string;
  userNom: string | null;
  archived: boolean;
};

export type ReservationMetrics = {
  total: number;
  future: number;
  past: number;
  cancelled: number;
};

type ApiResponse = {
  rows?: Reservation[];
  total?: number;
  totalReservations?: number;
  futureReservations?: number;
  pastReservations?: number;
  cancelledReservations?: number;
};

const DEFAULT_METRICS: ReservationMetrics = {
  total: 0,
  future: 0,
  past: 0,
  cancelled: 0,
};

/**
 * Charge une page de réservations. Filtres, tri et pagination sont désormais
 * entièrement côté serveur : ce hook ne fait que transporter l'état de la vue
 * jusqu'à l'API et retourner ce qu'elle répond.
 */
export function useReservations(
  filters: ReservationsFiltersState,
  toApiQuery: (state: ReservationsFiltersState) => string,
  onError: (type: AlertType, message: string) => void,
) {
  const t = useTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState<ReservationMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchReservations = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        // En mode silencieux (mise à jour optimiste), on rafraîchit les données
        // sans faire clignoter le squelette de chargement.
        if (!opts?.silent) {
          setLoading(true);
          setMetricsLoading(true);
        }

        const res = await fetch(
          `/api/admin/reservations?${toApiQuery(filters)}`,
          { credentials: "include" },
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error ?? "Erreur API réservations",
          );
        }

        const data = (await res.json()) as ApiResponse;

        setReservations(
          (data.rows ?? []).map((r) => ({
            id: String(r.id),
            console: r.console ?? "",
            station: r.station ?? "",
            games: Array.isArray(r.games) ? r.games : [],
            accessories: Array.isArray(r.accessories) ? r.accessories : [],
            coursCode: r.coursCode ?? "",
            coursName: r.coursName ?? "",
            date: r.date,
            heure: r.heure ?? "",
            userNom: r.userNom ?? null,
            archived: Boolean(r.archived),
          })),
        );

        setTotal(Number(data.total ?? 0));
        setMetrics({
          total: Number(data.totalReservations ?? 0),
          future: Number(data.futureReservations ?? 0),
          past: Number(data.pastReservations ?? 0),
          cancelled: Number(data.cancelledReservations ?? 0),
        });
      } catch (error) {
        console.error(error);
        setReservations([]);
        setTotal(0);
        onError("destructive", t("admin.reservations.alert.fetchError"));
      } finally {
        setLoading(false);
        setMetricsLoading(false);
      }
    },
    [filters, toApiQuery, onError, t],
  );

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const markCancelled = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, archived: true } : r)),
    );
  }, []);

  const refreshSilent = useCallback(
    () => fetchReservations({ silent: true }),
    [fetchReservations],
  );

  return {
    reservations,
    total,
    metrics,
    loading,
    metricsLoading,
    refresh: fetchReservations,
    refreshSilent,
    markCancelled,
  };
}
