import { cn } from "@/lib/utils";

/**
 * Palette fixe : la couleur est dérivée de l'id, donc stable d'un chargement
 * à l'autre. Chaque paire garde un contraste suffisant en clair comme en
 * sombre.
 */
const PALETTE = [
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
];

function initials(firstname: string, lastname: string) {
  const first = firstname?.trim()?.[0] ?? "";
  const last = lastname?.trim()?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

export default function UserAvatar({
  id,
  firstname,
  lastname,
  className,
}: {
  id: number;
  firstname: string;
  lastname: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        PALETTE[Math.abs(id) % PALETTE.length],
        className,
      )}
    >
      {initials(firstname, lastname)}
    </div>
  );
}
