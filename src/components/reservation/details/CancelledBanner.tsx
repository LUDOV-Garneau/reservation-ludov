"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  reason?: string | null;
};

/**
 * Bandeau affiché sur les pages de détails (client et admin) lorsqu'une
 * réservation est annulée, avec la raison d'annulation si disponible.
 */
export default function CancelledBanner({ reason }: Props) {
  const t = useTranslations("reservation.details");

  return (
    <Alert
      variant="destructive"
      className="mb-6 border-2 border-red-300 bg-red-50"
      role="status"
      aria-live="polite"
    >
      <XCircle className="h-5 w-5" />
      <AlertTitle className="font-bold">{t("cancelledTitle")}</AlertTitle>
      <AlertDescription>
        <p>{t("cancelledDescription")}</p>
        {reason && (
          <p className="mt-1 font-medium">
            {t("cancelledReason", { reason })}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
