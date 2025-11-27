"use client";

import { Flag, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TutorialCards from "./tutorialCards";

const TUTOS = [
  {
    title: "Getting Started",
    description: "Learn the basics of using our platform.",
    link: "/tutorials/getting-started",
    icons: Flag,
  },
  {
    title: "Advanced Features",
    description: "Explore the advanced functionalities available.",
    link: "/tutorials/advanced-features",
    icons: Settings,
  },
  {
    title: "Customization",
    description: "Discover how to customize your experience.",
    link: "/tutorials/customization",
    icons: Settings,
  },
  {
    title: "Troubleshooting",
    description: "Find solutions to common issues.",
    link: "/tutorials/troubleshooting",
    icons: Flag,
  },
  {
    title: "Best Practices",
    description: "Learn the best practices for optimal use.",
    link: "/tutorials/best-practices",
    icons: Settings,
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
