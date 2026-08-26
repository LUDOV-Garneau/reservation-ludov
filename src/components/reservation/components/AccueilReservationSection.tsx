"use client";

import React from "react";
import AccueilReservationCard from "./AccueilReservationCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

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
  /** Replie la section derrière son titre (historique). */
  collapsible?: boolean;
  /** Hauteur minimale de la zone de contenu (réservations à venir). */
  contentClassName?: string;
}

export default function AccueilReservationSection({
  title,
  emptyMessage,
  reservations,
  showAddButton = false,
  onDetailsClick,
  icon,
  collapsible = false,
  contentClassName = "",
}: AccueilReservationSectionProps) {
  const t = useTranslations();

  const header = (
    <div className="flex items-center gap-3">
      {icon && icon}
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
  );

  const content =
    reservations.length === 0 ? (
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
          />
        ))}
      </div>
    );

  // Section repliable : l'en-tête devient le bouton d'ouverture.
  if (collapsible) {
    return (
      <Collapsible className="w-full group/collapsible">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left cursor-pointer">
          {header}
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className={`mt-6 ${contentClassName}`}>
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
        {header}

        {showAddButton && (
          <Link href="/reservation">
            <Button className="bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">
              {t("reservation.new")}
            </Button>
          </Link>
        )}
      </div>
      <div className={contentClassName}>{content}</div>
    </div>
  );
}
