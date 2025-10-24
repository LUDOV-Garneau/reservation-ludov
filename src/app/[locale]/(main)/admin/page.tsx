import AdminTabs from "@/components/admin/AdminTabs";
import AvailabilitiesTab from "@/components/admin/availabilities/AvailabilitiesTab";
import ReservationsTab from "@/components/admin/ReservationsTab";
import StationsTab from "@/components/admin/StationsTab";
import UsersTab from "@/components/admin/UsersTab";
import { Tabs } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="mx-2 my-4 sm:mx-10 sm:my-6">
      <div className="flex flex-col gap-4 sm:gap-6 bg-[white] min-h-screen px-2 py-2 sm:px-10 sm:py-6 rounded-2xl box-border w-full">
        <Tabs defaultValue="users">
          <AdminTabs />
          <UsersTab />
          <ReservationsTab />
          <StationsTab />
          <AvailabilitiesTab />
        </Tabs>
      </div>
    </div>
  );
}
