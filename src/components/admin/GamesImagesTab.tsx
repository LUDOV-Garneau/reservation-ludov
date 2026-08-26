"use client";

import { TabsContent } from "@/components/ui/tabs";
import GamesImagesTable from "@/components/admin/games/GamesImagesTable";

export default function GamesImagesTab() {
  return (
    <TabsContent value="games">
      <GamesImagesTable />
    </TabsContent>
  );
}
