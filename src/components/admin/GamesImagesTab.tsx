"use client";

import { TabsContent } from "@/components/ui/tabs";
import GamesImagesManager from "@/components/admin/games/GamesImagesManager";

export default function GamesImagesTab() {
  return (
    <TabsContent value="games">
      <GamesImagesManager />
    </TabsContent>
  );
}
