"use client";

import {
  Book,
  BookOpenText,
  Calendar,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { TutorialArgs, TutorialCardsProps } from "@/types/docs";

import TutorialCards from "./tutorialCards";

const TutoPage: TutorialCardsProps[] = [
  {
    title: "Gestion des utilisateurs",
    args: TutorialArgs.USERS,
    isAdminRessource: true,
    icons: User,
  },
  {
    title: "Gestion des réservations",
    args: TutorialArgs.RESERVATIONS,
    isAdminRessource: true,
    icons: Calendar,
  },
  {
    title: "Gestion des stations",
    args: TutorialArgs.STATIONS,
    isAdminRessource: true,
    icons: MapPin,
  },
  {
    title: "Gestion des disponibilités",
    args: TutorialArgs.AVAILABILITIES,
    isAdminRessource: true,
    icons: Clock,
  },
  {
    title: "Gestion des cours",
    args: TutorialArgs.COURSES,
    isAdminRessource: true,
    icons: BookOpenText,
  },
  {
    title: "Gestion de la politique de confidentialité",
    args: TutorialArgs.PRIVACY_POLICY,
    isAdminRessource: true,
    icons: Book,
  },
];

export default function TutorialContent() {
  const t = useTranslations();

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("admin.tutorials.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("admin.tutorials.subtitle")}
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {TutoPage.map((tuto) => (
          <TutorialCards key={tuto.title} {...tuto} />
        ))}
      </div>
    </div>
  );
}
