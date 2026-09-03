"use client";

import React, { useEffect, useState } from "react";
import AccueilReservationSection from "@/components/reservation/components/AccueilReservationSection";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, CalendarX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PageShell } from "@/components/layout/PageShell";

interface Reservation {
  id: string;
  archived: boolean;
  games: string[];
  station: string;
  console: string;
  date: string;
  heure: string;
  cours?: { code: string; name: string } | null;
}

export default function AccueilReservationsClient() {
  const t = useTranslations();
  const router = useRouter();
  const [upcomingReservations, setUpcomingReservations] = useState<
    Reservation[]
  >([]);
  const [pastReservations, setPastReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const [upcomingData, pastData] = await Promise.all([
        fetchReservationData("/api/reservation/upcoming-reservations"),
        fetchReservationData("/api/reservation/past-reservations"),
      ]);

      setUpcomingReservations(upcomingData);
      setPastReservations(pastData);
    } catch (error) {
      toast.error(t("reservation.accueil.errorFetching"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReservationData = async (url: string): Promise<Reservation[]> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching from ${url}`);
    }
    return response.json();
  };

  const handleDetailsClick = (reservation: Reservation) => {
    router.push(`/reservation/details/${reservation.id}`);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    // Même coquille que /admin : une seule carte blanche, les réservations à
    // venir en premier, l'historique repliable sous un séparateur.
    <PageShell className="space-y-6">
      <AccueilReservationSection
        title={t("reservation.accueil.upcomingReservations")}
        reservations={upcomingReservations}
        emptyMessage={t("reservation.accueil.noUpcomingReservations")}
        onDetailsClick={handleDetailsClick}
        contentClassName="min-h-[340px]"
        icon={
          <div className="bg-cyan-50 p-2 rounded-lg">
            <CalendarClock className="text-cyan-600 h-8 w-8" />
          </div>
        }
        showAddButton
      />

      <Separator />

      <AccueilReservationSection
        title={t("reservation.accueil.pastReservations")}
        reservations={pastReservations}
        emptyMessage={t("reservation.accueil.noPastReservations")}
        onDetailsClick={handleDetailsClick}
        collapsible
        icon={
          <div className="bg-cyan-50 p-2 rounded-lg">
            <CalendarX className="text-cyan-600 h-8 w-8" />
          </div>
        }
      />
    </PageShell>
  );
}

function LoadingState() {
  const t = useTranslations();
  return (
    <PageShell className="items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
        <p className="text-lg">
          {t("reservation.accueil.loadingReservations")}
        </p>
      </div>
    </PageShell>
  );
}
