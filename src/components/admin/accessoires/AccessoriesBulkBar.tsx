"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, EyeOff, Loader2, Monitor, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ConsoleTypeOption } from "@/components/admin/accessoires/types";

export type BulkAction =
  | "show"
  | "hide"
  | "set-consoles"
  | "add-consoles"
  | "remove-consoles";

export type BulkResult = {
  succeeded: number[];
  failed: { id: number; error: string }[];
};

type ConsoleMode = "add" | "remove" | "set";

const ACTION_BY_MODE: Record<ConsoleMode, BulkAction> = {
  add: "add-consoles",
  remove: "remove-consoles",
  set: "set-consoles",
};

/**
 * Remplace la barre de filtres dès qu'une ligne est cochée. Un seul appel à
 * `POST /api/admin/accessories/bulk` par action ; l'orchestrateur rapporte le
 * détail des échecs plutôt qu'un succès global qui n'a peut-être pas eu lieu.
 *
 * Les trois modes de plateformes existent parce qu'ils répondent à trois
 * besoins distincts : rattacher une nouvelle plateforme sans toucher au reste
 * (`add`), corriger une erreur de masse (`remove`), et repartir de zéro sur une
 * sélection (`set`). Seul `set` est destructeur, et il le dit.
 */
export default function AccessoriesBulkBar({
  selectedIds,
  consoleTypes,
  onClear,
  onRun,
}: {
  selectedIds: number[];
  consoleTypes: ConsoleTypeOption[];
  onClear: () => void;
  onRun: (
    action: BulkAction,
    ids: number[],
    consoles?: number[],
  ) => Promise<boolean>;
}) {
  const t = useTranslations("admin.accessories.bulk");
  const [pendingVisibility, setPendingVisibility] = useState<
    "show" | "hide" | null
  >(null);
  const [consoleDialogOpen, setConsoleDialogOpen] = useState(false);
  const [mode, setMode] = useState<ConsoleMode>("add");
  const [selection, setSelection] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const count = selectedIds.length;

  async function runVisibility() {
    if (!pendingVisibility) return;
    setLoading(true);
    const ok = await onRun(pendingVisibility, selectedIds);
    setLoading(false);
    if (ok) setPendingVisibility(null);
  }

  async function runConsoles() {
    setLoading(true);
    const ok = await onRun(ACTION_BY_MODE[mode], selectedIds, selection);
    setLoading(false);
    if (ok) {
      setConsoleDialogOpen(false);
      setSelection([]);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium" aria-live="polite">
          {t("selected", { count })}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingVisibility("show")}
            className="gap-2 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950"
          >
            <Eye className="h-4 w-4" />
            {t("show")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingVisibility("hide")}
            className="gap-2 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950"
          >
            <EyeOff className="h-4 w-4" />
            {t("hide")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("add");
              setSelection([]);
              setConsoleDialogOpen(true);
            }}
            className="gap-2 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950"
          >
            <Monitor className="h-4 w-4" />
            {t("consoles")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t("clearSelection")}</span>
          </Button>
        </div>
      </div>

      <Dialog
        open={pendingVisibility !== null}
        onOpenChange={(open) => {
          if (!open && !loading) setPendingVisibility(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingVisibility === "hide"
                ? t("confirmHideTitle", { count })
                : t("confirmShowTitle", { count })}
            </DialogTitle>
            <DialogDescription>
              {pendingVisibility === "hide"
                ? t("confirmHideDescription")
                : t("confirmShowDescription")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setPendingVisibility(null)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={runVisibility}
              disabled={loading}
              className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("processing") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={consoleDialogOpen}
        onOpenChange={(open) => {
          if (!loading) setConsoleDialogOpen(open);
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("consolesTitle", { count })}</DialogTitle>
            <DialogDescription>
              {mode === "set"
                ? t("consolesSetWarning")
                : t("consolesDescription")}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as ConsoleMode)}
            className="flex flex-col gap-2 sm:flex-row sm:gap-4"
          >
            {(["add", "remove", "set"] as const).map((value) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem value={value} id={`bulk-mode-${value}`} />
                <Label
                  htmlFor={`bulk-mode-${value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {t(`mode.${value}`)}
                </Label>
              </div>
            ))}
          </RadioGroup>

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
            <Button
              variant="outline"
              onClick={() => setConsoleDialogOpen(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={runConsoles}
              // `set` avec une liste vide est une action réelle — tout retirer.
              disabled={loading || (mode !== "set" && selection.length === 0)}
              className="gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("processing") : t("apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
