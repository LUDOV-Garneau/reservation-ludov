"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Monitor,
  MonitorCheck,
  Plus,
  Settings,
  X,
} from "lucide-react";
import type { AlertType } from "@/hooks/useAlert";
import type {
  ConsoleTypeOption,
  Station,
} from "@/components/admin/stations/types";

type Props = {
  /** `null` = création ; une station = modification. */
  station: Station | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
};

/**
 * Formulaire de station, création et modification confondues.
 *
 * `AddStationForm` (336 lignes) et `UpdateStationForm` (381) étaient le même
 * écran à un interrupteur près : toute correction devait être faite deux fois,
 * et ne l'était pas toujours.
 */
export default function StationFormDialog({
  station,
  open,
  onOpenChange,
  onSuccess,
  onAlert,
}: Props) {
  const t = useTranslations("admin.stations.form");
  const isEdit = station !== null;

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [consoleList, setConsoleList] = useState<ConsoleTypeOption[]>([]);
  const [selected, setSelected] = useState<ConsoleTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le formulaire est remis à l'état de la station à chaque ouverture : une
  // modification abandonnée ne doit pas ressurgir à la suivante.
  useEffect(() => {
    if (!open) return;
    setName(station?.name ?? "");
    setIsActive(station?.isActive ?? true);
    setSelected([]);
    setError(null);
  }, [open, station]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/console-type", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("console-type");
        const data = (await res.json()) as ConsoleTypeOption[];
        if (cancelled) return;

        setConsoleList(data);
        // La sélection initiale est résolue ici, une fois la liste connue :
        // la station ne porte que des identifiants.
        if (station) {
          const ids = station.consolesId.map(Number);
          setSelected(data.filter((option) => ids.includes(option.id)));
        }
      } catch {
        if (!cancelled) setError(t("errors.consoleFetch"));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, station, t]);

  const available = consoleList.filter(
    (option) => !selected.some((entry) => entry.id === option.id),
  );

  const addConsole = (value: string) => {
    const option = consoleList.find((entry) => entry.id === Number(value));
    if (!option || selected.some((entry) => entry.id === option.id)) return;
    setSelected((prev) => [...prev, option]);
    setError(null);
  };

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (loading) return;

      if (!name.trim() || selected.length === 0) {
        setError(t("errors.missingFields"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          isEdit ? `/api/admin/stations/${station.id}` : "/api/admin/stations",
          {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: name.trim(),
              consoles: selected.map((entry) => entry.id),
              ...(isEdit ? { isActive } : {}),
            }),
          },
        );

        if (res.status === 409) {
          setError(t("errors.nameConflict"));
          return;
        }

        if (!res.ok) {
          // Le serveur nomme la plateforme inconnue ou la longueur dépassée :
          // son message est plus utile qu'un « erreur » générique.
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "");
        }

        onAlert("success", isEdit ? t("alerts.updated") : t("alerts.created"));
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        setError(message || (isEdit ? t("alerts.updateError") : t("alerts.createError")));
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      name,
      selected,
      isEdit,
      station,
      isActive,
      onAlert,
      onOpenChange,
      onSuccess,
      t,
    ],
  );

  const Icon = isEdit ? Settings : MonitorCheck;

  return (
    <Dialog open={open} onOpenChange={(value) => !loading && onOpenChange(value)}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-[95vw] flex-col gap-0 p-0 sm:max-w-[650px]">
        <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            {isEdit ? t("titles.edit") : t("titles.create")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("descriptions.edit") : t("descriptions.create")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div className="space-y-2.5">
              <Label htmlFor="station-name" className="text-sm font-semibold">
                {t("fields.name")}{" "}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="station-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder={t("fields.namePlaceholder")}
                maxLength={255}
                className="h-11 text-base"
              />
            </div>

            {isEdit && (
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="min-w-0">
                  <Label htmlFor="station-active" className="text-sm font-semibold">
                    {t("fields.isActive")}
                  </Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isActive ? t("fields.isActiveOn") : t("fields.isActiveOff")}
                  </p>
                </div>
                <Switch
                  id="station-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                {t("fields.platforms")}{" "}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>

              <div className="flex flex-col gap-2 md:flex-row">
                <Select value="" onValueChange={addConsole}>
                  <SelectTrigger className="w-full flex-1 text-base">
                    <SelectValue placeholder={t("fields.platformsPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {available.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t("fields.noPlatformAvailable")}
                      </SelectItem>
                    ) : (
                      available.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          <span className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-cyan-500" />
                            {option.name}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(consoleList)}
                  disabled={available.length === 0}
                  className="w-full gap-2 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {t("button.addAll")}
                </Button>
              </div>

              {selected.length > 0 ? (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t("fields.selectedCount", { count: selected.length })}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selected.map((option) => (
                      <span
                        key={option.id}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 py-1 pl-3 pr-1 text-sm font-medium text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200"
                      >
                        {option.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSelected((prev) =>
                              prev.filter((entry) => entry.id !== option.id),
                            )
                          }
                          aria-label={t("fields.removePlatform", {
                            name: option.name,
                          })}
                          className="h-6 w-6 rounded-full hover:bg-cyan-200 dark:hover:bg-cyan-900"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
                  <Monitor className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("fields.noPlatformSelected")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("fields.noPlatformSelectedHint")}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="shrink-0 border-t px-6 py-4">
            <Button
              type="submit"
              disabled={loading || !name.trim() || selected.length === 0}
              className="h-11 w-full text-base font-semibold bg-cyan-500 text-white transition-colors hover:bg-cyan-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("button.loading")}
                </>
              ) : isEdit ? (
                t("button.save")
              ) : (
                t("button.create")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
