"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Mail, Send, Loader2, Clock, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface ReservationReminderDialogProps {
  reservationId: string;
  onSendReminder?: () => void;
  onError?: (error: Error) => void;
}

const REMINDER_OPTIONS = [
  { value: "1", label: "1 heure avant", hours: 1 },
  { value: "3", label: "3 heures avant", hours: 3 },
  { value: "6", label: "6 heures avant", hours: 6 },
  { value: "12", label: "12 heures avant", hours: 12 },
  { value: "24", label: "1 jour avant", hours: 24 },
  { value: "48", label: "2 jours avant", hours: 48 },
  { value: "72", label: "3 jours avant", hours: 72 },
];

export default function ReservationReminderDialog({
  reservationId,
  onSendReminder,
  onError,
}: ReservationReminderDialogProps) {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState("24");

  useEffect(() => {
    const fetchReminderStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/reservation/reminder?reservationId=${reservationId}`
        );

        if (response.ok) {
          const data = await response.json();
          setReminderEnabled(data.reminderEnabled || false);
          setSelectedTime(data.reminderHoursBefore?.toString() || "24");
        }
      } catch (error) {
        console.error("❌ Error fetching reminder status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminderStatus();
  }, [reservationId]);

  const handleConfirm = async () => {
    if (!reminderEnabled) {
      setOpen(false);
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/reservation/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          hoursBeforeReservation: parseInt(selectedTime),
          enabled: reminderEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || t("reservation.reminder.configFailure")
        );
      }

      setOpen(false);
      onSendReminder?.();
    } catch (error) {
      console.error("❌ Error setting up reminder:", error);
      onError?.(
        error instanceof Error
          ? error
          : new Error(t("reservation.reminder.unknownError"))
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className={`w-full sm:w-auto border-2 font-semibold transition-all duration-200 ${
            reminderEnabled
              ? "border-green-600 text-green-700 bg-green-50 hover:bg-green-100"
              : "border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <span className="hidden sm:inline">
            {reminderEnabled
              ? t("reservation.reminder.modifyReminder")
              : t("reservation.reminder.emailReminder")}
          </span>
          <span className="sm:hidden">
            {reminderEnabled
              ? t("reservation.reminder.modify")
              : t("reservation.reminder.reminder")}
          </span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-w-[95vw] sm:max-w-lg rounded-xl sm:rounded-2xl border-2 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-50">
            <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-2 sm:p-3 shadow-lg">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>

          <AlertDialogTitle className="text-center text-xl sm:text-2xl font-bold text-gray-900 px-2">
            {t("reservation.reminder.configureEmailReminder")}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center text-sm sm:text-base text-gray-600 leading-relaxed px-2">
            {t("reservation.reminder.receiveEmailReminder")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4 px-4 sm:px-6">
          {/* Switch */}
          <div className="flex items-center justify-between rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50 p-3 sm:p-4 gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 flex-shrink-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <Label
                  htmlFor="reminder-switch"
                  className="text-sm sm:text-base font-semibold text-gray-900 cursor-pointer block"
                >
                  {t("reservation.reminder.enableReminder")}
                </Label>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {t("reservation.reminder.receiveEmail")}
                </p>
              </div>
            </div>
            <Switch
              id="reminder-switch"
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              className="data-[state=checked]:bg-green-500 flex-shrink-0"
              disabled={isLoading}
            />
          </div>

          {/* Delay selection */}
          {reminderEnabled && (
            <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <span className="line-clamp-2">
                  {t("reservation.reminder.whenToReceive")}
                </span>
              </div>

              <RadioGroup
                value={selectedTime}
                onValueChange={setSelectedTime}
                className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3"
                disabled={isLoading}
              >
                {REMINDER_OPTIONS.map((option) => (
                  <div key={option.value} className="relative">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center justify-center rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white p-2 sm:p-3 text-xs sm:text-sm font-medium text-gray-700 hover:bg-green-50 hover:border-green-300 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 peer-data-[state=checked]:text-green-700 transition-all cursor-pointer min-h-[44px] sm:min-h-[48px]"
                    >
                      <span className="text-center leading-tight">
                        {option.label}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Additional Info */}
          {reminderEnabled && (
            <div className="rounded-lg sm:rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-50/50 p-3 sm:p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 rounded-lg bg-green-100 p-1.5 sm:p-2">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-green-900">
                    {t("reservation.reminder.whatContainsTitle")}
                  </p>
                  <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                    {t("reservation.reminder.whatContainsDesc")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              disabled={isSending}
              className="w-full sm:flex-1 rounded-lg sm:rounded-xl border-2 hover:bg-gray-50 transition-colors h-11 sm:h-auto"
            >
              {t("reservation.reminder.cancel")}
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              disabled={isSending || isLoading}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className={`w-full sm:flex-1 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 h-11 sm:h-auto ${
                reminderEnabled
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  : "bg-gray-400 hover:bg-gray-500"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">
                    {t("reservation.reminder.configuring")}
                  </span>
                  <span className="sm:hidden">
                    {t("reservation.reminder.sending")}
                  </span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {reminderEnabled
                      ? t("reservation.reminder.configure")
                      : t("reservation.reminder.confirm")}
                  </span>
                  <span className="sm:hidden">
                    {reminderEnabled
                      ? t("reservation.reminder.configure")
                      : t("reservation.reminder.confirm")}
                  </span>
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
