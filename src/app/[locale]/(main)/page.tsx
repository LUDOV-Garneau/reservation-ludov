"use client";

import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import { useTranslations } from "next-intl";
import Link from "next/link";

// export const metadata: Metadata = {
//   title: "Module de réservation LUDOV",
//   description:
//     "Réservez une station avec une console et des jeux vidéo dans le cadre de vos études universitaires à l'université de Montréal.",
// };

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl">
      <Link href="/reservation">
        <Button>{t("reservation.new")}</Button>
      </Link>
    </div>
  );
}
