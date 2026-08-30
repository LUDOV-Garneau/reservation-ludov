"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Shield, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  EMAIL_MAX,
  EMAIL_REGEX,
  FIRSTNAME_MAX,
  LASTNAME_MAX,
  NAME_MIN,
} from "@/lib/userValidation";
import { ADD_USER_PANE_MIN_H } from "./types";

type Props = {
  /** Le compte vient d'être créé : la liste peut se rafraîchir. */
  onCreated?: () => void;
  /** Annulation, ou fin de l'écran de confirmation : le dialogue peut fermer. */
  onClose?: () => void;
  onAlert?: (type: "success" | "destructive", message: string) => void;
};

/** Durée d'affichage de l'écran de confirmation avant la fermeture. */
const SUCCESS_DISPLAY_MS = 2200;

type FieldErrors = {
  firstname?: string;
  lastname?: string;
  email?: string;
  global?: string;
};

/**
 * Formulaire d'ajout d'un utilisateur, rendu sans dialogue : c'est
 * `AddUserDialog` qui fournit l'enveloppe et les onglets.
 *
 * Les champs passent par `Input` / `Label` / `Button` du design system plutôt
 * que par des `<input>` habillés à la main : le dialogue s'ouvre par-dessus une
 * barre de recherche qui, elle, utilise `Input`. Deux styles de champ à l'écran
 * en même temps, ça se voit.
 */
export default function AddUserForm({ onCreated, onClose, onAlert }: Props) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const t = useTranslations("admin.users.addUserForm");

  const validateForm = (values: {
    firstname: string;
    lastname: string;
    email: string;
  }): FieldErrors => {
    const newErrors: FieldErrors = {};

    const first = values.firstname.trim();
    const last = values.lastname.trim();
    const mail = values.email.trim();

    if (!first) {
      newErrors.firstname = t("errorMessage.firstnameRequired");
    } else if (first.length < NAME_MIN || first.length > FIRSTNAME_MAX) {
      newErrors.firstname = t("errorMessage.firstnameLength");
    }

    if (!last) {
      newErrors.lastname = t("errorMessage.lastnameRequired");
    } else if (last.length < NAME_MIN || last.length > LASTNAME_MAX) {
      newErrors.lastname = t("errorMessage.lastnameLength");
    }

    if (!mail) {
      newErrors.email = t("errorMessage.emailRequired");
    } else if (!EMAIL_REGEX.test(mail)) {
      newErrors.email = t("errorMessage.emailInvalid");
    } else if (mail.length > EMAIL_MAX) {
      newErrors.email = t("errorMessage.emailLength");
    }

    return newErrors;
  };

  const hasFieldErrors = (errs: FieldErrors) =>
    !!(errs.firstname || errs.lastname || errs.email || errs.global);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.trim(),
    };

    const validationErrors = validateForm(trimmed);
    if (hasFieldErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/admin/users/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: trimmed.firstname,
          lastname: trimmed.lastname,
          email: trimmed.email.toLowerCase(),
          isAdmin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // La route renvoie 409 sur courriel déjà pris, violation de la
        // contrainte unique comprise : plus besoin de deviner à partir du
        // texte du message.
        const message =
          res.status === 409
            ? t("errorMessage.userAlreadyExists")
            : data?.error || t("errorMessage.genericError");

        setErrors((prev) => ({ ...prev, global: message }));
        onAlert?.("destructive", message);
        return;
      }

      setSuccess(true);
      onAlert?.("success", t("userAddedSuccess"));
      onCreated?.();
    } catch {
      const message = t("errorMessage.genericError");
      setErrors({ global: message });
      onAlert?.("destructive", message);
    } finally {
      setLoading(false);
    }
  };

  // Le dialogue se refermait tout seul quand ce composant portait encore son
  // propre <Dialog> ; en le sortant, la fermeture avait été perdue et l'écran
  // de confirmation restait affiché indéfiniment.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => closeRef.current?.(), SUCCESS_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [success]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined, global: undefined }));
  };

  if (success) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 text-center",
          ADD_USER_PANE_MIN_H,
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-medium">{t("userAdded")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {firstname} {lastname} {t("wasCreatedSuccessfully")}
          </p>
        </div>
        {/* Le compte part sans mot de passe et aucun courriel n'est envoyé :
            c'est le moment où l'admin doit savoir ce qu'il lui reste à faire. */}
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {t("noAccessYet")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex w-full flex-col gap-4", ADD_USER_PANE_MIN_H)}
      noValidate
    >
      {errors.global && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{errors.global}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="add-user-firstname">
            {t("form.firstName")}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="add-user-firstname"
            value={firstname}
            onChange={(e) => {
              setFirstname(e.target.value);
              clearFieldError("firstname");
            }}
            placeholder="Camille"
            disabled={loading}
            aria-invalid={!!errors.firstname}
            aria-describedby={errors.firstname ? "firstname-error" : undefined}
          />
          {errors.firstname && (
            <p id="firstname-error" className="text-xs text-destructive">
              {errors.firstname}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-user-lastname">
            {t("form.lastName")}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="add-user-lastname"
            value={lastname}
            onChange={(e) => {
              setLastname(e.target.value);
              clearFieldError("lastname");
            }}
            placeholder="Tremblay"
            disabled={loading}
            aria-invalid={!!errors.lastname}
            aria-describedby={errors.lastname ? "lastname-error" : undefined}
          />
          {errors.lastname && (
            <p id="lastname-error" className="text-xs text-destructive">
              {errors.lastname}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-user-email">
          {t("form.email")}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="add-user-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError("email");
          }}
          placeholder="camille.tremblay@umontreal.ca"
          disabled={loading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      {/* Un privilège se bascule, il ne se coche pas au milieu d'une saisie.
          Fond neutre : le pavé bordé de cyan criait plus fort que les champs
          eux-mêmes, alors que c'est l'option secondaire de ce formulaire. */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
        <Switch
          id="isAdmin"
          checked={isAdmin}
          onCheckedChange={setIsAdmin}
          disabled={loading}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <Label htmlFor="isAdmin" className="cursor-pointer">
            <Shield
              className={cn(
                "h-4 w-4",
                isAdmin ? "text-cyan-600" : "text-muted-foreground",
              )}
            />
            {t("form.adminAccess")}
          </Label>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("form.adminAcessDescription")}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {t("form.cancel")}
          </Button>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="bg-cyan-500 text-white hover:bg-cyan-600"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" />
              {t("form.submitting")}
            </>
          ) : (
            <>
              <UserPlus />
              {t("form.submit")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
