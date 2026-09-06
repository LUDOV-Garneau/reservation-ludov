"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RangeErrorCode } from "@/lib/availabilityValidation";

/**
 * Message d'erreur d'une plage horaire, affiché **sous le champ fautif**.
 *
 * Les erreurs vivaient auparavant dans un bloc rouge en bas de page :
 * « mardi : plages qui se chevauchent » s'affichait à plusieurs écrans de
 * distance de mardi.
 */
export default function RangeErrorMessage({
  code,
}: {
  code: RangeErrorCode | undefined;
}) {
  const t = useTranslations("admin.availabilities.errors");

  if (!code) return null;

  const message = {
    invalid_time: t("invalidTime"),
    invalid_range: t("invalidRange"),
    overlap: t("overlap"),
  }[code];

  return (
    <p className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}
