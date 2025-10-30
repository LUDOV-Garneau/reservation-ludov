"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Console } from "@/types/console";
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Monitor,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface SelectedConsoleCardProps {
  console: Console | null;
  onClear: () => void;
  onSuccess?: () => void;
  buttonLabel?: string;
}

export default function SelectedConsoleCard({
  console,
  onClear,
  onSuccess,
  buttonLabel,
}: SelectedConsoleCardProps) {
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!console) {
    return (
      <div className="p-8 border-dashed border-2 border-gray-300 rounded-2xl flex flex-col items-center gap-3 w-full">
        <Monitor className="h-12 w-12 text-gray-400" />
        <p className="text-center text-lg font-medium">
          {t("reservation.console.noneSelected")}
        </p>
        <p className="text-center text-gray-500 text-sm">
          {t("reservation.console.chooseToStart")}
        </p>
      </div>
    );
  }

  const handleContinue = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess(true);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("reservation.console.errorOccurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full h-48 rounded-2xl overflow-hidden group bg-gray-100">
        {console.picture ? (
          <Image
            src={console.picture}
            alt={console.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Monitor className="h-16 w-16" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <button
          onClick={onClear}
          className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          aria-label={t("reservation.console.changeConsole")}
        >
          <X className="h-4 w-4" />
        </button>

        {success && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Check className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">
              {t("reservation.console.saved")}
            </span>
          </div>
        )}
      </div>

      <div className="px-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          {t("reservation.console.consoleSelected")}
        </p>
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">
          {console.name}
        </h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={handleContinue}
          disabled={isLoading || success}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium h-11 rounded-xl transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("reservation.console.validating")}
            </>
          ) : success ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("reservation.console.confirmed")}
            </>
          ) : (
            <>
              {buttonLabel ?? t("reservation.console.continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
