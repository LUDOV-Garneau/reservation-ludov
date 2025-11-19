"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface SmartPaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  ariaLabel?: string;
}

export default function PaginationControls({
  page,
  totalItems,
  pageSize,
  onPageChange,
  siblingCount = 1,
  className,
  ariaLabel = "Pagination",
}: SmartPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const range = useMemo(() => buildRange(page, totalPages, siblingCount), [page, totalPages, siblingCount]);

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const t = useTranslations();

  return (
    <div className={cn("flex flex-col gap-3 sm:gap-4 pt-4 border-t", className)}>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-xs sm:text-sm text-muted-foreground">
          {totalItems > 0 ? (
            <>
              <span className="hidden sm:inline">
                {t("admin.reservations.pagination.affichageDe")} <span className="font-medium text-foreground">{startItem}</span> {t("admin.reservations.pagination.a")}{" "}
                <span className="font-medium text-foreground">{endItem}</span> {t("admin.reservations.pagination.sur")}{" "}
                <span className="font-medium text-foreground">{totalItems}</span>
              </span>
              <span className="sm:hidden">
                {startItem}-{endItem} {t("admin.reservations.pagination.sur")} {totalItems}
              </span>
            </>
          ) : (
            <span>{t("admin.reservations.pagination.noItem")}</span>
          )}
        </div>
      </div>

      <nav className="flex items-center justify-between gap-2" aria-label={ariaLabel}>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={isFirst}
            className="h-8"
            aria-label="Première page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={isFirst}
            className="h-8"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {range.map((item, idx) =>
            item === "…" ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={page === item ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0",
                  page === item
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md"
                    : "hover:bg-gray-100"
                )}
                aria-current={page === item ? "page" : undefined}
                aria-label={`Aller à la page ${item}`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            )
          )}
        </div>

        <div className="sm:hidden px-4 py-1 bg-[white] border-cyan-500 border rounded-xl text-sm font-medium" aria-live="polite">
          {page}/{totalPages}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={isLast}
            className="h-8"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={isLast}
            className="h-8"
            aria-label="Dernière page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </div>
  );
}

function buildRange(current: number, totalPages: number, siblingCount: number) {
  const range: Array<number | "…"> = [];
  const first = 1;
  const last = totalPages;
  const start = Math.max(first + 1, current - siblingCount);
  const end = Math.min(last - 1, current + siblingCount);

  range.push(first);
  if (start > first + 1) range.push("…");

  for (let i = start; i <= end; i++) {
    if (i >= first && i <= last) range.push(i);
  }

  if (end < last - 1) range.push("…");
  if (last !== first) range.push(last);

  if (!range.includes(current)) {
    const insertIdx = range.length > 1 ? 1 : 0;
    range.splice(insertIdx, 0, current as number);
  }

  return range as (number | "…")[];
}
