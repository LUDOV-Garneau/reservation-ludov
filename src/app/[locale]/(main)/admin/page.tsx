"use client";

import React, { Suspense, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import AdminTabs from "@/components/admin/AdminTabs";
import { Tabs } from "@/components/ui/tabs";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import PoliciesTab from "@/components/admin/PoliciesTabs";

const UsersTab = dynamic(() => import("@/components/admin/UsersTab"), {
  loading: () => <TabLoader />
});
const ReservationsTab = dynamic(() => import("@/components/admin/ReservationsTab"), {
  loading: () => <TabLoader />
});
const StationsTab = dynamic(() => import("@/components/admin/StationsTab"), {
  loading: () => <TabLoader />
});
const AvailabilitiesTab = dynamic(() => import("@/components/admin/availabilities/AvailabilitiesTab"), {
  loading: () => <TabLoader />
});

function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02dcde]"></div>
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
      case "availabilities":
        return <AvailabilitiesTab />;
      case "cours":
        return (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Onglet Cours - En développement</p>
            </div>
          </div>
        );
      case "policies":
        return <PoliciesTab />;
      default:
        return <UsersTab />;
    }
  };

  return (
    <div className="mx-2 my-4 sm:mx-10 sm:my-6">
      <div className="flex flex-col bg-[white] min-h-screen px-4 py-6 sm:px-10 sm:py-8 rounded-xl border border-gray-200 w-full">
        <Link 
          href="/" 
          className="mb-6 flex items-center gap-1 text-gray-600 hover:text-[#02dcde] transition-colors w-fit group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-sm font-medium">Retour à l&apos;accueil</span>
        </Link>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <AdminTabs />
          
          <div className="mt-4 relative">
            {isPending && (
              <div className="absolute top-0 right-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#02dcde]"></div>
              </div>
            )}
            <div className={`transition-opacity duration-150 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
              {renderActiveTab()}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02dcde]"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
}