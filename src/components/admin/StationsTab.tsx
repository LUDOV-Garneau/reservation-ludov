"use client";

import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import StationsTable from "@/components/admin/stations/StationsTable";


export default function StationsTab() {
  const t = useTranslations();

  return (
    <TabsContent value="stations">
      <StationsTable />
    </TabsContent>
  );
}
