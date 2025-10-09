"use client";

import Stepper from "@/components/reservation/Stepper";
import { HourglassIcon } from "lucide-react";
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

import ConsoleSelection from "@/components/reservation/ConsoleSelection"
import GamesSelection from "@/components/reservation/GamesSelection"
import AccessoriesSelection from "@/components/reservation/AccessoriesSelection"
import CourseSelection from "@/components/reservation/CourseSelection";
import ConfirmReservation from "@/components/reservation/ConfirmReservation";
import { useTranslations } from "next-intl";

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

    const t = useTranslations();

    const formatTimeRemaining = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    };

    const handleBackHome = () => {
        resetTimer();
        window.location.href = "/";
    };

    const steps = [
      {
        id: 1,
        component: <ConsoleSelection />
      },
      {
        id: 2,
        component: <GamesSelection />
      },
      {
        id: 3,
        component: <AccessoriesSelection />
      },
      {
        id: 4,
        component: <CourseSelection />
      },
      {
        id: 5,
        component: <ConfirmReservation />
      }
    ];


  const currentStepConfig = steps.find((step) => step.id === currentStep);

  if (isReservationCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            {t("reservation.layout.timeElapsed")}
          </h1>
          <p className="text-lg text-red-700 mb-6">
            {t("reservation.layout.reservationCancelled")}
          </p>
          <Button
            onClick={handleBackHome}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            {t("reservation.layout.goBackHome")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-5">
      <div className="m-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                {t("reservation.layout.home")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t("reservation.layout.newReservation")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-5 text-3xl decoration-cyan-400 underline underline-offset-8 md:hidden">
        <h1>{t("reservation.layout.newReservation")}</h1>
      </div>

      <div className="mb-10">
        <Stepper />
      </div>

      <div className="container-page">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:inline-block text-4xl md:text-5xl underline underline-offset-8 decoration-3 decoration-cyan-400">
            {t("reservation.layout.newReservation")}
          </h1>

          {isTimerActive && (
            <div className="flex items-center gap-4 sticky md:mx-0 mx-auto">
              <div className="bg-gray-50/45 shadow-xl py-3 px-8 rounded-full flex items-center gap-5 sticky">
                <div className="flex gap-2 items-center">
                  <HourglassIcon
                    className={
                      timeRemaining < 300
                        ? "animate-pulse text-red-500"
                        : "text-gray-600"
                    }
                  />
                  <p
                    className={`text-2xl ${
                      timeRemaining < 300 ? "text-red-500 font-bold" : ""
                    }`}
                  >
                    {formatTimeRemaining(timeRemaining)}
                  </p>
                </div>
                <Button
                  variant={"destructive"}
                  className="rounded-full hover:bg-red-900"
                  onClick={() => {
                    cancelReservation();
                  }}
                >
                  {t("reservation.layout.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg my-8">
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
