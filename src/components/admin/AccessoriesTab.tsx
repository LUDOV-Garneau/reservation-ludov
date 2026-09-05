"use client";

import { TabsContent } from "@/components/ui/tabs";
import AccessoriesManager from "@/components/admin/accessoires/AccessoriesManager";

export default function AccessoriesTab() {
  return (
    <TabsContent value="accessories">
      <AccessoriesManager />
    </TabsContent>
  );
}
