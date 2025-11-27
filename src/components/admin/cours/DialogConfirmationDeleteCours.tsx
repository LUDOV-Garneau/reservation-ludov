"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TargetCours = {
  id: number;
  name: string;
};

export interface DeleteCoursActionProps {
  targetCours: TargetCours;
  onSuccess?: () => void;
  onAlert?: (
    type: "success" | "error" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  children: (controls: {
    open: () => void;
    loading: boolean;
  }) => React.ReactNode;
}

export default function DeleteCoursAction({
  targetCours,
  onSuccess,
  onAlert,
  children,
}: DeleteCoursActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delete-cours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coursId: targetCours.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.error || "Une erreur est survenue lors de la suppression."
        );
      }

      const data = await res.json().catch(() => ({}));
      onAlert?.(
        "success",
        data?.message || "Le cours a été supprimé avec succès."
      );
      onSuccess?.();
      setOpen(false);
    } catch (e) {
      onAlert?.(
        "error",
        e instanceof Error
          ? e.message
          : "Une erreur est survenue lors de la suppression."
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) handleConfirm();
  }

  return (
    <>
      {children({ open: () => setOpen(true), loading })}

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
          <div className="border-b px-6 py-4 bg-red-50">
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg text-red-900">
                Supprimer le cours
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
                  {targetCours.name ? <>{targetCours.name}</> : "Cours"}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                Ce qui va se passer
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <Trash2 className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  <span>
                    Le cours <strong className="text-gray-900">supprimé</strong>{" "}
                    ne sera plus accessible.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Trash2 className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  <span>
                    La réservation associée seront définie à{" "}
                    <strong className="text-gray-900">nulle</strong>.
                  </span>
                </li>
              </ul>
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
                    Suppression en cours...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Confirmer la suppression
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
