"use client";

import { useState } from "react";
import UsersTable from "@/components/admin/components/UsersTable";

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

  const [refreshKey] = useState(0);

  return (
    <TabsContent value="users">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>
            <UsersTable refreshKey={refreshKey}/>
          </CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
