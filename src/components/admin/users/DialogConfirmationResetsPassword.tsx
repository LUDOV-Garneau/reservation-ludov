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
import { KeyRound, Mail, Loader2, Shield, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type TargetUser = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
};

export interface ResetPasswordActionProps {
  targetUser: TargetUser;
  onSuccess?: () => void;
  onAlert?: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  children: (controls: {
    open: () => void;
    loading: boolean;
  }) => React.ReactNode;
}

export default function ResetPasswordAction({
  targetUser,
  onSuccess,
  onAlert,
  children,
}: ResetPasswordActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = useTranslations("admin.users.resetPasswordDialog");

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUserId: targetUser.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur lors de la réinitialisation");
      }

      const data = await res.json();
      onAlert?.(
        "success",
        data.message || "Mot de passe réinitialisé avec succès"
      );
      onSuccess?.();
      setOpen(false);
    } catch (e) {
      onAlert?.(
        "error",
        e instanceof Error ? e.message : "Erreur lors de la réinitialisation"
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
          <div className="border-b px-6 py-4 bg-orange-50">
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg text-amber-900">
                {t("resetPassword")}
              </DialogTitle>
              <DialogDescription className="text-sm text-amber-700 mt-1">
                {t("thisActionPreventLogin")}
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={onSubmit} className="px-6 pb-5 pt-5 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {targetUser.firstName || targetUser.lastName ? (
                    <>
                      {targetUser.firstName} {targetUser.lastName}
                    </>
                  ) : (
                    "Utilisateur"
                  )}
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{targetUser.email}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-600" />
                {t("whatWillHappen")}
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <KeyRound className="h-4 w-4 mt-0.5 text-cyan-600 shrink-0" />
                  <span>
                    {t("thePasswordWillBe")}{" "}
                    <strong className="text-gray-900">{t("reset")}</strong>{" "}
                    {t("inTheDatabase")}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Send className="h-4 w-4 mt-0.5 text-cyan-600 shrink-0" />
                  <span>{t("emailWillBeSend")}</span>
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
                {t("cancelReset")}
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
                    {t("resetState")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t("confirmReset")}
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
