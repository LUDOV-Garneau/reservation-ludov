"use client";

import AvailabilitiesManager from "@/components/admin/availabilities/AvailabilitiesManager";
import { TabsContent } from "@/components/ui/tabs";

export default function AvailabilitiesTab() {
  return (
    <TabsContent value="availabilities">
      <AvailabilitiesManager />
    </TabsContent>
  );
}
