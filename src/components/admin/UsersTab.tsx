"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function UsersTab() {
  const t = useTranslations();

  return (
    <TabsContent value="users">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>
            Ajouter la gestion des utilisateurs.
          </CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
