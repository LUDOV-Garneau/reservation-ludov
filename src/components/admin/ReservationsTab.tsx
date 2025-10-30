"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import ReservationsTable from "@/components/admin/components/ReservationTable"

export default function ReservationsTab() {
  const t = useTranslations();

  return (
    <TabsContent value="reservations">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reservations.title")}</CardTitle>
          <CardDescription>
            <ReservationsTable refreshKey={0} />
          </CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
