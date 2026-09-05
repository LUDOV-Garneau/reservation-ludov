"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Squelette de la liste : même hauteur de ligne que la table. */
export default function StationsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4 sm:p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="hidden h-6 w-40 md:block" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
