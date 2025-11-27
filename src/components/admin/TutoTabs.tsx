"use client";

import { TabsContent } from "@/components/ui/tabs";
import TutorialContent from "./tutorials/TutorialContent";

export default function ReservationsTab() {
  return (
    <TabsContent value="tutorials">
      <TutorialContent />
    </TabsContent>
  );
}
