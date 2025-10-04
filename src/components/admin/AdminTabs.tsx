"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function AdminTabs() {
  const t = useTranslations();

  return (
    <TabsList className="mb-6">
      <TabsTrigger value="users">{t("admin.users.title")}</TabsTrigger>
      <TabsTrigger value="reservations">
        {t("admin.reservations.title")}
      </TabsTrigger>
      <TabsTrigger value="stations">{t("admin.stations.title")}</TabsTrigger>
    </TabsList>
  );
}
