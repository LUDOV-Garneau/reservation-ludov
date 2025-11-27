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

import TutorialCards from "./tutorialCards";

const TUTOS = [
  {
    title: "Gestion des utilisateurs",
    description: "Apprenez à gérer les utilisateurs efficacement.",
    link: "/tutorials/user-management",
    icons: User,
  },
  {
    title: "Gestion des réservations",
    description: "Découvrez comment protéger vos données.",
    link: "/tutorials/security-privacy",
    icons: Calendar,
  },
  {
    title: "Gestion des stations",
    description: "Maîtrisez la gestion des stations.",
    link: "/tutorials/station-management",
    icons: MapPin,
  },
  {
    title: "Gestion des disponibilités",
    description: "Optimisez la gestion des disponibilités.",
    link: "/tutorials/availability-management",
    icons: Clock,
  },
  {
    title: "Gestion des cours",
    description: "Apprenez à gérer les cours efficacement.",
    link: "/tutorials/course-management",
    icons: BookOpenText,
  },
  {
    title: "Gestion de la politique de confidentialité",
    description: "Personnalisez les paramètres de votre application.",
    link: "/tutorials/general-configuration",
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
      <div className="grid lg:grid-cols-4 md:grid-cols-1 gap-10">
        {TUTOS.map((tuto) => (
          <TutorialCards key={tuto.title} tuto={tuto} />
        ))}
      </div>
    </div>
  );
}
