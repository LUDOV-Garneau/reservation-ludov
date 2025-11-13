"use client";

import ReservationTable from "@/components/admin/reservations/ReservationTable";
import { TabsContent } from "@/components/ui/tabs";

export default function ReservationsTab() {
  return (
    <TabsContent value="reservations">
      <ReservationTable />
    </TabsContent>
  );
}
