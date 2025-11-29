"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useTranslations } from "next-intl";
import { Check, ArrowLeft, AlertCircle, Mail, RefreshCw } from "lucide-react";

export default function SignupCodeForm({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const t = useTranslations("auth.OTP");

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (error) {
      setError("");
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendSuccess(false);
    setError("");

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      setIsResending(false);
      if (!response.ok) {
        setError(t("auth.signup.errorSend"));
        return;
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch {
      setIsResending(false);
      setError(t("auth.signup.errorSend"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError(t("invalidOTP"));
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/auth/otp?email=${encodeURIComponent(
          email
        )}&otp=${encodeURIComponent(code)}`
      );

      setIsLoading(false);
      if (!response.ok) {
        setError(t("expiredOTP"));
        return;
      }

      onNext();
    } catch {
      setIsLoading(false);
      setError(t("error"));
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
          <Check className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h1>
          <div className="text-gray-500 text-sm space-y-1">
            <p>{t("subTitle1")}</p>
            <p>{t("subTitle2")}</p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-gray-800">{email}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-3">
          <Label
            htmlFor="code"
            className="text-sm font-medium text-gray-700 text-center block flex items-center justify-center gap-1"
          >
            {t("codeEmail")}
            {error && <AlertCircle className="w-4 h-4 text-red-500" />}
          </Label>
          <div className="flex flex-col items-center gap-3">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              className="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className={`w-12 h-14 text-2xl font-bold border-2 rounded-s-xl transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-green-400 focus:border-green-400"
                  }`}
                />
                <InputOTPSlot
                  index={1}
                  className={`w-12 h-14 text-2xl font-bold border-2 transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-green-400 focus:border-green-400"
                  }`}
                />
                <InputOTPSlot
                  index={2}
                  className={`w-12 h-14 text-2xl font-bold border-2 rounded-e-xl transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-green-400 focus:border-green-400"
                  }`}
                />
              </InputOTPGroup>
              <InputOTPSeparator>
                <div className="w-3 h-0.5 bg-gray-300 rounded" />
              </InputOTPSeparator>
              <InputOTPGroup>
                <InputOTPSlot
                  index={3}
                  className={`w-12 h-14 text-2xl font-bold border-2 rounded-s-xl transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-green-400 focus:border-green-400"
                  }`}
                />
                <InputOTPSlot
                  index={4}
                  className={`w-12 h-14 text-2xl font-bold border-2 transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-green-400 focus:border-green-400"
                  }`}
                />
                <InputOTPSlot
                  index={5}
                  className={`w-12 h-14 text-2xl font-bold border-2 rounded-e-xl transition-all ${
                    error
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-cyan-400 focus:border-cyan-400"
                  }`}
                />
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}

            {resendSuccess && (
              <p className="text-cyan-600 text-sm flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <Check className="w-4 h-4" />
                {t("codeSent")}
              </p>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending}
            className="text-sm text-gray-600 hover:text-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto group"
          >
            <RefreshCw
              className={`w-4 h-4 transition-transform ${
                isResending ? "animate-spin" : "group-hover:rotate-180"
              }`}
            />
            {isResending ? t("resendOTPLoading") : t("resendOTP")}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-700 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:from-gray-400 disabled:to-gray-400"
          disabled={code.length !== 6 || /[^0-9]/.test(code) || isLoading}
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
              {t("OTPBtnLoading")}
            </span>
          ) : (
            t("OTPBtn")
          )}
        </Button>
      </form>
    </div>
  );
}
