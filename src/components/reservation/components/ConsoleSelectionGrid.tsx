"use client";

import { Console } from "@/types/console";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  AlertCircle,
  Check,
  RefreshCw,
  Monitor,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ConsoleSelectionGridProps {
  selectedId: number | null;
  reservedId?: number | null;
  onSelect: (console: Console) => void;
}

type LoadingState = "idle" | "loading" | "success" | "error";

export default function ConsoleSelectionGrid({
  selectedId,
  reservedId,
  onSelect,
}: ConsoleSelectionGridProps) {
  const t = useTranslations();

  const [consoles, setConsoles] = useState<Console[]>([]);
  const [search, setSearch] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedConsoleId, setSelectedConsoleId] = useState<number | null>(
    selectedId || null
  );

  const fetchConsoles = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoadingState("loading");
      setError(null);

      const res = await fetch("/api/reservation/consoles", {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || `Erreur ${res.status}: ${res.statusText}`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Format de données invalide");
      }

      const validatedConsoles: Console[] = data
        .map((c: Console) => ({
          id: Number(c.id) || 0,
          name: c.name || "Console inconnue",
          active_units: Number(c.active_units) || 0,
          picture: c.picture,
        }))
        .filter((c) => c.id > 0);

      setSelectedConsoleId(selectedId || null);
      setConsoles(validatedConsoles);
      setLoadingState("success");
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      let errorMessage = t("reservation.console.error");
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMessage = t("reservation.console.errorLoading");
        } else if (err.message.includes("fetch")) {
          errorMessage = t("reservation.console.errorServer");
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setLoadingState("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    fetchConsoles();
  }, [fetchConsoles]);

  useEffect(() => {
    fetchConsoles();
  }, [fetchConsoles]);

  useEffect(() => {
    setSelectedConsoleId(selectedId);
  }, [selectedId]);

  const filteredConsoles = useMemo(() => {
    if (!search.trim()) return consoles;

    const searchLower = search.toLowerCase();
    return consoles.filter((c) => c.name.toLowerCase().includes(searchLower));
  }, [consoles, search]);

  const handleSelect = useCallback(
    (console: Console) => {
      setSelectedConsoleId(console.id);
      onSelect(console);
    },
    [onSelect]
  );

  if (loadingState === "loading" && consoles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
        <p className="text-gray-600 font-medium">
          {t("reservation.console.loadingConsoles")}
        </p>
        <p className="text-sm text-gray-500">
          {t("reservation.console.loadingDelay")}
        </p>
      </div>
    );
  }

  if (loadingState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <p className="text-red-600 font-semibold text-lg mb-1">{error}</p>
          <p className="text-sm text-gray-500">
            {retryCount > 0 &&
              t("reservation.console.retryAttempt", { count: retryCount })}
          </p>
        </div>
        <button
          onClick={retry}
          className="mt-2 px-6 py-2.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t("reservation.console.retry")}
        </button>
      </div>
    );
  }

  if (consoles.length === 0 && loadingState === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Monitor className="h-12 w-12 text-gray-400" />
        <p className="text-gray-600 font-medium">
          {t("reservation.console.noConsoleAvailable")}
        </p>
        <button
          onClick={retry}
          className="text-cyan-500 hover:text-cyan-600 text-sm underline"
        >
          {t("reservation.console.refresh")}
        </button>
      </div>
    );
  }

  const availableConsoles = filteredConsoles.filter(
    (c) => c.active_units > 0 || c.id === reservedId
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder={t("reservation.console.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-base rounded-lg"
            aria-label={t("reservation.console.searchPlaceholder")}
          />
        </div>
        {search && (
          <p className="text-sm text-gray-500 px-1">
            {t("reservation.console.consoleCount", {
              count: availableConsoles.length,
            })}{" "}
            {availableConsoles.length > 1
              ? t("reservation.console.consoleCountFound", {
                  count: availableConsoles.length,
                })
              : ""}
          </p>
        )}
      </div>

      {availableConsoles.length === 0 && search && (
        <div className="text-center py-12">
          <Monitor className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            {t("reservation.console.noConsoleForSearch", { search })}
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-3 text-cyan-500 hover:text-cyan-600 text-sm underline"
          >
            {t("reservation.console.clearSearch")}
          </button>
        </div>
      )}

      {availableConsoles.length === 0 && !search && consoles.length > 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            {t("reservation.console.noneAvailable")}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t("reservation.console.allReserved")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
        {availableConsoles.map((console) => {
          const isSelected =
            selectedConsoleId === console.id || reservedId === console.id;
          return (
            <div
              key={console.id}
              onClick={() => handleSelect(console)}
              className={`
                relative group
                rounded-xl overflow-hidden shadow-md
                transition-all duration-200 cursor-pointer 
                hover:scale-[1.02]
                ${isSelected ? "ring-2 ring-cyan-500 scale-[1.02]" : ""}
              `}
            >
              <div className="relative w-full h-48 bg-gray-100">
                <div className="flex items-center justify-center h-full text-gray-400">
                  <Monitor className="h-12 w-12" />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {console.id === reservedId && (
                  <div className="absolute top-3 left-3 bg-cyan-600 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-md">
                    {t("reservation.console.reservedForYou")}
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-lg font-bold line-clamp-2">
                    {console.name}
                  </p>
                  <p className="text-white/90 text-sm mt-1">
                    {console.active_units > 0
                      ? t("reservation.console.available", {
                          count: console.active_units,
                        })
                      : t("reservation.console.soldOut")}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3 bg-cyan-500 rounded-full p-2 shadow-lg animate-in zoom-in-50">
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
