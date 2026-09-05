"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import StationActions from "./StationActions";
import StationPlatforms from "./StationPlatforms";
import StationStatusBadge from "./StationStatusBadge";
import { formatStationDate } from "./formatStationDate";
import type { Station } from "@/components/admin/stations/types";

/**
 * Rendu mobile de la liste : la table masquait la date sous `md` et n'a jamais
 * affiché les plateformes. La carte garde les deux.
 */
export default function StationCard({
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
    <Card className="py-0">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{station.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatStationDate(station.createdAt, locale)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StationStatusBadge isActive={station.isActive} />
            <StationActions
              onEdit={onEdit}
              onDelete={onDelete}
              variant="menu"
            />
          </div>
        </div>

        <StationPlatforms platforms={station.consoles} />
      </CardContent>
    </Card>
  );
}
