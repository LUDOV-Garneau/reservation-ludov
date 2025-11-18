"use client";

import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmedReservation from "./components/ConfirmedReservation";
import { Skeleton } from "../ui/skeleton";

type Reservation = {
  id: number;
  station: string;
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

function ConfirmedReservationSkeleton() {
  return (
    <div className="max-w-3xl mx-auto sm:p-6 mt-20">
      <div className="bg-[white] rounded-2xl shadow-lg px-10 py-10 text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>

        <Skeleton className="h-10 w-2/3 mx-auto mb-4" />

        <Skeleton className="h-6 w-3/4 mx-auto mb-6" />

        <div className="p-6 bg-cyan-50 border border-cyan-200 rounded-xl mb-8 text-left inline-block w-full max-w-md mx-auto">
          <Skeleton className="h-4 w-40 mb-4" />

          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-40" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-44" />
        </div>

        <Skeleton className="h-4 w-32 mx-auto mt-6" />
      </div>
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
    }

    const fetchReservation = async () => {
      try {
        const response = await fetch(
          `/api/reservation/details?id=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          setState({ data: null, isLoading: false, error: true });
          notFound();
        }

        const data = await response.json();
        setState({ data, isLoading: false, error: false });
      } catch {
        setState({ data: null, isLoading: false, error: true });
        notFound();
      }
    };

    fetchReservation();
  }, [id]);

  return state;
}

export default function ConfirmedReservationClient({
  reservationId,
}: {
  reservationId: string;
}) {
  const { data: reservation, isLoading } = useReservation(reservationId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg h-full">
        <ConfirmedReservationSkeleton />
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <ConfirmedReservation
      reservationId={reservationId}
      date={reservation.date}
      heure={reservation.heure}
    />
  );
}
