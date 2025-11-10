"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

type Props = {
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
};

export default function AddUserForm({ onSuccess, onAlert }: Props) {
  const t = useTranslations("admin.users.addUserForm");
  const [open, setOpen] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstname || !lastname || !email) {
      setError(t("errors.missingFields"));
      return;
    }

    if (!emailRegex.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim().toLowerCase(),
          isAdmin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("existe déjà")) {
          setError(t("errors.userExists"));
        } else {
          onAlert?.("error", t("alerts.addUserError"));
        }
        throw new Error(data.error);
      }

      onAlert?.("success", t("alerts.addUserSuccess"));
      router.refresh();

      setFirstname("");
      setLastname("");
      setEmail("");
      setIsAdmin(false);
      setOpen(false);
      onSuccess?.();
    } catch {
      onAlert?.("error", t("alerts.addUserError"));
    } finally {
      setLoading(false);
    }
  };

  const clearErrorOnChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (error) setError(null);
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">{t("button.openDialog")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("titles.dialogTitle")}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-md mt-4"
          noValidate
        >
          <div>
            <Label htmlFor="firstname">{t("fields.firstname")} *</Label>
            <Input
              id="firstname"
              value={firstname}
              onChange={clearErrorOnChange(setFirstname)}
            />
          </div>

          <div>
            <Label htmlFor="lastname">{t("fields.lastname")} *</Label>
            <Input
              id="lastname"
              value={lastname}
              onChange={clearErrorOnChange(setLastname)}
            />
          </div>

          <div>
            <Label htmlFor="email">{t("fields.email")} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={clearErrorOnChange(setEmail)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(Boolean(checked))}
            />
            <Label htmlFor="isAdmin">{t("fields.isAdmin")}</Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? t("button.loading") : t("button.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
