"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, Loader2, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

type AlertType = "success" | "destructive" | "info" | "warning";
type BulkAction = "reset-password" | "delete";

type BulkResponse = {
  succeeded?: number[];
  failed?: { id: number; error: string }[];
  error?: string;
};

/**
 * Remplace la barre d'outils dès qu'une ligne est cochée. Un seul appel à
 * `POST /api/admin/users/bulk` par action : le serveur traite séquentiellement
 * et renvoie le détail des échecs, qu'on rapporte tel quel plutôt que
 * d'annoncer un succès global qui n'a peut-être pas eu lieu.
 */
export default function UsersBulkBar({
  selectedIds,
  onClear,
  onDone,
  onAlert,
}: {
  selectedIds: number[];
  onClear: () => void;
  onDone: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
}) {
  const t = useTranslations("admin.users.bulk");
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [loading, setLoading] = useState(false);

  const count = selectedIds.length;
  const isDelete = pendingAction === "delete";

  async function confirm() {
    if (!pendingAction) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: pendingAction, userIds: selectedIds }),
      });

      const data: BulkResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || t("error"));
      }

      const succeeded = data.succeeded?.length ?? 0;
      const failed = data.failed?.length ?? 0;

      if (failed > 0) {
        onAlert(
          "warning",
          data.failed?.map((item) => `#${item.id} : ${item.error}`).join(" · ") ?? "",
          t("partial", { succeeded, failed }),
        );
      } else {
        onAlert(
          "success",
          isDelete
            ? t("successDelete", { count: succeeded })
            : t("successReset", { count: succeeded }),
        );
      }

      setPendingAction(null);
      onClear();
      onDone();
    } catch (err) {
      onAlert("destructive", err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium" aria-live="polite">
          {t("selected", { count })}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingAction("reset-password")}
            className="hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950"
          >
            <KeyRound className="h-4 w-4" />
            {t("resetPassword")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPendingAction("delete")}
            className="text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </Button>

          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">{t("clearSelection")}</span>
          </Button>
        </div>
      </div>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !loading) setPendingAction(null);
        }}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isDelete
                ? t("confirmDeleteTitle", { count })
                : t("confirmResetTitle", { count })}
            </DialogTitle>
            <DialogDescription>
              {isDelete ? t("confirmDeleteDescription") : t("confirmResetDescription")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={confirm}
              disabled={loading}
              className={
                isDelete
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-cyan-500 text-white hover:bg-cyan-600"
              }
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
