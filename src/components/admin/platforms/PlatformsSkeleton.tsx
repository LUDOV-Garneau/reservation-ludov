"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { PlatformsView } from "@/hooks/usePlatformsFilters";

/** Squelette de la vue en cours, pour que le chargement garde la même forme. */
export default function PlatformsSkeleton({ view }: { view: PlatformsView }) {
  if (view === "table") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-72 w-full rounded-lg" />
      ))}
    </div>
  );
}
