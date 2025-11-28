"use client";

import {
  Calendar,
  CalendarSearch,
  ChevronLeft,
  Clock,
  LogIn,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { TutorialArgs, TutorialCardsProps } from "@/types/docs";
import TutorialCards from "@/components/admin/tutorials/tutorialCards";
import Link from "next/link";

const TutoPage: TutorialCardsProps[] = [
  {
    title: "Se connecter à la plateforme",
    description: "Apprenez à vous connecter à la plateforme LUDOV.",
    args: TutorialArgs.LOGIN,
    isAdminRessource: false,
    icons: LogIn,
  },
  {
    title: "Effectuer une réservation",
    description: "Découvrez comment effectuer des réservations.",
    args: TutorialArgs.RESERVATIONS,
    isAdminRessource: false,
    icons: Calendar,
  },
  {
    title: "Consulter ses réservations",
    description: "Gérez vos réservations en toute simplicité.",
    args: TutorialArgs.CONSULT_RESERVATIONS,
    isAdminRessource: false,
    icons: CalendarSearch,
  },
  {
    title: "Activer les rappels de réservation",
    description: "Optimisez la gestion des disponibilités.",
    args: TutorialArgs.REMINDERS,
    isAdminRessource: false,
    icons: Clock,
  },
];

export default function TutorialContent() {
  const t = useTranslations("docs");

  return (
    <div className="mx-2 my-4 sm:mx-10 sm:my-6">
      <div className="flex flex-col bg-[white] px-4 py-6 sm:px-10 sm:py-8 rounded-xl border border-gray-200 w-full">
        <Link
          href="/"
          className="flex items-center gap-1 text-gray-600 hover:text-cyan-500 transition-colors w-fit group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Retour à l&apos;accueil</span>
        </Link>
        <div className="w-full mx-auto mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">
          <div className="flex flex-col gap-1 sm:gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {t("subtitle")}
            </p>
          </div>
          <div className="grid lg:grid-cols-4 md:grid-cols-1 gap-10">
            {TutoPage.map((tuto) => (
              <TutorialCards key={tuto.title} {...tuto} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
