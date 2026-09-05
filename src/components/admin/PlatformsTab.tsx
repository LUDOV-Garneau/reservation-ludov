"use client";

import { TabsContent } from "@/components/ui/tabs";
import PlatformsManager from "@/components/admin/platforms/PlatformsManager";

export default function PlatformsTab() {
  return (
    <TabsContent value="platforms">
      <PlatformsManager />
    </TabsContent>
  );
}
