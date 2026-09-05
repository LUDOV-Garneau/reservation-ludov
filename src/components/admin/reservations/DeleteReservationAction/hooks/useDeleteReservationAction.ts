import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

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
  onSuccess: (reason?: string) => void;
}

export function useDeleteReservationAction({
  targetReservation,
  onAlert,
  onSuccess,
}: UseDeleteReservationActionParams) {
  const t = useTranslations("admin.reservations");
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
            (data as { error?: string }).error || t("alert.deleteError"),
          );
        }

        onAlert(
          "success",
          t("alert.deleteSuccess.message"),
          t("alert.deleteSuccess.title"),
        );
        onSuccess(reason.trim());
        setOpen(false);
      } catch (error) {
        console.error("Error cancelling reservation:", error);
        onAlert(
          "destructive",
          error instanceof Error ? error.message : t("alert.deleteError"),
          t("alert.errorTitle"),
        );
      } finally {
        setLoading(false);
      }
    },
    [targetReservation.id, onAlert, onSuccess, loading, reason, t],
  );

  const emailOrPlaceholder =
    targetReservation.userEmail || t("deleteDialog.unknownUser");

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
