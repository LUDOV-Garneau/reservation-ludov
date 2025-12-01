"use client";

import { ReactNode, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  User, 
  Loader2, 
  ShieldAlert, 
  Trash2,
  XCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

type AlertType = "success" | "error" | "info" | "warning";

interface DeleteReservationActionProps {
  targetReservation: {
    id: string;
    userEmail: string | null;
    date: string;
    heure: string;
  };
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
  children: (props: { open: () => void; loading: boolean }) => ReactNode;
}

export default function DeleteReservationAction({
  targetReservation,
  onAlert,
  onSuccess,
  children,
}: DeleteReservationActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      setOpen(false);
    }
  }, [loading]);

  const handleConfirm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/delete-reservation?id=${encodeURIComponent(targetReservation.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message =
          (data && (data as { error?: string }).error) ||
          "Erreur lors de la suppression de la réservation";

        throw new Error(message);
      }

      onAlert(
        "success",
        "La réservation a été supprimée avec succès",
        "Réservation supprimée"
      );
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error("Error deleting reservation:", error);
      onAlert(
        "error",
        error instanceof Error ? error.message : "Erreur lors de la suppression de la réservation",
        "Erreur"
      );
    } finally {
      setLoading(false);
    }
  }, [targetReservation.id, onAlert, onSuccess, loading]);

  const emailOrPlaceholder =
    targetReservation.userEmail || "Utilisateur inconnu";

  return (
    <>
      {children({ open: handleOpen, loading })}

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
          {/* Header */}
          <div className="border-b px-6 py-4 bg-red-50">
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg text-red-900">
                Annuler la réservation
              </DialogTitle>
              <DialogDescription className="text-sm text-red-700 mt-1">
                Cette action est définitive et ne peut pas être annulée.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleConfirm} className="px-6 pb-5 pt-5 space-y-5">
            {/* Reservation Info Card */}
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600 shrink-0" />
                <span className="truncate">{emailOrPlaceholder}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{targetReservation.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{targetReservation.heure}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Warning Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                Que va-t-il se passer ?
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  <span>
                    La réservation sera{" "}
                    <strong className="text-gray-900">
                      annulée définitivement
                    </strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  <span>
                    Les jeux, la plateforme et les accessoires réservés seront libérés et disponibles pour d&#39;autres utilisateurs
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  <span>
                    Cette action ne peut pas être annulée
                  </span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto hover:bg-gray-50"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className={cn(
                  "w-full sm:w-auto",
                  "bg-red-600 hover:bg-red-700",
                  "text-white shadow-md hover:shadow-lg transition-all"
                )}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression en cours...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Confirmer l&#39;annulation
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}