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
import ReservationRow from "./ReservationRow";
import ReservationCard from "./ReservationCard";
import type { Reservation } from "./hooks/useReservations";
import type { AlertType } from "./hooks/useAlert";
import type {
  ReservationsSort,
  SortDirection,
} from "@/lib/reservationsQuery";

type SortState = { sort: ReservationsSort; dir: SortDirection };

function SortableHead({
  label,
  sortKey,
  state,
  onToggle,
  className,
  align = "start",
}: {
  label: string;
  sortKey: ReservationsSort;
  state: SortState;
  onToggle: (sort: ReservationsSort) => void;
  className?: string;
  align?: "start" | "center";
}) {
  const active = state.sort === sortKey;
  const Icon = !active ? ChevronsUpDown : state.dir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        // `aria-sort` vit sur la cellule d'en-tête ; il est porté par le
        // TableHead via le bouton pour rester lisible aux lecteurs d'écran.
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          align === "center" && "justify-center",
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
 * Ordre demandé par le LUDOV : usager, date, heure, station, plateforme, jeux,
 * accessoires, sigle, statut, actions. Les colonnes secondaires se replient sur
 * les écrans étroits ; sous `md` la table cède la place aux cartes, qui gardent
 * l'usager et la date visibles.
 */
export default function ReservationsTable({
  reservations,
  sortState,
  onToggleSort,
  onAlert,
  onCancelSuccess,
}: {
  reservations: Reservation[];
  sortState: SortState;
  onToggleSort: (sort: ReservationsSort) => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onCancelSuccess: (id: string) => void;
}) {
  const t = useTranslations("admin.reservations.table.header");

  return (
    <>
      <div className="hidden px-6 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                label={t("user")}
                sortKey="user"
                state={sortState}
                onToggle={onToggleSort}
              />
              <SortableHead
                label={t("date")}
                sortKey="schedule"
                state={sortState}
                onToggle={onToggleSort}
              />
              <TableHead className="hidden lg:table-cell">
                {t("time")}
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                {t("station")}
              </TableHead>
              <SortableHead
                label={t("console")}
                sortKey="console"
                state={sortState}
                onToggle={onToggleSort}
              />
              <TableHead className="hidden xl:table-cell">
                {t("games")}
              </TableHead>
              <TableHead className="hidden 2xl:table-cell">
                {t("accessories")}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t("course")}
              </TableHead>
              <SortableHead
                label={t("status")}
                sortKey="status"
                state={sortState}
                onToggle={onToggleSort}
                className="text-center"
                align="center"
              />
              <TableHead className="text-end">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <ReservationRow
                key={reservation.id}
                reservation={reservation}
                onAlert={onAlert}
                onSuccess={() => onCancelSuccess(reservation.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 px-4 md:hidden">
        {reservations.map((reservation) => (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            onAlert={onAlert}
            onSuccess={() => onCancelSuccess(reservation.id)}
          />
        ))}
      </div>
    </>
  );
}
