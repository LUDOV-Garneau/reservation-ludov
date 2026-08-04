import { useState, useCallback } from "react";

export type AlertType = "success" | "destructive" | "info" | "warning";

export interface TargetReservation {
  id: string;
  userEmail: string | null;
  date: string;
  heure: string;
}

interface UseDeleteReservationActionParams {
  targetReservation: TargetReservation;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
}

export function useDeleteReservationAction({
  targetReservation,
  onAlert,
  onSuccess,
}: UseDeleteReservationActionParams) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  const handleOpen = useCallback(() => {
    setReason("");
    setReasonError(false);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) setOpen(false);
  }, [loading]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!loading) setOpen(v);
    },
    [loading],
  );

  const handleReasonChange = useCallback((value: string) => {
    setReason(value);
    if (value.trim()) setReasonError(false);
  }, []);

  const handleConfirm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;

      if (!reason.trim()) {
        setReasonError(true);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`/api/admin/cancel-reservation`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetReservation.id, reason }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ||
              "Erreur lors de l'annulation de la réservation",
          );
        }

        onAlert(
          "success",
          "La réservation a été annulée avec succès",
          "Réservation annulée",
        );
        onSuccess();
        setOpen(false);
      } catch (error) {
        console.error("Error cancelling reservation:", error);
        onAlert(
          "destructive",
          error instanceof Error
            ? error.message
            : "Erreur lors de l'annulation de la réservation",
          "Erreur",
        );
      } finally {
        setLoading(false);
      }
    },
    [targetReservation.id, onAlert, onSuccess, loading, reason],
  );

  const emailOrPlaceholder =
    targetReservation.userEmail || "Utilisateur inconnu";

  return {
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
  };
}
