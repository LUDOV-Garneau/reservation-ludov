"use client";

import StationsManager from "@/components/admin/stations/StationsManager";
import { TabsContent } from "@/components/ui/tabs";

export default function StationsTab() {
  return (
    <TabsContent value="stations">
      <StationsManager />
    </TabsContent>
  );
}
