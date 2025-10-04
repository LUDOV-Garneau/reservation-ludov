"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function StationsTab() {
  const t = useTranslations();

  return (
    <TabsContent value="stations">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.stations.title")}</CardTitle>
          <CardDescription>Ajouter la gestion des stations.</CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
