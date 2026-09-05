"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import StationRow from "./StationRow";
import StationCard from "./StationCard";
import type { Station } from "@/components/admin/stations/types";
import type { SortDirection, StationsSort } from "@/lib/stationsQuery";

type SortState = { sort: StationsSort; dir: SortDirection };

function SortableHead({
  label,
  sortKey,
  state,
  onToggle,
  className,
}: {
  label: string;
  sortKey: StationsSort;
  state: SortState;
  onToggle: (sort: StationsSort) => void;
  className?: string;
}) {
  const active = state.sort === sortKey;
  const Icon = !active
    ? ChevronsUpDown
    : state.dir === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        aria-label={label}
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

export default function StationsTable({
  stations,
  locale,
  sortState,
  onToggleSort,
  onEdit,
  onDelete,
}: {
  stations: Station[];
  locale: string;
  sortState: SortState;
  onToggleSort: (sort: StationsSort) => void;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
}) {
  const t = useTranslations("admin.stations.table.header");

  return (
    <>
      <div className="hidden px-6 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label={t("name")}
                sortKey="name"
                state={sortState}
                onToggle={onToggleSort}
              />
              <SortableHead
                label={t("platforms")}
                sortKey="platforms"
                state={sortState}
                onToggle={onToggleSort}
              />
              <SortableHead
                label={t("createdAt")}
                sortKey="created"
                state={sortState}
                onToggle={onToggleSort}
                className="hidden lg:table-cell"
              />
              <SortableHead
                label={t("isActive")}
                sortKey="status"
                state={sortState}
                onToggle={onToggleSort}
                className="text-center"
              />
              <TableHead className="text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((station) => (
              <StationRow
                key={station.id}
                station={station}
                locale={locale}
                onEdit={() => onEdit(station)}
                onDelete={() => onDelete(station)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 px-4 md:hidden">
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            locale={locale}
            onEdit={() => onEdit(station)}
            onDelete={() => onDelete(station)}
          />
        ))}
      </div>
    </>
  );
}
