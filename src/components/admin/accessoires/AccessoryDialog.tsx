"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseDbDate } from "@/lib/dates";
import type {
  AccessoryRow,
  ConsoleTypeOption,
} from "@/components/admin/accessoires/types";

type Props = {
  accessory: AccessoryRow | null;
  consoleTypes: ConsoleTypeOption[];
  onClose: () => void;
  onSave: (accessory: AccessoryRow, consoles: number[]) => Promise<boolean>;
};

/**
 * Détail d'un accessoire : ce que le catalogue Koha impose (nom, identifiant,
 * dernière écriture) en lecture seule, puis la seule chose que l'admin décide
 * ici — les plateformes compatibles.
 *
 * La sélection est réinitialisée à chaque ouverture depuis la ligne reçue, pas
 * conservée entre deux accessoires : un dialogue rouvert doit montrer ce qui
 * est enregistré, pas les cases laissées par la fois précédente.
 */
export default function AccessoryDialog({
  accessory,
  consoleTypes,
  onClose,
  onSave,
}: Props) {
  const t = useTranslations("admin.accessories");
  const locale = useLocale();
  const [selection, setSelection] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (accessory) {
      setSelection(accessory.consoles.map((console) => console.id));
    }
  }, [accessory]);

  const lastUpdated = parseDbDate(accessory?.lastUpdatedAt ?? null);
  const formattedDate = lastUpdated
    ? lastUpdated.toLocaleDateString(locale === "en" ? "en-CA" : "fr-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : t("dialog.neverUpdated");

  // Comparaison d'ensembles : cocher puis décocher ne doit pas activer le
  // bouton d'enregistrement.
  const initial = new Set(accessory?.consoles.map((c) => c.id) ?? []);
  const isDirty =
    selection.length !== initial.size ||
    selection.some((id) => !initial.has(id));

  async function handleSave() {
    if (!accessory) return;
    setSaving(true);
    const ok = await onSave(accessory, selection);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Dialog
      open={accessory !== null}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="pr-6">{accessory?.name}</DialogTitle>
          <DialogDescription>{t("dialog.nameLocked")}</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("table.kohaId")}
            </dt>
            <dd className="font-medium tabular-nums">{accessory?.kohaId}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("table.visible")}
            </dt>
            <dd>
              <Badge variant={accessory?.hidden ? "outline" : "default"}>
                {accessory?.hidden ? t("status.hidden") : t("status.visible")}
              </Badge>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">
              {t("dialog.lastUpdated")}
            </dt>
            <dd className="font-medium">{formattedDate}</dd>
          </div>
        </dl>

        {selection.length === 0 && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {t("dialog.noConsoleWarning")}
          </p>
        )}

        <div className="max-h-[45vh] space-y-2 overflow-y-auto py-1">
          {consoleTypes.map((option) => {
            const checked = selection.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors hover:border-cyan-500"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    setSelection((prev) =>
                      value
                        ? [...prev, option.id]
                        : prev.filter((id) => id !== option.id),
                    )
                  }
                />
                <Monitor className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium">{option.name}</span>
              </label>
            );
          })}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
