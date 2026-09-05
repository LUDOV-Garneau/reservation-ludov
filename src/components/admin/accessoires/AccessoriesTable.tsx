"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ChevronsUpDown, Monitor, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  AccessoriesSort,
  SortDirection,
} from "@/hooks/useAccessoriesFilters";
import type { AccessoryRow } from "@/components/admin/accessoires/types";

type Props = {
  accessories: AccessoryRow[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
  sort: AccessoriesSort;
  dir: SortDirection;
  onSort: (sort: AccessoriesSort) => void;
  togglingId: number | null;
  onToggleHidden: (accessory: AccessoryRow) => void;
  onOpen: (accessory: AccessoryRow) => void;
};

function SortableHead({
  column,
  label,
  sort,
  dir,
  onSort,
  className,
}: {
  column: AccessoriesSort;
  label: string;
  sort: AccessoriesSort;
  dir: SortDirection;
  onSort: (sort: AccessoriesSort) => void;
  className?: string;
}) {
  const active = sort === column;
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

/**
 * Vue en tableau : lecture dense, c'est la vue par défaut parce qu'un
 * accessoire se lit par son nom et son ID Koha, pas par une image.
 *
 * La ligne entière ouvre le détail à la souris ; la case à cocher et
 * l'interrupteur arrêtent la propagation pour rester utilisables sans ouvrir
 * le dialogue à chaque clic.
 */
export default function AccessoriesTable({
  accessories,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  sort,
  dir,
  onSort,
  togglingId,
  onToggleHidden,
  onOpen,
}: Props) {
  const t = useTranslations("admin.accessories");
  const selected = new Set(selectedIds);
  const allSelected =
    accessories.length > 0 &&
    accessories.every((accessory) => selected.has(accessory.id));
  const someSelected =
    !allSelected && accessories.some((accessory) => selected.has(accessory.id));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected || (someSelected && "indeterminate")}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label={t("bulk.selectAll")}
              />
            </TableHead>
            <SortableHead
              column="name"
              label={t("table.name")}
              sort={sort}
              dir={dir}
              onSort={onSort}
            />
            <SortableHead
              column="koha"
              label={t("table.kohaId")}
              sort={sort}
              dir={dir}
              onSort={onSort}
              className="hidden md:table-cell"
            />
            <SortableHead
              column="consoles"
              label={t("table.consoles")}
              sort={sort}
              dir={dir}
              onSort={onSort}
            />
            <SortableHead
              column="visibility"
              label={t("table.visible")}
              sort={sort}
              dir={dir}
              onSort={onSort}
              className="text-center"
            />
            <TableHead className="text-end">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accessories.map((accessory) => (
            <TableRow
              key={accessory.id}
              onClick={() => onOpen(accessory)}
              data-state={selected.has(accessory.id) ? "selected" : undefined}
              className="cursor-pointer"
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(accessory.id)}
                  onCheckedChange={() => onToggleSelect(accessory.id)}
                  aria-label={t("bulk.selectOne", { name: accessory.name })}
                />
              </TableCell>

              <TableCell className="font-medium">{accessory.name}</TableCell>

              <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                {accessory.kohaId}
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {accessory.consoles.length === 0 ? (
                    <span className="text-sm text-amber-600 dark:text-amber-400">
                      {t("noConsole")}
                    </span>
                  ) : (
                    accessory.consoles.map((console) => (
                      <Badge
                        key={console.id}
                        variant="outline"
                        className="gap-1"
                      >
                        <Monitor className="h-3 w-3 text-cyan-500" />
                        {console.name}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>

              <TableCell
                className="text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={!accessory.hidden}
                  disabled={togglingId === accessory.id}
                  onCheckedChange={() => onToggleHidden(accessory)}
                  aria-label={t("toggleVisibility", { name: accessory.name })}
                />
              </TableCell>

              <TableCell className="text-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(accessory);
                  }}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  {t("editConsoles")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
