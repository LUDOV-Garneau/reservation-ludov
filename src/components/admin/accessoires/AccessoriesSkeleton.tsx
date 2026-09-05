"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { AccessoriesView } from "@/hooks/useAccessoriesFilters";

/** Squelette de la vue en cours, pour que le chargement garde la même forme. */
export default function AccessoriesSkeleton({
  view,
}: {
  view: AccessoriesView;
}) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
