"use client";

import { notFound } from "next/navigation";
import DetailsReservation from "./DetailsReservation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";

type Reservation = {
  id: number;
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  station: number;
  date: string;
  heure: string;
  console: { nom: string; picture?: string };
  jeux: { nom: string; picture: string; biblio: number }[];
  accessoires?: { id: number; nom: string }[];
  archived: boolean;
};

type ReservationState = {
  data: Reservation | null;
  isLoading: boolean;
  error: boolean;
};

function HeaderSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <Skeleton className="h-10 w-64 mb-3" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-300" />
              <Skeleton className="h-4 w-24" />
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-300" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </div>
  );
}

function GameCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="h-48 w-full sm:h-56 sm:w-56" />
        <div className="p-6 flex flex-col justify-between flex-1 gap-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
}

function SectionHeaderSkeleton({ width = "w-40" }: { width?: string }) {
  return <Skeleton className={`h-8 ${width} mb-6`} />;
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mb-6">
        <Skeleton className="h-5 w-48" />
      </div>

      <HeaderSkeleton />

      <main className="space-y-8">
        <section>
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GameCardSkeleton />
            <GameCardSkeleton />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SectionHeaderSkeleton width="w-48" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
          <div>
            <SectionHeaderSkeleton width="w-56" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        </section>
      </main>
    </div>
  );
}

function useReservation(id: string) {
  const [state, setState] = useState<ReservationState>({
    data: null,
    isLoading: true,
    error: false,
  });

  useEffect(() => {
    if (!id) {
      notFound();
      return;
    }

    const fetchReservation = async () => {
      try {
        const response = await fetch(
          `/api/admin/details-reservation?id=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          setState({ data: null, isLoading: false, error: true });
          notFound();
          return;
        }

        const data = await response.json();
        console.log("Reservation fetched:", data);
        setState({ data, isLoading: false, error: false });
      } catch (error) {
        console.error("Error fetching reservation:", error);
        setState({ data: null, isLoading: false, error: true });
        notFound();
      }
    };

    fetchReservation();
  }, [id]);

  return state;
}

export default function DetailsReservationClient({ id }: { id: string }) {
  const { data: reservation, isLoading } = useReservation(id);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg h-full">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <DetailsReservation
      reservationId={reservation.id.toString()}
      user_id={reservation.user_id}
      firstname={reservation.firstname}
      lastname={reservation.lastname}
      email={reservation.email}
      jeux={reservation.jeux}
      console={{ ...reservation.console, picture: reservation.console.picture ?? "" }}
      archived={reservation.archived}
      accessoires={reservation.accessoires ?? []}
      station={reservation.station}
      date={reservation.date}
      heure={reservation.heure}
    />
  );
}