"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import StationActions from "./StationActions";
import StationPlatforms from "./StationPlatforms";
import StationStatusBadge from "./StationStatusBadge";
import { formatStationDate } from "./formatStationDate";
import type { Station } from "@/components/admin/stations/types";

export default function StationRow({
  station,
  locale,
  onEdit,
  onDelete,
}: {
  station: Station;
  locale: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{station.name}</TableCell>

      <TableCell>
        <StationPlatforms platforms={station.consoles} />
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatStationDate(station.createdAt, locale)}</span>
        </div>
      </TableCell>

      <TableCell className="text-center">
        <StationStatusBadge isActive={station.isActive} />
      </TableCell>

      <TableCell className="text-end">
        <StationActions onEdit={onEdit} onDelete={onDelete} variant="buttons" />
      </TableCell>
    </TableRow>
  );
}
