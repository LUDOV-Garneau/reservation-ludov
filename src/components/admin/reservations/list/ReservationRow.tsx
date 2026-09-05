"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Calendar, Clock } from "lucide-react";
import ReservationActions from "./ReservationActions";
import ReservationStatusBadge from "./ReservationStatusBadge";
import type { Reservation } from "./hooks/useReservations";
import type { AlertType } from "@/hooks/useAlert";

/** Liste compacte (jeux, accessoires) : une entrée par ligne, tronquée. */
function ItemList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <ul className="max-w-[220px] space-y-0.5 text-sm">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="truncate" title={item}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ReservationRow({
  reservation,
  onAlert,
  onSuccess,
}: {
  reservation: Reservation;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
}) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <span className="block max-w-[220px] truncate">
          {reservation.userNom || "—"}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{reservation.date}</span>
        </div>
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{reservation.heure}</span>
        </div>
      </TableCell>

      <TableCell className="hidden xl:table-cell">
        <span className="block max-w-[140px] truncate text-sm">
          {reservation.station || "—"}
        </span>
      </TableCell>

      <TableCell>
        <span className="block max-w-[160px] truncate">
          {reservation.console}
        </span>
      </TableCell>

      <TableCell className="hidden xl:table-cell">
        <ItemList items={reservation.games} />
      </TableCell>

      <TableCell className="hidden 2xl:table-cell">
        <ItemList items={reservation.accessories} />
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        {reservation.coursCode ? (
          <span
            className="font-mono text-sm"
            title={reservation.coursName || undefined}
          >
            {reservation.coursCode}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell className="text-center">
        <ReservationStatusBadge
          date={reservation.date}
          heure={reservation.heure}
          archived={reservation.archived}
          showLabelOnMobile
        />
      </TableCell>

      <TableCell className="text-end">
        <ReservationActions
          reservation={reservation}
          onAlert={onAlert}
          onSuccess={onSuccess}
          variant="buttons"
        />
      </TableCell>
    </TableRow>
  );
}
