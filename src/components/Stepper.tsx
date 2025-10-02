"use client";

import { useReservation } from "@/context/ReservationContext";
import { useTranslations } from "next-intl";

export default function Stepper() {
  const t = useTranslations();
  const { currentStep, setCurrentStep } = useReservation();

  const steps = [
    t("reservation.steps.consoleSelection"),
    t("reservation.steps.gamesSelection"),
    t("reservation.steps.accessoriesSelection"),
    t("reservation.steps.dateSelection"),
    t("reservation.steps.courseSelection"),
    t("reservation.steps.confirm"),
  ];

  return (
    <div className="w-full py-4 sm:py-8">
      <div className="overflow-x-auto px-4 py-3">
        <div
          className="flex items-center justify-between relative min-w-max"
          style={{ minWidth: "800px" }}
        >
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 ease-in-out"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div
                key={index}
                className="flex flex-col items-center relative max-w-[8rem]"
                style={{ minHeight: "5.5rem" }}
              >
                <button
                  onClick={() => {
                    if (stepNumber < currentStep) {
                      setCurrentStep(stepNumber);
                    }
                  }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center 
                    text-sm font-semibold transition-all duration-200 z-10
                    ${
                      isActive
                        ? "bg-cyan-400 text-white shadow-lg"
                        : isCompleted
                        ? "bg-cyan-400 text-white hover:bg-cyan-500"
                        : "bg-gray-200 text-gray-500"
                    }
                    ${
                      stepNumber < currentStep
                        ? "cursor-pointer"
                        : "cursor-not-allowed"
                    }
                  `}
                  disabled={stepNumber >= currentStep}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </button>

                <span
                  className={`
                    mt-2 text-xs text-center max-w-32 leading-tight px-2
                    ${
                      isActive
                        ? "text-cyan-600 font-medium"
                        : isCompleted
                        ? "text-cyan-600"
                        : "text-gray-600"
                    }
                  `}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
