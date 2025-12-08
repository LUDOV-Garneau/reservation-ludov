"use client";

import Stepper from "@/components/reservation/Stepper";
import { HourglassIcon, XCircle } from "lucide-react";
import { useReservation } from "@/context/ReservationContext";
import { Button } from "@/components/ui/button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import ConsoleSelection from "@/components/reservation/ConsoleSelection";
import GamesSelection from "@/components/reservation/GamesSelection";
import AccessoriesSelection from "@/components/reservation/AccessoriesSelection";
import CourseSelection from "@/components/reservation/CourseSelection";
import ConfirmReservation from "@/components/reservation/ConfirmReservation";
import { useTranslations } from "next-intl";
import DateSelection from "./DateSelection";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReservationLayout() {
  const {
    timeRemaining,
    isTimerActive,
    isReservationCancelled,
    currentStep,
    setCurrentStep,
    resetTimer,
    cancelReservation,
  } = useReservation();
  const router = useRouter();
  const t = useTranslations();

  const [reservationCancelledManually, setReservationCancelledManually] =
    useState(false);

  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleBackHome = () => {
    resetTimer();
    router.push("/");
  };

  const steps = [
    {
      id: 1,
      component: <ConsoleSelection />,
    },
    {
      id: 2,
      component: <GamesSelection />,
    },
    {
      id: 3,
      component: <AccessoriesSelection />,
    },
    {
      id: 4,
      component: <DateSelection />,
    },
    {
      id: 5,
      component: <CourseSelection />,
    },
    {
      id: 6,
      component: <ConfirmReservation />,
    },
  ];

  const currentStepConfig = steps.find((step) => step.id === currentStep);

  if (isReservationCancelled) {
    return (
      <div className="max-w-3xl mx-auto sm:p-6 mt-20">
        <div className="bg-[white] rounded-2xl shadow-lg px-10 py-10 text-center border border-gray-100">
          <div className="flex justify-center mb-6">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>

          <h1 className="text-4xl font-bold mb-4">
            {reservationCancelledManually
              ? t("reservation.layout.manuallyCancelled")
              : t("reservation.layout.timeElapsed")}
          </h1>

          {!reservationCancelledManually && (
            <p className="text-gray-600 mb-6 text-lg">
              {t("reservation.layout.reservationCancelled")}
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Button
              variant="outline"
              className="px-6 py-3"
              onClick={handleBackHome}
            >
              {t("reservation.layout.goBackHome")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-5">
      {isTimerActive && (
        <div className="mx-5 flex flex-row items-center justify-center sm:justify-end">
          <div className="bg-[white] backdrop-blur-md border border-gray-200 shadow-sm py-2 px-4 md:py-2.5 md:px-6 rounded-full flex items-center gap-3 md:gap-5 transition-all duration-300">
            <div className="flex gap-2 items-center">
              <HourglassIcon
                className={`w-4 h-4 md:w-5 md:h-5 ${timeRemaining < 300
                  ? "animate-pulse text-red-500"
                  : "text-gray-500"
                  }`}
              />
              <p
                className={`font-mono text-base md:text-lg font-medium tabular-nums ${timeRemaining < 300 ? "text-red-500" : "text-gray-700"
                  }`}
              >
                {formatTimeRemaining(timeRemaining)}
              </p>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden md:block" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 p-1 md:px-3 h-8 md:h-9"
              onClick={() => {
                setReservationCancelledManually(true);
                cancelReservation();
              }}
            >
              <span className="sr-only md:not-sr-only">
                {t("reservation.layout.cancel")}
              </span>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      <Stepper />

      <div className="container-page">
        <div className="rounded-lg mb-8">
          {currentStepConfig ? (
            currentStepConfig.component
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {t("reservation.layout.stepNotFound")}
              </p>
              <Button onClick={() => setCurrentStep(1)} className="mt-4">
                {t("reservation.layout.backToStart")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
