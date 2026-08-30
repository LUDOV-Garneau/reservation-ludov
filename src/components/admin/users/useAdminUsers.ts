"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminUsersFilters } from "@/hooks/useAdminUsersFilters";
import type { AdminUser, UserStats } from "./types";

/**
 * Chargement de l'onglet Utilisateurs. L'état de la vue (recherche, tri,
 * filtres, pagination) vit dans l'URL via `useAdminUsersFilters` ; ce hook ne
 * fait que le traduire en requêtes et exposer le résultat.
 *
 * Il n'importe aucun composant : la présentation se contente d'afficher ce
 * qu'il renvoie.
 */
export function useAdminUsers() {
  const { filters, setFilters, toggleSort, clearFilters, activeFilterCount } =
    useAdminUsersFilters();

  const [reloadToken, setReloadToken] = useState(0);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Une réponse lente ne doit pas écraser le résultat d'une requête plus
  // récente : on ne retient que celle dont le numéro est encore le dernier.
  const requestRef = useRef(0);

  const { search, role, status, sort, order, page, pageSize } = filters;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.id) setCurrentUserId(Number(data.id));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestRef.current;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        sort,
        order,
      });
      if (search.trim()) params.set("search", search.trim());
      if (role !== "all") params.set("role", role);
      if (status !== "all") params.set("status", status);

      try {
        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || err?.message || "Erreur API utilisateurs");
        }

        const data = await res.json();
        if (cancelled || requestId !== requestRef.current) return;

        setUsers(data.rows ?? []);
        setTotal(Number(data.total ?? 0));
      } catch (err) {
        if (cancelled || requestId !== requestRef.current) return;
        console.error("Error fetching users:", err);
        setUsers([]);
        setTotal(0);
        // On distingue l'échec du chargement d'une liste réellement vide :
        // l'écran affiche un état d'erreur avec « Réessayer ».
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        if (!cancelled && requestId === requestRef.current) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [search, role, status, sort, order, page, pageSize, reloadToken]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setStatsLoading(true);
      try {
        const res = await fetch("/api/admin/users/stats", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch user stats");
        const data = await res.json();
        if (cancelled) return;
        setStats({
          totalUser: Number(data.totalUser ?? 0),
          totalUserNotBoarded: Number(data.totalUserNotBoarded ?? 0),
          totalUserWithReservation: Number(data.totalUserWithReservation ?? 0),
        });
      } catch (err) {
        // Une stat manquante ne doit pas bloquer la liste : les tuiles
        // resteront à « — », l'écran reste utilisable.
        console.error("Error fetching user stats:", err);
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setReloadToken((token) => token + 1);
  }, []);

  // `refresh` ne peut pas attendre les effets qu'il déclenche ; l'indicateur
  // est éteint quand les deux chargements sont retombés.
  useEffect(() => {
    if (isRefreshing && !loading && !statsLoading) setIsRefreshing(false);
  }, [isRefreshing, loading, statsLoading]);

  const pageIds = useMemo(() => users.map((user) => user.id), [users]);

  // Clé qui change dès que le contenu affiché change : sert à vider la
  // sélection, car agir sur des lignes qu'on ne voit plus est un piège.
  const viewKey = `${page}|${pageSize}|${search}|${sort}|${order}|${role}|${status}|${reloadToken}`;

  return {
    users,
    pageIds,
    total,
    loading,
    error,
    stats,
    statsLoading,
    currentUserId,
    isRefreshing,
    filters,
    setFilters,
    toggleSort,
    clearFilters,
    activeFilterCount,
    refresh,
    retry: refresh,
    viewKey,
  };
}
