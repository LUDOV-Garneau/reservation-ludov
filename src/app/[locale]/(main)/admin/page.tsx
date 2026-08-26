"use client";

import React, { Suspense, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import AdminTabs from "@/components/admin/AdminTabs";
import { Tabs } from "@/components/ui/tabs";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { PageShell, BackLink } from "@/components/layout/PageShell";
import PoliciesTab from "@/components/admin/PoliciesTabs";

const UsersTab = dynamic(() => import("@/components/admin/UsersTab"), {
  loading: () => <TabLoader />,
});
const ReservationsTab = dynamic(
  () => import("@/components/admin/ReservationsTab"),
  {
    loading: () => <TabLoader />,
  }
);
const StationsTab = dynamic(() => import("@/components/admin/StationsTab"), {
  loading: () => <TabLoader />,
});
const AccessoriesTab = dynamic(
  () => import("@/components/admin/AccessoriesTab"),
  {
    loading: () => <TabLoader />,
  }
);
const ConsolePhotosTab = dynamic(
  () => import("@/components/admin/ConsolePhotosTab"),
  {
    loading: () => <TabLoader />,
  }
);
const GamesImagesTab = dynamic(
  () => import("@/components/admin/GamesImagesTab"),
  {
    loading: () => <TabLoader />,
  }
);
const EmailsTab = dynamic(() => import("@/components/admin/EmailsTab"), {
  loading: () => <TabLoader />,
});
const AvailabilitiesTab = dynamic(
  () => import("@/components/admin/availabilities/AvailabilitiesTab"),
  {
    loading: () => <TabLoader />,
  }
);
const TutoTabs = dynamic(() => import("@/components/admin/TutoTabs"), {
  loading: () => <TabLoader />,
});
const CoursTab = dynamic(() => import("@/components/admin/CoursTab"), {
  loading: () => <TabLoader />,
});

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
    </div>
  );
}

function AdminContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlTab = searchParams.get("tab") || "users";

  const [activeTab, setActiveTab] = React.useState(urlTab);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "users":
        return <UsersTab />;
      case "reservations":
        return <ReservationsTab />;
      case "stations":
        return <StationsTab />;
      case "accessories":
        return <AccessoriesTab />;
      case "consolePhotos":
        return <ConsolePhotosTab />;
      case "games":
        return <GamesImagesTab />;
      case "emails":
        return <EmailsTab />;
      case "availabilities":
        return <AvailabilitiesTab />;
      case "cours":
        return <CoursTab />;
      case "policies":
        return <PoliciesTab />;
      case "tutorials":
        return <TutoTabs />;
      default:
        return <UsersTab />;
    }
  };

  return (
    <PageShell>
      <BackLink href="/" label="Retour à l'accueil" />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <AdminTabs />

        <div className="mt-4 relative">
          {isPending && (
            <div className="absolute top-0 right-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
            </div>
          )}
          <div
            className={`transition-opacity duration-150 ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
          >
            {renderActiveTab()}
          </div>
        </div>
      </Tabs>
    </PageShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="text-gray-500 text-sm">Chargement...</p>
          </div>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
