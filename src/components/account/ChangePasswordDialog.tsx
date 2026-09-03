"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
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
import { PASSWORD_MIN } from "@/lib/userValidation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Changement de mot de passe depuis le menu d'en-tête (personne connectée).
 * Le mot de passe actuel est exigé ; les autres appareils sont déconnectés
 * par le serveur, la session courante est conservée.
 */
export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("auth.changePassword");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
    setGlobalError(null);
    setShowPasswords(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const update = (field: Field, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (globalError) setGlobalError(null);
  };

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!form.currentPassword) next.currentPassword = t("emptyCurrent");
    if (!form.newPassword) next.newPassword = t("emptyNew");
    else if (form.newPassword.length < PASSWORD_MIN)
      next.newPassword = t("invalidNew", { min: PASSWORD_MIN });
    else if (form.newPassword === form.currentPassword)
      next.newPassword = t("sameAsCurrent");
    if (form.confirmPassword !== form.newPassword)
      next.confirmPassword = t("invalidConfirmation");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      if (response.status === 403) {
        setErrors({ currentPassword: t("wrongCurrent") });
        return;
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setGlobalError(data?.message || t("error"));
        return;
      }

      toast.success(t("successTitle"), { description: t("successBody") });
      handleOpenChange(false);
    } catch {
      setGlobalError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const fields: { name: Field; label: string; autoComplete: string }[] = [
    { name: "currentPassword", label: t("current"), autoComplete: "current-password" },
    { name: "newPassword", label: t("new"), autoComplete: "new-password" },
    { name: "confirmPassword", label: t("confirm"), autoComplete: "new-password" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-cyan-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          {fields.map(({ name, label, autoComplete }) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={`change-${name}`}>{label}</Label>
              <Input
                id={`change-${name}`}
                name={name}
                type={showPasswords ? "text" : "password"}
                autoComplete={autoComplete}
                value={form[name]}
                onChange={(e) => update(name, e.target.value)}
                aria-invalid={Boolean(errors[name])}
                aria-describedby={errors[name] ? `change-${name}-error` : undefined}
                disabled={isLoading}
              />
              {errors[name] && (
                <p
                  id={`change-${name}-error`}
                  className="text-red-500 text-sm flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors[name]}
                </p>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {showPasswords ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showPasswords ? t("hidePasswords") : t("showPasswords")}
          </button>

          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{globalError}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t("submitLoading") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
