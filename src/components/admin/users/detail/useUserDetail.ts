"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SESSION_DURATION_HOURS } from "@/lib/dates";

export type UserDetails = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  isAdmin: number;
  preferredLocale: string;
  lastUpdatedAt: string | null;
  createdAt: string;
  lastLogin: string | null;
  hasPassword: boolean;
};

export type ReservationStatus = "upcoming" | "ongoing" | "completed" | "canceled";

export type UserReservation = {
  id: string;
  games: string[];
  accessories: string[];
  console: string;
  date: string;
  heure: string;
  archived: boolean;
  /** `null` quand la date ou l'heure sont inexploitables. */
  start: Date | null;
  end: Date | null;
  status: ReservationStatus | null;
};

type RawReservation = Omit<UserReservation, "start" | "end" | "status">;

/**
 * `date` arrive en `YYYY-MM-DD` et `heure` en `HH:mm`, mais l'API renvoie une
 * chaîne vide quand l'heure est absente : `new Date("2026-08-29T")` donne alors
 * une date invalide qui se propage silencieusement jusqu'à l'affichage et au
 * calcul du statut. On renvoie `null` plutôt que de laisser passer.
 */
function parseSlot(date: string, heure: string): Date | null {
  if (!date || !heure) return null;
  const parsed = new Date(`${date}T${heure}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeStatus(
  archived: boolean,
  start: Date | null,
  end: Date | null,
  now: Date,
): ReservationStatus | null {
  if (archived) return "canceled";
  if (!start || !end) return null;
  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "completed";
}

export function useUserDetail(userId: string) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [reservations, setReservations] = useState<RawReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Erreur distincte : une liste de réservations qui n'a pas pu être chargée
  // n'est pas la même chose qu'un utilisateur sans réservation.
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setReservationsError(null);

      const [userRes, reservationsRes] = await Promise.allSettled([
        fetch(`/api/admin/users/${userId}`, { credentials: "include" }),
        fetch(`/api/admin/users/${userId}/reservations`, { credentials: "include" }),
      ]);

      if (cancelled) return;

      try {
        if (userRes.status === "rejected") throw userRes.reason;
        if (!userRes.value.ok) {
          const err = await userRes.value.json().catch(() => ({}));
          throw new Error(err?.error || "Erreur API utilisateur");
        }
        const data = await userRes.value.json();
        if (!cancelled) setUser(data.user);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching user data:", err);
          setUser(null);
          setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      }

      try {
        if (reservationsRes.status === "rejected") throw reservationsRes.reason;
        if (!reservationsRes.value.ok) {
          const err = await reservationsRes.value.json().catch(() => ({}));
          throw new Error(err?.error || "Erreur API réservations");
        }
        const data = await reservationsRes.value.json();
        if (!cancelled) setReservations(data.reservations ?? []);
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching user reservations:", err);
          setReservations([]);
          setReservationsError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      }

      if (!cancelled) setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  const enriched = useMemo<UserReservation[]>(() => {
    const now = new Date();
    return reservations.map((row) => {
      const start = parseSlot(row.date, row.heure);
      const end = start
        ? new Date(start.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000)
        : null;
      return { ...row, start, end, status: computeStatus(row.archived, start, end, now) };
    });
  }, [reservations]);

  /**
   * Les trois compteurs partitionnent réellement la liste. La version
   * précédente affichait « Réservations = total − annulées », ce qui incluait
   * les complétées : les trois nombres se recoupaient sans le dire.
   */
  const counts = useMemo(() => {
    const canceled = enriched.filter((r) => r.status === "canceled").length;
    const completed = enriched.filter((r) => r.status === "completed").length;
    const upcoming = enriched.filter(
      (r) => r.status === "upcoming" || r.status === "ongoing",
    ).length;
    return { total: enriched.length, canceled, completed, upcoming };
  }, [enriched]);

  return {
    user,
    reservations: enriched,
    counts,
    loading,
    error,
    reservationsError,
    refresh,
  };
}
