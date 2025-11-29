"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";

export default function SignupEmailForm({
  onNext,
  onBack,
}: {
  onNext: (email: string) => void;
  onBack: () => void;
}) {
  const t = useTranslations("auth.signup");

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "email":
        if (!value) {
          errorMsg = t("invalidEmail");
        } else if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errorMsg = t("invalidEmail");
        }
        break;
    }

    setError(errorMsg);
    return errorMsg;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(true);
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched(true);
    const newErrors = validateField("email", email);

    setError(newErrors);

    if (newErrors !== "") {
      return;
    }

    try {
      setIsLoading(true);

      const responseCheckEmail = await fetch(
        `/api/auth/register?email=${encodeURIComponent(email)}`
      );
      if (responseCheckEmail.status === 401) {
        setIsLoading(false);
        setError(t("invalidCredentials"));
        return;
      } else if (!responseCheckEmail.ok) {
        setIsLoading(false);
        setError(t("errorValidation"));
        return;
      }

      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      setIsLoading(false);
      if (!response.ok) {
        setError(t("errorSend"));
        return;
      }

      onNext(email);
    } catch {
      setIsLoading(false);
      setError(t("errorSend"));
    }
  };

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
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
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
            htmlFor="email"
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
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              aria-invalid={touched && !!error}
              aria-describedby={error ? "email-error" : undefined}
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
              id="email-error"
              className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-1 duration-200"
            >
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:from-gray-400 disabled:to-gray-400"
          disabled={!email || isLoading}
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
              {t("sendCodeBtnLoading")}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {t("sendCodeBtn")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </form>

      <Button
        variant="outline"
        type="button"
        onClick={onBack}
        className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
      >
        {t("login")}
      </Button>
    </div>
  );
}
