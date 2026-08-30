import { Skeleton } from "@/components/ui/skeleton";

export default function UsersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-4 shrink-0 rounded" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-5 w-24 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-24 shrink-0 rounded-full" />
          <Skeleton className="hidden h-4 w-20 shrink-0 md:block" />
          <Skeleton className="hidden h-4 w-20 shrink-0 lg:block" />
          <Skeleton className="h-8 w-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}
