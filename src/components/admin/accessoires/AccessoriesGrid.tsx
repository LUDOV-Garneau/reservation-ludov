"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Monitor, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AccessoryRow } from "@/components/admin/accessoires/types";

type Props = {
  accessories: AccessoryRow[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  togglingId: number | null;
  onToggleHidden: (accessory: AccessoryRow) => void;
  onOpen: (accessory: AccessoryRow) => void;
};

/**
 * Vue en cartes : moins dense que le tableau, mais elle laisse respirer la
 * liste des plateformes compatibles, qui est la seule donnée vraiment variable
 * d'un accessoire à l'autre. Un accessoire masqué est grisé — l'état se voit
 * sans lire l'interrupteur.
 *
 * La carte n'est pas un `<button>` : elle contient déjà une case à cocher et un
 * interrupteur, et imbriquer des contrôles interactifs casse le clavier.
 */
export default function AccessoriesGrid({
  accessories,
  selectedIds,
  onToggleSelect,
  togglingId,
  onToggleHidden,
  onOpen,
}: Props) {
  const t = useTranslations("admin.accessories");
  const selected = new Set(selectedIds);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {accessories.map((accessory) => {
        const isSelected = selected.has(accessory.id);

        return (
          <div
            key={accessory.id}
            className={cn(
              "flex flex-col gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md",
              isSelected && "border-cyan-500 ring-1 ring-cyan-500",
              accessory.hidden && "opacity-70",
            )}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(accessory.id)}
                aria-label={t("bulk.selectOne", { name: accessory.name })}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {accessory.name}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                  {t("card.kohaId", { id: accessory.kohaId })}
                </p>
              </div>
            </div>

            <div className="flex min-h-[3.25rem] flex-wrap content-start gap-1.5">
              {accessory.consoles.length === 0 ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {t("noConsole")}
                </span>
              ) : (
                accessory.consoles.map((console) => (
                  <Badge key={console.id} variant="outline" className="gap-1">
                    <Monitor className="h-3 w-3 text-cyan-500" />
                    {console.name}
                  </Badge>
                ))
              )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={!accessory.hidden}
                  disabled={togglingId === accessory.id}
                  onCheckedChange={() => onToggleHidden(accessory)}
                  aria-label={t("toggleVisibility", { name: accessory.name })}
                />
                <span className="text-xs text-muted-foreground">
                  {accessory.hidden ? t("status.hidden") : t("status.visible")}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpen(accessory)}
                aria-label={t("editFor", { name: accessory.name })}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-cyan-600 transition-colors hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-cyan-400 dark:hover:bg-cyan-950"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("editConsoles")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
