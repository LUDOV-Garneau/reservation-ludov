"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReservationStatus } from "@/lib/reservationsQuery";

/**
 * Les trois statuts, en paires teinte-claire / teinte-sombre : le fond plein
 * `bg-red-500` d'avant restait lisible en clair mais écrasait le contraste en
 * thème sombre, où la carte n'est plus blanche.
 */
const STYLES: Record<ReservationStatus, string> = {
  upcoming:
    "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
  past: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200",
};

const ICONS = {
  upcoming: Clock,
  past: CheckCircle,
  cancelled: XCircle,
} as const;

/**
 * Le statut vient de l'API, qui le classe avec la même frontière que le
 * filtre : le recalculer ici suivrait le fuseau du navigateur de l'admin.
 */
export default function ReservationStatusBadge({
  status,
  showLabelOnMobile = false,
}: {
  status: ReservationStatus;
  showLabelOnMobile?: boolean;
}) {
  const t = useTranslations("admin.reservations.status");
  const Icon = ICONS[status];

  return (
    <Badge variant="outline" className={`rounded-full ${STYLES[status]}`}>
      <Icon className="h-3 w-3" />
      <span className={showLabelOnMobile ? undefined : "hidden sm:inline"}>
        {t(status)}
      </span>
    </Badge>
  );
}
