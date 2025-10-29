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
          size="sm"
          className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-red-500/30"
        >
          <span className="flex items-center gap-2">
            <XCircle className="h-4 w-4 transition-transform group-hover:rotate-90" />
            {t("reservation.details.cancelButton")}
          </span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-2xl border-2 bg-white shadow-2xl">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <div className="rounded-full bg-red-400 p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
          </div>

          <AlertDialogTitle className="text-center text-xl font-bold">
            {t("reservation.details.cancelConfirmationTitle")}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center text-base text-gray-600">
            {t("reservation.details.cancelConfirmation")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Action irréversible</p>
              <p className="text-red-700">
                Cette action ne peut pas être annulée. Vous devrez créer une
                nouvelle réservation si vous changez d'avis.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="w-full sm:w-auto rounded-xl border-2"
            >
              {t("reservation.details.returnButton")}
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirm}
              className="w-full sm:w-auto rounded-xl bg-red-500 hover:bg-black"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Annulation...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmer l'annulation
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}