"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function AdminTabs() {
  const t = useTranslations();

  return (
    <TabsList className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4 w-full h-auto p-0 bg-transparent">
      <TabsTrigger
        value="users"
        className="w-full sm:flex-1 justify-center py-3 px-4 rounded-lg border-2 bg-white data-[state=active]:border-[#02dcde] data-[state=active]:text-foreground data-[state=inactive]:border-gray-200 data-[state=inactive]:text-muted-foreground hover:border-[#02dcde] hover:text-[#02dcde] hover:shadow-sm transition-all"
      >
        {t("admin.users.title")}
      </TabsTrigger>
      <TabsTrigger
        value="reservations"
        className="w-full sm:flex-1 justify-center py-3 px-4 rounded-lg border-2 bg-white data-[state=active]:border-[#02dcde] data-[state=active]:text-foreground data-[state=inactive]:border-gray-200 data-[state=inactive]:text-muted-foreground hover:border-[#02dcde] hover:text-[#02dcde] hover:shadow-sm transition-all"
      >
        {t("admin.reservations.title")}
      </TabsTrigger>
      <TabsTrigger
        value="stations"
        className="w-full sm:flex-1 justify-center py-3 px-4 rounded-lg border-2 bg-white data-[state=active]:border-[#02dcde] data-[state=active]:text-foreground data-[state=inactive]:border-gray-200 data-[state=inactive]:text-muted-foreground hover:border-[#02dcde] hover:text-[#02dcde] hover:shadow-sm transition-all"
      >
        {t("admin.stations.title")}
      </TabsTrigger>
      <TabsTrigger
        value="availabilities"
        className="w-full sm:flex-1 justify-center py-3 px-4 rounded-lg border-2 bg-white data-[state=active]:border-[#02dcde] data-[state=active]:text-foreground data-[state=inactive]:border-gray-200 data-[state=inactive]:text-muted-foreground hover:border-[#02dcde] hover:text-[#02dcde] hover:shadow-sm transition-all"
      >
        {t("admin.availabilities.title")}
      </TabsTrigger>
    </TabsList>
  );
}
