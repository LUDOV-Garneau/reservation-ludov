"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

type ArtworkResult = {
  id: string;
  source: "igdb" | "mobygames";
  title: string;
  year: number | null;
  platforms: string[];
  thumbnailUrl: string;
  imageUrl: string;
};

type Props = {
  /** Titre du jeu : la recherche démarre pré-remplie avec lui. */
  initialQuery: string;
  /** Chemin local (/api/images/...) une fois la jaquette rapatriée. */
  onPicked: (path: string) => void;
  disabled?: boolean;
};

const SOURCE_LABELS: Record<ArtworkResult["source"], string> = {
  igdb: "IGDB",
  mobygames: "MobyGames",
};

/**
 * Recherche de jaquettes dans les bases de jeux, avec aperçu et source.
 *
 * Choisir un résultat ne pose pas de lien distant sur le jeu : l'image est
 * rapatriée sur le volume via POST /api/admin/uploads, exactement comme un
 * import par lien collé à la main.
 */
export default function GameArtworkSearch({
  initialQuery,
  onPicked,
  disabled = false,
}: Props) {
  const t = useTranslations("admin.gamesImages.search");

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ArtworkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSource, setNoSource] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError(null);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Une frappe de plus annule la requête précédente : sans cela, une
      // réponse lente pourrait écraser celle d'une recherche plus récente.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/games/artwork-search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setResults(data.results ?? []);
        setNoSource(Boolean(data.noSourceConfigured));
        setHasSearched(true);
        setError(
          Array.isArray(data.failedSources) && data.failedSources.length > 0
            ? t("partialFailure")
            : null,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setError(t("error"));
        setResults([]);
        setHasSearched(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, t]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handlePick = useCallback(
    async (result: ArtworkResult) => {
      if (disabled || importingId) return;
      setImportingId(result.id);
      setError(null);
      try {
        const formData = new FormData();
        formData.set("category", "games");
        formData.set("url", result.imageUrl);

        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || t("importError"));
        }
        onPicked(data.path);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("importError"));
      } finally {
        setImportingId(null);
      }
    },
    [disabled, importingId, onPicked, t],
  );

  const trimmed = query.trim();

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("placeholder")}
          disabled={disabled}
          className="pl-9"
          aria-label={t("placeholder")}
        />
      </div>

      {noSource ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("noSource")}</AlertDescription>
        </Alert>
      ) : (
        <>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {trimmed.length < MIN_QUERY_LENGTH ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("hint")}
            </p>
          ) : loading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-md" />
              ))}
            </div>
          ) : results.length === 0 ? (
            hasSearched && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("empty", { query: trimmed })}
              </p>
            )
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {results.map((result) => {
                const isImporting = importingId === result.id;
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => handlePick(result)}
                    disabled={disabled || importingId !== null}
                    aria-label={t("use", { title: result.title })}
                    className="group flex flex-col overflow-hidden rounded-md border bg-card text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1 disabled:opacity-60"
                  >
                    <div className="relative aspect-[3/4] w-full bg-muted/30">
                      <Image
                        src={result.thumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        loading="lazy"
                        sizes="120px"
                        className="object-cover"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        <span className="rounded bg-white px-2 py-1 text-[11px] font-medium text-gray-900">
                          {t("useShort")}
                        </span>
                      </div>
                      {isImporting && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 p-1.5">
                      <span className="line-clamp-2 block text-xs font-medium leading-snug">
                        {result.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {[result.year, result.platforms[0]]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </span>
                      <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {SOURCE_LABELS[result.source]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
