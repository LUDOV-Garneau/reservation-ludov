"use client";

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

  return (
    <TabsContent value="users">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>
            <UsersForm />
            <AddUserForm />
            <UsersTable />
          </CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
