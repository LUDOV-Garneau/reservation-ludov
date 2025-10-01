"use client"

import Stepper from "@/components/Stepper"
import { HourglassIcon } from "lucide-react"
import { useReservation } from "@/context/ReservationContext"
import { Button } from "@/components/ui/button"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import ConsoleSelection from "@/components/reservation/ConsoleSelection"
import Calendrier from "@/components/reservation/Calendrier"
import ConfirmerReservation from "@/components/reservation/ConfirmerReservation"

export default function ReservationLayout() {

    const { 
        timeRemaining, 
        isTimerActive, 
        isReservationCancelled,
        currentStep,
        setCurrentStep,
        resetTimer
    } = useReservation();

    const formatTimeRemaining = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleBackHome = () => {
        resetTimer();
        window.location.href = "/";
    };

    const steps = [
      {
        id: 1,
        component: <ConsoleSelection />
      }
    ];


  const currentStepConfig = steps.find(step => step.id === currentStep);

  if (isReservationCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Temps écoulé</h1>
          <p className="text-lg text-red-700 mb-6">
            Votre réservation a été annulée, car le délai de 15 minutes a été dépassé.
          </p>
          <Button 
            onClick={handleBackHome}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >Go back home</Button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen mt-5">
      <div className="m-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nouvelle réservation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="mx-5 text-3xl decoration-cyan-400 underline underline-offset-8 md:hidden">
        <h1>Nouvelle réservation</h1>
      </div>
      
      <div className="mb-10">
        <Stepper/>
      </div>
      
      <div className="container-page">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:inline-block text-4xl md:text-5xl underline underline-offset-8 decoration-3 decoration-cyan-400">
            Nouvelle réservation
          </h1>
          
          {isTimerActive && (
            <div className="flex items-center gap-4 sticky md:mx-0 mx-auto">
              <div className="bg-gray-50/45 shadow-xl py-3 px-8 rounded-full flex items-center gap-2 sticky">
                <HourglassIcon 
                  className={timeRemaining < 300 ? "animate-pulse text-red-500" : "text-gray-600"} 
                />
                <p className={`text-2xl ${timeRemaining < 300 ? "text-red-500 font-bold" : ""}`}>
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg my-8">
          {currentStepConfig ? currentStepConfig.component : (
            <div className="text-center py-12">
              <p className="text-gray-500">Étape non trouvée</p>
              <Button onClick={() => setCurrentStep(1)} className="mt-4">
                Retour au début
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}