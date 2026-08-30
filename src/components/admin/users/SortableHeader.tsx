"use client";

import { TableHead } from "@/components/ui/table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SortKey, SortOrder } from "@/hooks/useAdminUsersFilters";

export default function SortableHeader({
  sortKey,
  label,
  activeSort,
  order,
  onSort,
  className,
}: {
  sortKey: SortKey;
  label: string;
  activeSort: SortKey;
  order: SortOrder;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const t = useTranslations("admin.users.table");
  const isActive = activeSort === sortKey;
  const Icon = !isActive ? ChevronsUpDown : order === "asc" ? ChevronUp : ChevronDown;

  return (
    <TableHead className={className} aria-sort={isActive ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-mx-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon
          className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-40")}
          aria-hidden
        />
        {isActive && (
          <span className="sr-only">
            {order === "asc" ? t("sortedAsc") : t("sortedDesc")}
          </span>
        )}
      </button>
    </TableHead>
  );
}
