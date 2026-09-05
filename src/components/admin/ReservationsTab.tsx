"use client";

import ReservationsManager from "@/components/admin/reservations/list/ReservationsManager";
import { TabsContent } from "@/components/ui/tabs";

export default function ReservationsTab() {
  return (
    <TabsContent value="reservations">
      <ReservationsManager />
    </TabsContent>
  );
}
