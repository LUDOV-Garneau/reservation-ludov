"use client";

import { TabsContent } from "@/components/ui/tabs";
import ConsolePhotosGrid from "@/components/admin/console-photos/ConsolePhotosGrid";

export default function ConsolePhotosTab() {
  return (
    <TabsContent value="consolePhotos">
      <ConsolePhotosGrid />
    </TabsContent>
  );
}
