"use client";

import { useState } from "react";
import UsersTable from "@/components/admin/components/UsersTable";
import { TabsContent } from "@/components/ui/tabs";

export default function UsersTab() {
  const [refreshKey] = useState(0);

  return (
    <TabsContent value="users">
      <UsersTable refreshKey={refreshKey} />
    </TabsContent>
  );
}
