"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RemoveConsolePhotoActionProps {
  /** Nom de la plateforme, affiché dans le récapitulatif. */
  consoleName: string;
  /** Appelé lorsque l'admin confirme le retrait de la photo. */
  onConfirm: () => Promise<void> | void;
  children: (controls: { open: () => void; loading: boolean }) => React.ReactNode;
}

/**
 * Confirmation du retrait de la photo d'une plateforme.
 *
 * Calquée sur les confirmations de suppression de l'admin
 * (DialogConfirmationDeleteCours, DialogConfirmationDeleteStation…) : même
 * structure, mêmes classes, seuls les textes changent.
 */
export default function RemoveConsolePhotoAction({
  consoleName,
  onConfirm,
  children,
}: RemoveConsolePhotoActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {children({ open: () => setOpen(true), loading })}

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
          <div className="border-b px-6 py-4 bg-red-50">
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg text-red-900">
                Retirer la photo
              </DialogTitle>
              <DialogDescription className="text-sm text-red-700 mt-1">
                Cette action est définitive et ne peut pas être annulée.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={onSubmit} className="px-6 pb-5 pt-5 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {consoleName || "Plateforme"}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto hover:bg-gray-50"
                onClick={() => setOpen(false)}
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
                    Retrait en cours...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Confirmer le retrait
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
