"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Computer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

interface CardUserStatsProps {
  activeStationsCount?: number;
  recentStation?: string;
  mostUsed?: string;
  loading?: boolean;
}

export default function CardStationStats({
  activeStationsCount,
  recentStation,
  mostUsed,
  loading = false,
}: CardUserStatsProps) {
  const isLoading = loading || activeStationsCount === undefined || recentStation === undefined || mostUsed === undefined;
  const t = useTranslations();

  const Stat = ({
    label,
    value,
    accent,
  }: {
    label: string;
    value?: number | string;
    accent: "cyan" | "orange" | "green";
  }) => {
    const colorMap = {
      cyan: { ring: "border-l-cyan-500", dot: "bg-cyan-500", text: "text-cyan-600", tint: "bg-cyan-100" },
      orange: { ring: "border-l-orange-500", dot: "bg-orange-500", text: "text-orange-600", tint: "bg-orange-100" },
      green: { ring: "border-l-green-500", dot: "bg-green-500", text: "text-green-600", tint: "bg-green-100" },
    }[accent];

    return (
      <Card className={`border-l-4 ${colorMap.ring}`}>
        <CardContent className="flex items-center gap-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${colorMap.tint}`}>
            <div className={`rounded-full ${colorMap.dot} p-3 shadow-lg`}>
              <Computer className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p>{label}</p>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
            ) : (
              <div className={`text-2xl sm:text-3xl font-bold ${colorMap.text}`}>{value ?? 0}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Stat label={t("admin.users.stats.totalUsers")} value={activeStationsCount} accent="cyan" />
      <Stat label={t("admin.users.stats.userNotBoarded")} value={recentStation} accent="orange" />
      <Stat label={t("admin.users.stats.userWithReservations")} value={mostUsed} accent="green" />
    </div>
  );
}
