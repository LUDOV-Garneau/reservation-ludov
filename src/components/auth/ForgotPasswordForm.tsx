"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Mail,
  MailCheck,
} from "lucide-react";

/**
 * Demande d'un lien de réinitialisation.
 *
 * L'écran de confirmation ne dit jamais si le compte existe : la route répond
 * de la même façon pour une adresse inconnue, et l'interface doit tenir le même
 * discours, sinon la neutralité de la réponse serveur ne servirait à rien.
 */
export default function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const t = useTranslations("auth.forgotPassword");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = (value: string) => {
    const errorMsg = value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ? ""
      : t("invalidEmail");
    setError(errorMsg);
    return errorMsg;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (validate(email) !== "") return;

    // La requête part sans être attendue, et l'écran de confirmation s'affiche
    // aussitôt. Une attente visible trahirait le compte : un envoi SMTP prend
    // une seconde ou deux là où une adresse inconnue répond instantanément.
    // Le sort de la requête n'est volontairement pas rapporté — un échec
    // affiché serait le même aveu.
    void fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    }).catch(() => {});

    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <MailCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t("sentTitle")}
            </h1>
            <div className="text-gray-500 text-sm space-y-1">
              <p>{t("sentBody")}</p>
              <p>{t("sentExpiry")}</p>
              <p>{t("sentSpam")}</p>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-800">{email}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={onBack}
          className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          {t("backToLogin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-cyan-600 transition-colors group -ml-2"
        type="button"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
        <span className="text-sm font-medium">{t("back")}</span>
      </button>

      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-500 text-sm">
            {t("subTitle1")}
            <br />
            {t("subTitle2")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="forgot-email"
            className="text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            {t("email")}
            {touched && error && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </Label>
          <div className="relative group">
            <Mail
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
                touched && error
                  ? "text-red-400"
                  : "text-gray-400 group-focus-within:text-cyan-500"
              }`}
            />
            <Input
              id="forgot-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              onBlur={(e) => {
                setTouched(true);
                validate(e.target.value);
              }}
              required
              aria-invalid={touched && !!error}
              aria-describedby={error ? "forgot-email-error" : undefined}
              className={`pl-10 pr-4 py-3 bg-gray-50 border rounded-xl transition-all duration-200 ${
                touched && error
                  ? "border-red-300 border-2 focus:ring-red-400 focus:border-red-400"
                  : "border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              }`}
              placeholder="exemple@email.com"
            />
          </div>
          {touched && error && (
            <p
              id="forgot-email-error"
              className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-1 duration-200"
            >
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!email}
          className="w-full bg-cyan-500 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="flex items-center justify-center gap-2">
            {t("sendLinkBtn")}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>
      </form>

      <Button
        variant="outline"
        type="button"
        onClick={onBack}
        className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      >
        {t("login")}
      </Button>
    </div>
  );
}
