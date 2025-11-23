"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, MapPin, Clock, BookOpen } from "lucide-react";

const TABS = [
  { value: "users", translationKey: "admin.users.title", icon: Users },
  { value: "reservations", translationKey: "admin.reservations.title", icon: Calendar },
  { value: "stations", translationKey: "admin.stations.title", icon: MapPin },
  { value: "availabilities", translationKey: "admin.availabilities.title", icon: Clock },
  { value: "cours", translationKey: "admin.cours.title", icon: BookOpen },
] as const;

export default function AdminTabs() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get("tab") || "users";

  return (
    <div className="overflow-auto pb-4">
      <TabsList className="inline-flex h-auto w-auto bg-transparent p-0 gap-1">
        {TABS.map(({ value, translationKey, icon: Icon }) => {
          const isActive = activeTab === value;
          
          return (
            <TabsTrigger
              key={value}
              value={value}
              className="relative px-6 py-3 rounded-none bg-transparent border-0 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-[#02dcde]' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium transition-colors ${isActive ? 'text-[#02dcde]' : 'text-gray-600 hover:text-gray-900'}`}>
                  {t(translationKey)}
                </span>
              </div>
              
              <div 
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#02dcde] transition-all duration-300 ${
                  isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              />
            </TabsTrigger>
          );
        })}
      </TabsList>
      
      <div className="hidden lg:block w-full h-px bg-gray-200 -mt-px" />
    </div>
  );
}