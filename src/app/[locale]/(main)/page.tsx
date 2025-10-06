"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";

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
