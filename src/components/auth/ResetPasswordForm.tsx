"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ShieldX,
} from "lucide-react";
import { PASSWORD_MIN } from "@/lib/userValidation";

type Status = "checking" | "invalid" | "form" | "done";

/**
 * Écran atteint depuis le lien du courriel.
 *
 * Le jeton est vérifié une première fois au montage, sans être consommé, pour
 * annoncer un lien expiré avant que la personne saisisse quoi que ce soit. La
 * vérification qui fait autorité reste celle de la route POST.
 */
export default function ResetPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations("auth.resetPassword");
  const locale = useLocale();

  const [status, setStatus] = useState<Status>("checking");
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
        );
        if (cancelled) return;
        setStatus(response.ok ? "form" : "invalid");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "password":
        if (!value) {
          errorMsg = t("emptyPassword");
        } else if (value.length < PASSWORD_MIN) {
          errorMsg = t("invalidPassword");
        }
        break;
      case "confirmPassword":
        if (value !== formData.password) {
          errorMsg = t("invalidPasswordConfirmation");
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (globalError) setGlobalError(null);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setTouched({ password: true, confirmPassword: true });

    const newErrors = {
      password: validateField("password", formData.password),
      confirmPassword: validateField(
        "confirmPassword",
        formData.confirmPassword,
      ),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });
      setIsLoading(false);

      // Le lien a pu expirer ou servir ailleurs entre le montage et l'envoi.
      if (response.status === 400) {
        setStatus("invalid");
        return;
      }

      if (!response.ok) {
        setGlobalError(t("error"));
        return;
      }

      setStatus("done");
    } catch {
      setIsLoading(false);
      setGlobalError(t("error"));
    }
  };

  if (status === "checking") {
    return (
      <div className="space-y-6 text-center py-6">
        <svg
          className="animate-spin h-8 w-8 mx-auto text-cyan-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-500 text-sm">{t("checking")}</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <ShieldX className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t("invalidTitle")}
            </h1>
            <p className="text-gray-500 text-sm">{t("invalidBody")}</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => window.location.assign(`/${locale}/auth`)}
          className="w-full bg-cyan-500 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          {t("requestNewLink")}
        </Button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t("successTitle")}
            </h1>
            <p className="text-gray-500 text-sm">{t("successBody")}</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => window.location.assign(`/${locale}/auth`)}
          className="w-full bg-cyan-500 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          {t("backToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            {t("password")}
            {touched.password && errors.password && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </Label>
          <div className="relative group">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                touched.password && errors.password
                  ? "text-red-400"
                  : "text-gray-400 group-focus-within:text-cyan-500"
              }`}
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`pl-10 pr-12 py-3 bg-gray-50 border rounded-xl transition-all duration-200 ${
                touched.password && errors.password
                  ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                  : "border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 rounded p-1"
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {touched.password && errors.password && (
            <p
              id="password-error"
              className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-1 duration-200"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            {t("confirmPassword")}
            {touched.confirmPassword && errors.confirmPassword && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </Label>
          <div className="relative group">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                touched.confirmPassword && errors.confirmPassword
                  ? "text-red-400"
                  : "text-gray-400 group-focus-within:text-cyan-500"
              }`}
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
              aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              className={`pl-10 pr-4 py-3 bg-gray-50 border rounded-xl transition-all duration-200 ${
                touched.confirmPassword && errors.confirmPassword
                  ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                  : "border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              }`}
              placeholder="••••••••"
            />
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p
              id="confirm-password-error"
              className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-1 duration-200"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {globalError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{globalError}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={
            !formData.password || !formData.confirmPassword || isLoading
          }
          className="w-full bg-cyan-500 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t("submitBtnLoading")}
            </span>
          ) : (
            t("submitBtn")
          )}
        </Button>
      </form>
    </div>
  );
}
