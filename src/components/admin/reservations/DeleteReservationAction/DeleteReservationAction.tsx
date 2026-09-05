"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
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
import { Calendar, Clock, User, Loader2, Trash2 } from "lucide-react";
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
  const t = useTranslations("admin.reservations.deleteDialog");
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
        <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden p-0 sm:max-w-[480px]">
          {/* Bandeau d'avertissement en paire claire/sombre : le bg-red-50 /
              text-red-900 d'origine devenait illisible en thème sombre. */}
          <div className="border-b bg-rose-50 px-6 py-4 dark:bg-rose-950">
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg text-rose-900 dark:text-rose-100">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                {t("description")}
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleConfirm} className="space-y-5 px-6 pb-5 pt-5">
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{emailOrPlaceholder}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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

            <div className="space-y-2">
              <Label
                htmlFor="cancellation-reason"
                className="text-sm font-medium"
              >
                {t("reasonLabel")}{" "}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder={t("reasonPlaceholder")}
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                disabled={loading}
                aria-invalid={reasonError}
                className={cn(
                  "min-h-[80px] resize-none",
                  reasonError &&
                    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                )}
              />
              {reasonError && (
                <p className="text-xs text-destructive">
                  {t("reasonRequired")}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleClose}
                disabled={loading}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="w-full shadow-md transition-all hover:shadow-lg sm:w-auto"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("deleting")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {t("confirm")}
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
