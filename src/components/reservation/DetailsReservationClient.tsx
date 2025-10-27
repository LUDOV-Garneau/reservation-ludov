"use client";

import { notFound } from "next/navigation";
import DetailsReservation from "@/components/reservation/DetailsReservation";
import { Calendar, Clock9 } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Reservation = {
  id: number;
  station: string;
  date: string;
  heure: string;
  console: { nom: string };
  jeux: { nom: string; picture: string; biblio: number }[];
  accessoires?: { nom: string }[];
};

export default function DetailsReservationClient({ id }: { id: string }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    const getReservation = async () => {
      try {
        const response = await fetch(
          `/api/reservation/details?id=${encodeURIComponent(id)}`
        );
        if (!response.ok) {
          setIsLoading(false);
          notFound();
        } else {
          const data = await response.json();
          setReservation(data);
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
        notFound();
      }
    };
    if (id) {
      getReservation();
    } else {
      notFound();
    }
  }, [id]);

  return (
    <div>
      {!isLoading && reservation != null ? (
        <DetailsReservation
          reservationId={reservation.id.toString()}
          jeux={reservation.jeux}
          console={reservation.console}
          accessoires={reservation.accessoires ?? []}
          station={reservation.station}
          date={reservation.date}
          heure={reservation.heure}
        />
      ) : (
        <div>
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Skeleton className="h-14 w-60 mb-2" />
            <div className="w-full sm:w-auto flex flex-col items-center gap-5 sm:flex-row sm:items-center rounded-md border bg-white p-3 shadow-sm">
              <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap sm:mr-8">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-300" />
                  <Skeleton className="h-4 w-16" />
                </span>
                <span className="text-gray-400">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock9 className="h-4 w-4 text-gray-300" />
                  <Skeleton className="h-4 w-12" />
                </span>
              </span>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 w-full sm:w-auto">
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-9 w-36" />
              </div>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32 hidden md:block" />
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="flex flex-col gap-4">
              {[1, 2].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <div>
              <Skeleton className="h-20 w-full md:w-80 rounded-lg" />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-6 w-14" />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-6 w-80 max-w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
