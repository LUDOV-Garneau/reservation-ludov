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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { UserDetails } from "./useUserDetail";

type AlertType = "success" | "destructive" | "info" | "warning";

/**
 * Modification d'un compte. Un seul appel `PATCH /api/admin/users/[id]` couvre
 * l'identité, le rôle et la langue des courriels ; c'est la route qui refuse
 * l'auto-rétrogradation et celle du dernier administrateur, l'interface se
 * contente de désactiver le cas évident.
 */
export default function EditUserDialog({
  user,
  isSelf,
  open,
  onOpenChange,
  onSaved,
  onAlert,
}: {
  user: UserDetails;
  isSelf: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
}) {
  const t = useTranslations("admin.users.detail.edit");

  const [firstname, setFirstname] = useState(user.firstname);
  const [lastname, setLastname] = useState(user.lastname);
  const [email, setEmail] = useState(user.email);
  const [isAdmin, setIsAdmin] = useState(Boolean(user.isAdmin));
  const [locale, setLocale] = useState(user.preferredLocale || "fr");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const close = (next: boolean) => {
    if (saving) return;
    if (!next) {
      // Le dialogue démonte son contenu : on rétablit quand même les valeurs
      // pour le cas où il resterait monté.
      setFirstname(user.firstname);
      setLastname(user.lastname);
      setEmail(user.email);
      setIsAdmin(Boolean(user.isAdmin));
      setLocale(user.preferredLocale || "fr");
      setError(null);
    }
    onOpenChange(next);
  };

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          isAdmin,
          preferredLocale: locale,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || t("error"));

      onAlert("success", t("saved"));
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-firstname">{t("firstName")}</Label>
              <Input
                id="edit-firstname"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastname">{t("lastName")}</Label>
              <Input
                id="edit-lastname"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">{t("email")}</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-locale">{t("locale")}</Label>
            <Select value={locale} onValueChange={setLocale} disabled={saving}>
              <SelectTrigger id="edit-locale" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">{t("localeFr")}</SelectItem>
                <SelectItem value="en">{t("localeEn")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("localeHint")}</p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
            <Switch
              id="edit-isAdmin"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
              // Se retirer soi-même ses droits n'est pas réparable depuis
              // l'interface : la route le refuse, autant ne pas le proposer.
              disabled={saving || (isSelf && isAdmin)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor="edit-isAdmin" className="cursor-pointer">
                <Shield
                  className={cn(
                    "h-4 w-4",
                    isAdmin ? "text-cyan-600" : "text-muted-foreground",
                  )}
                />
                {t("adminAccess")}
              </Label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isSelf && isAdmin ? t("cannotDemoteSelf") : t("adminHint")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => close(false)} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-cyan-500 text-white hover:bg-cyan-600"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
