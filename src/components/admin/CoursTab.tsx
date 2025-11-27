"use client";

import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import CoursTable from "@/components/admin/cours/CoursTable";


export default function CoursTab() {
  const t = useTranslations();

  return (
    <TabsContent value="cours">
      <CoursTable />
    </TabsContent>
  );
}
