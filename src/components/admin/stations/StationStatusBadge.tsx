"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Actif / inactif, en paires teinte-claire / teinte-sombre. Les fonds pleins
 * `bg-green-500` / `bg-destructive` d'avant écrasaient le contraste en thème
 * sombre, où la carte n'est plus blanche.
 */
export default function StationStatusBadge({
  isActive,
}: {
  isActive: boolean;
}) {
  const t = useTranslations("admin.stations.table");

  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? "rounded-full border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          : "rounded-full border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      }
    >
      {isActive ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isActive ? t("active") : t("inactive")}
    </Badge>
  );
}
