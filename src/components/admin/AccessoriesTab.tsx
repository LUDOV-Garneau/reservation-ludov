"use client";

import { TabsContent } from "@/components/ui/tabs";
import AccessoriesTable from "@/components/admin/accessoires/AccessoriesTable";

export default function AccessoriesTab() {
  return (
    <TabsContent value="accessories">
      <AccessoriesTable />
    </TabsContent>
  );
}
