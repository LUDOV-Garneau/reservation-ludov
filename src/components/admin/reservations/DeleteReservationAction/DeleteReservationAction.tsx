"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Loader2,
  Trash2,
  XCircle,
  CircleQuestionMark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDeleteReservationAction,
  type AlertType,
  type TargetReservation,
} from "./hooks/useDeleteReservationAction";

interface DeleteReservationActionProps {
  targetReservation: TargetReservation;
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
  const {
    open,
    loading,
    reason,
    reasonError,
    emailOrPlaceholder,
    handleOpen,
    handleClose,
    handleOpenChange,
    handleReasonChange,
    handleConfirm,
  } = useDeleteReservationAction({ targetReservation, onAlert, onSuccess });

  return (
    <>
      {children({ open: handleOpen, loading })}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
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

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CircleQuestionMark className="h-4 w-4 text-red-600 shrink-0" />
                Que va-t-il se passer ?
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
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
                    Les jeux, la plateforme et les accessoires réservés seront
                    libérés et disponibles pour d&#39;autres utilisateurs
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  <span>Cette action ne peut pas être annulée</span>
                </li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label
                htmlFor="cancellation-reason"
                className="text-sm font-medium text-gray-900"
              >
                Raison d&apos;annulation{" "}
                <span className="text-red-600" aria-hidden>
                  *
                </span>
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Décrivez la raison de l'annulation..."
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                disabled={loading}
                aria-invalid={reasonError}
                className={cn(
                  "resize-none min-h-[80px]",
                  reasonError &&
                    "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
                )}
              />
              {reasonError && (
                <p className="text-xs text-red-600">
                  Ce champ est obligatoire.
                </p>
              )}
            </div>

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
                  "text-white shadow-md hover:shadow-lg transition-all",
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
