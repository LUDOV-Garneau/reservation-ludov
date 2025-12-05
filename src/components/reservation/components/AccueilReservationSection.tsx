import React from "react";
import AccueilReservationCard from "./AccueilReservationCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";

interface Reservation {
  id: string;
  archived: boolean;
  games: string[];
  station: string;
  console: string;
  date: string;
  heure: string;
}

interface AccueilReservationSectionProps {
  title: string;
  emptyMessage: string;
  reservations: Reservation[];
  showAddButton?: boolean;
  onDetailsClick?: (reservation: Reservation) => void;
  icon?: React.ReactNode;
}

export default function AccueilReservationSection({
  title,
  emptyMessage,
  reservations,
  showAddButton = false,
  onDetailsClick,
  icon,
}: AccueilReservationSectionProps) {
  const t = useTranslations();

  return (
    <div className="w-full rounded-lg shadow-sm p-6 mb-6 bg-[white]">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-10">
        <div className="flex items-center gap-3">
          {icon && icon}
          <h2 className="text-2xl font-bold">
            {title}
          </h2>
        </div>

        {showAddButton && (
          <Link href="/reservation">
            <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 transition-colors">
              {t("reservation.new")}
            </Button>
          </Link>
        )}
      </div>
      {reservations.length === 0 ? (
        <p className="text-center">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center md:justify-items-stretch">
          {reservations.map((reservation, index) => (
            <AccueilReservationCard
              key={reservation.id || index}
              archived={reservation.archived}
              games={reservation.games}
              console={reservation.console}
              station={reservation.station}
              date={reservation.date}
              heure={reservation.heure}
              onDetailsClick={() => onDetailsClick?.(reservation)}
            />))}
        </div>
      )}
    </div>
  );
}
