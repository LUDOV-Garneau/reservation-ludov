"use client";

import UsersTable from "@/components/admin/components/UsersTable";
import { TabsContent } from "@/components/ui/tabs";

export default function UsersTab() {
  return (
    <TabsContent value="users">
      <UsersTable />
    </TabsContent>
  );
}
