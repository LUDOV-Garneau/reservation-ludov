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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelReservationAlertDialog({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/reservation/details?id=${encodeURIComponent(String(reservationId))}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Delete failed");
        return;
      }
      router.push("/fr/"); 
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          className="h-auto py-1 px-3 w-full md:w-auto whitespace-nowrap text-sm"
        >
          Annuler
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="rounded-xl border bg-white p-6 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Confirmer l’annulation
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm text-gray-600">
            Cette action est irréversible. Voulez-vous annuler cette réservation?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={submitting}>Retour</Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={handleConfirm}
            >
              {submitting ? "Annulation..." : "Confirmer"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}