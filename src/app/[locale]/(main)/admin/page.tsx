import AdminTabs from "@/components/admin/AdminTabs";
import ReservationsTab from "@/components/admin/ReservationsTab";
import StationsTab from "@/components/admin/StationsTab";
import UsersTab from "@/components/admin/UsersTab";
import { Tabs } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="mx-10 my-6">
      <div className="flex flex-col gap-6 bg-[white] min-h-screen px-10 py-6 rounded-2xl box-border w-full">
        <Tabs defaultValue="users">
          <AdminTabs />
          <UsersTab />
          <ReservationsTab />
          <StationsTab />
        </Tabs>
      </div>
    </div>
  );
}
