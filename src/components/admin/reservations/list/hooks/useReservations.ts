import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { AlertType } from "./useAlert";

export type Reservation = {
  id: string;
  console: string;
  date: string;
  heure: string;
  userNom: string | null;
  archived: boolean;
};

export type ReservationMetrics = {
  total: number;
  future: number;
  past: number;
};

type ApiResponse = {
  rows?: Reservation[];
  total?: number;
  totalReservations?: number;
  futureReservations?: number;
  pastReservations?: number;
};

const DEFAULT_METRICS: ReservationMetrics = { total: 0, future: 0, past: 0 };

export function useReservations(
  page: number,
  itemsPerPage: number,
  onError: (type: AlertType, message: string) => void,
  setTotal: (total: number) => void
) {
  const t = useTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [metrics, setMetrics] = useState<ReservationMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setMetricsLoading(true);

      const res = await fetch(
        `/api/admin/reservations?page=${page}&limit=${itemsPerPage}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erreur API réservations");
      }

      const data = (await res.json()) as ApiResponse;

      const rows: Reservation[] = (data.rows ?? []).map((r) => ({
        id: String(r.id),
        console: r.console ?? "",
        date: r.date,
        heure: r.heure ?? "",
        userNom: r.userNom ?? null,
        archived: Boolean(r.archived),
      }));

      setReservations(rows);

      const totalCount = Number(data.total ?? data.totalReservations ?? rows.length);
      setTotal(totalCount);
      setMetrics({
        total: Number(data.totalReservations ?? totalCount),
        future: Number(data.futureReservations ?? 0),
        past: Number(data.pastReservations ?? 0),
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
  }, [page, itemsPerPage, onError, setTotal, t]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return {
    reservations,
    metrics,
    loading,
    metricsLoading,
    refresh: fetchReservations,
  };
}
