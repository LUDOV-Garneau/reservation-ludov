"use client";

import { useState } from "react";
import UsersTable from "@/components/admin/components/UsersTable";
import UsersForm from "@/components/admin/components/UsersForm";
import AddUserForm from "@/components/admin/components/AddUserForm";

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

  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  return (
    <TabsContent value="users">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>
            <UsersForm onSuccess={handleRefresh}/>
            <AddUserForm onSuccess={handleRefresh}/>
            <UsersTable refreshKey={refreshKey}/>
          </CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
