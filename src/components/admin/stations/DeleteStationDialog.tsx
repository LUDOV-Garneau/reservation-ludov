"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MonitorX, Trash2 } from "lucide-react";
import type { AlertType } from "@/hooks/useAlert";
import type { Station } from "@/components/admin/stations/types";

type Blocked = { reservations: number; upcoming: number };

/**
 * Suppression d'une station.
 *
 * L'API refuse (409) dès qu'une réservation est rattachée. La modale montre
 * alors le décompte et propose de **désactiver** la station : elle disparaît du
 * parcours de réservation, l'historique reste. C'est le remplacement de la
 * cascade silencieuse qui effaçait toutes les réservations du poste.
 */
export default function DeleteStationDialog({
  station,
  open,
  onOpenChange,
  onSuccess,
  onAlert,
}: {
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
}) {
  const t = useTranslations("admin.stations.deleteDialog");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<Blocked | null>(null);

  const close = useCallback(
    (value: boolean) => {
      if (loading) return;
      if (!value) setBlocked(null);
      onOpenChange(value);
    },
    [loading, onOpenChange],
  );

  const remove = useCallback(async () => {
    if (!station || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as Partial<Blocked>;
        setBlocked({
          reservations: Number(body.reservations ?? 0),
          upcoming: Number(body.upcoming ?? 0),
        });
        return;
      }

      if (!res.ok) throw new Error();

      onAlert("success", t("alerts.deleted"));
      onOpenChange(false);
      setBlocked(null);
      onSuccess();
    } catch {
      onAlert("destructive", t("alerts.deleteError"));
    } finally {
      setLoading(false);
    }
  }, [station, loading, onAlert, onOpenChange, onSuccess, t]);

  const deactivate = useCallback(async () => {
    if (!station || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // PATCH partiel : on ne renvoie que ce qu'on change. Réexpédier
        // `consoles` rendrait indésactivable une station qui n'en a aucune.
        body: JSON.stringify({ isActive: false }),
      });

      if (!res.ok) throw new Error();

      onAlert("success", t("alerts.deactivated"));
      onOpenChange(false);
      setBlocked(null);
      onSuccess();
    } catch {
      onAlert("destructive", t("alerts.deactivateError"));
    } finally {
      setLoading(false);
    }
  }, [station, loading, onAlert, onOpenChange, onSuccess, t]);

  if (!station) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-[480px]">
        <div className="border-b bg-rose-50 px-6 py-4 dark:bg-rose-950">
          <DialogTitle className="text-lg text-rose-900 dark:text-rose-100">
            {blocked ? t("blockedTitle") : t("title")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-rose-700 dark:text-rose-300">
            {blocked ? t("blockedDescription") : t("description")}
          </DialogDescription>
        </div>

        <div className="space-y-5 px-6 pb-5 pt-5">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="truncate text-sm font-semibold">{station.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {station.consoles.length > 0
                ? station.consoles.join(", ")
                : t("noPlatforms")}
            </p>
          </div>

          {blocked ? (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <p>{t("blockedCount", { count: blocked.reservations })}</p>
              {blocked.upcoming > 0 && (
                <p>{t("blockedUpcoming", { count: blocked.upcoming })}</p>
              )}
              <p className="text-amber-800 dark:text-amber-200">
                {t("blockedHint")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("onlyIfEmpty")}</p>
          )}

          <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => close(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>

            {blocked ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={deactivate}
                disabled={loading || !station.isActive}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("deactivating")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <MonitorX className="h-4 w-4" />
                    {station.isActive
                      ? t("deactivate")
                      : t("alreadyInactive")}
                  </span>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={remove}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("deleting")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {t("confirm")}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
