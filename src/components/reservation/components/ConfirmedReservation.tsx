"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface ConfirmedReservationProps {
  reservationId: string;
  date: string;
  heure: string;
}

export default function ConfirmedReservation({
  reservationId,
  date,
  heure,
}: ConfirmedReservationProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto sm:p-6 mt-20">
      <div className="bg-[white] rounded-2xl shadow-lg px-10 py-10 text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>

        <h2 className="text-4xl font-bold mb-4">
          {t("reservation.confirmation.title")}
        </h2>

        <p className="text-gray-600 mb-6 text-lg">
          {t("reservation.confirmation.subtitle")}
        </p>

        <div className="p-6 bg-cyan-50 border border-cyan-200 rounded-xl mb-8 text-left inline-block">
          <p className="text-sm font-medium text-cyan-900 mb-2">
            {t("reservation.confirmation.detailsTitle")}
          </p>

          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-cyan-700" />
            <span className="text-cyan-800 font-medium">
              {date
                ? String(date).split("T")[0]
                : "—"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-cyan-700" />
            <span className="text-cyan-800 font-medium">{heure ?? "—"}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Button
            variant="outline"
            className="px-6 py-3"
            onClick={() => (window.location.href = "/")}
          >
            {t("reservation.confirmation.goHome")}
          </Button>

          <Button
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
            onClick={() => router.push(`/reservation/details/${reservationId}`)}
          >
            {t("reservation.confirmation.detailsBtn")}
          </Button>
        </div>

        {reservationId && (
          <p className="mt-6 text-xs text-gray-400">
            {t("reservation.confirmation.reservationId")} {reservationId}
          </p>
        )}
      </div>
    </div>
  );
}
