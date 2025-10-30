"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, XCircle, AlertTriangle, Shield } from "lucide-react";

interface CancelReservationAlertDialogProps {
  reservationId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function CancelReservationAlertDialog({
  reservationId,
  onSuccess,
  onError,
}: CancelReservationAlertDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch(
        `/api/reservation/details?id=${encodeURIComponent(reservationId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Échec de l'annulation");
      }

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      onError?.(error instanceof Error ? error : new Error("Erreur inconnue"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-red-500/30"
        >
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
            {t("reservation.details.cancelButton")}
          </span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-md rounded-2xl border-2 bg-white shadow-2xl">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <div className="rounded-full bg-red-500 p-3 shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>

          <AlertDialogTitle className="text-center text-2xl font-bold text-gray-900">
            {t("reservation.details.cancelConfirmationTitle")}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center text-base text-gray-600 leading-relaxed">
            {t("reservation.details.cancelConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-red-900">
                {t("reservation.details.cancelWarningTitle")}
              </p>
              <p className="text-sm text-red-700 leading-relaxed">
                {t("reservation.details.cancelWarning")}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="w-full sm:flex-1 rounded-xl border-2 hover:bg-gray-50 transition-colors"
            >
              {t("reservation.details.returnButton")}
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className="w-full sm:flex-1 rounded-xl bg-red-500 hover:bg-red-900 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("reservation.details.canceling")}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("reservation.details.cancelConfirmButton")}
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
