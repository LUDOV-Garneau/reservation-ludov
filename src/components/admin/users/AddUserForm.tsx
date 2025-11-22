"use client";

import { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
  trigger?: ReactNode;
};

type FieldErrors = {
  firstname?: string;
  lastname?: string;
  email?: string;
  global?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddUserFormDialog({
  onSuccess,
  onAlert,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const t = useTranslations("admin.users.addUserForm");

  const resetForm = () => {
    setFirstname("");
    setLastname("");
    setEmail("");
    setIsAdmin(false);
    setSuccess(false);
    setErrors({});
  };

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
    } else if (first.length < 2) {
      newErrors.firstname = t("errorMessage.firstnameLength");
    }

    if (!last) {
      newErrors.lastname = t("errorMessage.lastnameRequired");
    } else if (last.length < 2) {
      newErrors.lastname = t("errorMessage.lastnameLength");
    }

    if (!mail) {
      newErrors.email = t("errorMessage.emailRequired");
    } else if (!EMAIL_REGEX.test(mail)) {
      newErrors.email = t("errorMessage.emailInvalid");
    } else if (mail.length > 255) {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: trimmed.firstname,
          lastname: trimmed.lastname,
          email: trimmed.email.toLowerCase(),
          isAdmin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let message =
          data?.error || "Erreur lors de l'ajout de l'utilisateur.";

        if (data?.error?.toLowerCase().includes("existe déjà")) {
          message = t("errorMessage.userAlreadyExists");
        }

        setErrors((prev) => ({ ...prev, global: message }));
        onAlert?.("error", message);
        return;
      }

      setSuccess(true);
      onAlert?.("success", t("userAddedSuccess"));
      onSuccess?.();

      setTimeout(() => {
        resetForm();
        setOpen(false);
      }, 1600);
    } catch {
      const message = t("errorMessage.genericError");
      setErrors({ global: message });
      onAlert?.("error", message);
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined, global: undefined }));
  };

  const baseInputClasses =
    "w-full px-4 py-2.5 bg-[white] border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-gray-900";

  const errorInputClasses = "border-red-400";
  const normalInputClasses = "border-gray-300";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 flex items-center gap-2 justify-center"
          >
            <UserPlus className="w-4 h-4" />
            {t("addUser")}
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="w-5 h-5 text-cyan-600" />
            {t("addUser")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4">
          {success ? (
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl shadow-lg p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200 dark:bg-emerald-800 rounded-full -mr-16 -mt-16 opacity-20"></div>

              <div className="relative flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/50 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {t("userAdded")}
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {firstname} {lastname} {t("wasCreatedSuccessfully")}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
              {errors.global && (
                <div className="relative overflow-hidden bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-1">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-red-500 rounded-lg shadow-lg shadow-red-500/50 flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900">
                        {errors.global}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setErrors((prev) => ({ ...prev, global: undefined }))
                      }
                      className="p-1.5 hover:bg-red-200 rounded-lg transition-all duration-200 flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-red-700" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    {t("form.firstName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstname}
                    onChange={(e) => {
                      setFirstname(e.target.value);
                      clearFieldError("firstname");
                    }}
                    className={`${baseInputClasses} ${errors.firstname ? errorInputClasses : normalInputClasses
                      }`}
                    placeholder="John"
                    disabled={loading}
                    aria-invalid={!!errors.firstname}
                    aria-describedby={
                      errors.firstname ? "firstname-error" : undefined
                    }
                  />
                  {errors.firstname && (
                    <p
                      id="firstname-error"
                      className="text-xs text-red-600 mt-0.5"
                    >
                      {errors.firstname}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    {t("form.lastName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => {
                      setLastname(e.target.value);
                      clearFieldError("lastname");
                    }}
                    className={`${baseInputClasses} ${errors.lastname ? errorInputClasses : normalInputClasses
                      }`}
                    placeholder="Doe"
                    disabled={loading}
                    aria-invalid={!!errors.lastname}
                    aria-describedby={
                      errors.lastname ? "lastname-error" : undefined
                    }
                  />
                  {errors.lastname && (
                    <p
                      id="lastname-error"
                      className="text-xs text-red-600 mt-0.5"
                    >
                      {errors.lastname}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  {t("form.email")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  className={`${baseInputClasses} ${errors.email ? errorInputClasses : normalInputClasses
                    }`}
                  placeholder="john.doe@example.com"
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-600 mt-0.5">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-3 flex items-start gap-3">
                <Checkbox
                  id="isAdmin"
                  checked={isAdmin}
                  onCheckedChange={(checked) =>
                    setIsAdmin(Boolean(checked))
                  }
                  disabled={loading}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <label
                      htmlFor="isAdmin"
                      className="text-sm font-medium text-amber-900 cursor-pointer"
                    >
                      {t("form.adminAccess")}
                    </label>
                    {isAdmin && (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {t("form.active")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-800/90 mt-1.5">
                    {t("form.adminAcessDescription")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  {t("form.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      {t("form.submit")}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
