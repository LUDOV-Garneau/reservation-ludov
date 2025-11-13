"use client";

import { ReactNode, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const t = useTranslations();
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

  const handleConfirm = useCallback(async () => {
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
          t("admin.reservations.alert.deleteError");

        throw new Error(message);
      }

      onAlert(
        "success",
        t("admin.reservations.alert.deleteSuccess.message"),
        t("admin.reservations.alert.deleteSuccess.title")
      );
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error("Error deleting reservation:", error);
      onAlert(
        "error",
        t("admin.reservations.alert.deleteError"),
        t("admin.reservations.alert.errorTitle")
      );
    } finally {
      setLoading(false);
    }
  }, [targetReservation.id, onAlert, onSuccess, t]);


  const emailOrPlaceholder =
    targetReservation.userEmail ||
    t("admin.reservations.table.noUser");

  return (
    <>
      {children({ open: handleOpen, loading })}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.reservations.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.reservations.deleteDialog.description", {
                email: emailOrPlaceholder,
                date: targetReservation.date,
                time: targetReservation.heure,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleClose}
              disabled={loading}
            >
              {t("admin.reservations.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              asChild
            >
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading
                  ? t("admin.reservations.deleteDialog.deleting")
                  : t("admin.reservations.deleteDialog.confirm")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
