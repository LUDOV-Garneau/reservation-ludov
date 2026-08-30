"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  CheckCircle2,
  CircleX,
  Clock,
  Gamepad2,
  Monitor,
  Puzzle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReservationStatus, UserReservation } from "./useUserDetail";

function StatusBadge({ status }: { status: ReservationStatus | null }) {
  const t = useTranslations("admin.users.detail.status");
  if (!status) return null;

  const config = {
    upcoming: { icon: Clock, className: "border-cyan-500 text-cyan-700 dark:text-cyan-400" },
    ongoing: { icon: Clock, className: "border-amber-500 text-amber-700 dark:text-amber-400" },
    completed: {
      icon: CheckCircle2,
      className: "border-emerald-500 text-emerald-700 dark:text-emerald-400",
    },
    canceled: { icon: CircleX, className: "border-destructive text-destructive" },
  }[status];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`rounded-full ${config.className}`}>
      <Icon className="h-3 w-3" />
      {t(status)}
    </Badge>
  );
}

function TagRow({
  icon: Icon,
  label,
  values,
}: {
  icon: typeof Monitor;
  label: string;
  values: string[];
}) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="reservationDetails" className="text-xs">
          {value}
        </Badge>
      ))}
    </div>
  );
}

export default function UserReservationCard({
  reservation,
}: {
  reservation: UserReservation;
}) {
  const t = useTranslations("admin.users.detail");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-CA" : "fr-CA";

  const timeFormat = { hour: "2-digit", minute: "2-digit" } as const;
  // `start` est nul quand la date ou l'heure sont inexploitables : on l'affiche
  // comme tel plutôt que de laisser « Invalid Date » à l'écran.
  const slot = reservation.start
    ? `${reservation.start.toLocaleDateString(dateLocale)} · ${reservation.start.toLocaleTimeString(
        dateLocale,
        timeFormat,
      )}${
        reservation.end
          ? ` – ${reservation.end.toLocaleTimeString(dateLocale, timeFormat)}`
          : ""
      }`
    : t("unknownSlot");

  return (
    <Link href={`/admin/reservation/details/${reservation.id}`} className="block">
      <Card className="py-0 transition-colors hover:border-cyan-500">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-sm font-medium text-cyan-600">
              {reservation.id}
            </span>
            <StatusBadge status={reservation.status} />
          </div>

          <p className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            {slot}
          </p>

          <div className="space-y-2 border-t pt-3">
            <TagRow icon={Monitor} label={t("console")} values={[reservation.console]} />
            <TagRow icon={Gamepad2} label={t("games")} values={reservation.games} />
            <TagRow
              icon={Puzzle}
              label={t("accessories")}
              values={reservation.accessories ?? []}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
