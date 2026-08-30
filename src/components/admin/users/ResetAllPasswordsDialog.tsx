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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

type AlertType = "success" | "destructive" | "info" | "warning";

/** Doit correspondre au jeton attendu par la route. */
const CONFIRM_TOKEN = "REINITIALISER-TOUT";

type Response = {
  reset?: number;
  emailsSent?: number;
  failed?: { email: string; error: string }[];
  error?: string;
};

/**
 * Confirmation d'une réinitialisation globale. La saisie du jeton est une
 * friction volontaire : c'est la seule action de l'onglet qui touche *tous* les
 * comptes, dont celui de la personne qui la déclenche.
 */
export default function ResetAllPasswordsDialog({
  open,
  onOpenChange,
  totalUsers,
  onDone,
  onAlert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalUsers: number;
  onDone: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
}) {
  const t = useTranslations("admin.users.resetAll");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const canConfirm = confirmText.trim() === CONFIRM_TOKEN && !loading;

  const close = (next: boolean) => {
    if (loading) return;
    if (!next) setConfirmText("");
    onOpenChange(next);
  };

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/reset-all-passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirm: CONFIRM_TOKEN }),
      });

      const data: Response = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t("error"));

      const reset = data.reset ?? 0;
      const failed = data.failed?.length ?? 0;

      if (failed > 0) {
        onAlert(
          "warning",
          data.failed?.map((f) => f.email).join(", ") ?? "",
          t("partial", { reset, failed }),
        );
      } else {
        onAlert("success", t("success", { reset }));
      }

      setConfirmText("");
      onOpenChange(false);
      onDone();
    } catch (err) {
      onAlert("destructive", err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-destructive" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description", { count: totalUsers })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ul className="space-y-1.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <li className="flex gap-2">
              <span aria-hidden className="text-destructive">
                •
              </span>
              <span>{t("consequences.everyone")}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-destructive">
                •
              </span>
              <span className="font-medium">{t("consequences.includingYou")}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-destructive">
                •
              </span>
              <span>{t("consequences.emails", { count: totalUsers })}</span>
            </li>
          </ul>

          {/* Rassure sur ce qui n'est PAS cassé : sans ça, l'action a l'air
              irréversible alors que la récupération est autonome. */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("recovery")}
          </p>

          <div className="space-y-2">
            <Label htmlFor="reset-all-confirm">
              {t("confirmLabel", { token: CONFIRM_TOKEN })}
            </Label>
            <Input
              id="reset-all-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TOKEN}
              autoComplete="off"
              disabled={loading}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => close(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={!canConfirm}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <KeyRound />
                {t("confirm")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
