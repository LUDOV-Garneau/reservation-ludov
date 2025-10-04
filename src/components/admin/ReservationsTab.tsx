"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function ReservationsTab() {
  const t = useTranslations();

  return (
    <TabsContent value="reservations">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reservations.title")}</CardTitle>
          <CardDescription>
            Ajouter la gestion des réservations.
          </CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
