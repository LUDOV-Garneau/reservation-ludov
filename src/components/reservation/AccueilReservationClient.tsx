"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AccueilReservationSection from "@/components/reservation/components/AccueilReservationSection";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Reservation {
  id: string;
  archived: boolean;
  games: string[];
  station: string;
  console: string;
  date: string;
  heure: string;
}

interface AccueilReservationsClientProps {
  username: string;
}

export default function AccueilReservationsClient({
  username,
}: AccueilReservationsClientProps) {
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
    <div className="min-h-screen p-3">
      <div className="max-w-7xl mx-auto">
        <Header username={username} />

        <ReservationsList
          title={t("reservation.accueil.upcomingReservations")}
          reservations={upcomingReservations}
          emptyMessage={t("reservation.accueil.noUpcomingReservations")}
          onDetailsClick={handleDetailsClick}
        />

        <ReservationsList
          title={t("reservation.accueil.pastReservations")}
          reservations={pastReservations}
          emptyMessage={t("reservation.accueil.noPastReservations")}
          onDetailsClick={handleDetailsClick}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  const t = useTranslations();
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
        <p className="text-lg">
          {t("reservation.accueil.loadingReservations")}
        </p>
      </div>
    </div>
  );
}

function Header({ username }: { username: string }) {
  const t = useTranslations();
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
      <h1 className="text-4xl">
        {t("reservation.accueil.greeting")}, {username}
      </h1>
      <Link href="/reservation">
        <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 transition-colors">
          {t("reservation.new")}
        </Button>
      </Link>
    </div>
  );
}

interface ReservationsListProps {
  title: string;
  reservations: Reservation[];
  emptyMessage: string;
  onDetailsClick: (reservation: Reservation) => void;
}

function ReservationsList({
  title,
  reservations,
  emptyMessage,
  onDetailsClick,
}: ReservationsListProps) {
  if (reservations.length > 0) {
    return (
      <AccueilReservationSection
        title={title}
        reservations={reservations}
        onDetailsClick={onDetailsClick}
      />
    );
  }

  return (
    <div className="w-full rounded-lg shadow-sm p-6 mb-6 text-center bg-white">
      <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-300 pb-4">
        {title}
      </h2>
      <p className="text-gray-500">{emptyMessage}</p>
    </div>
  );
}
