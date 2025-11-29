"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { TutorialSidebarProps } from "@/types/docs";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { NavMain } from "./sidebar-nav-main";
import { useMemo } from "react";
import { buildToc } from "@/lib/markdown";
import { useTranslations } from "next-intl";

export function TutorialSidebar({
  headings,
  adminRessources,
}: TutorialSidebarProps) {
  const t = useTranslations("docs");
  const toc = useMemo(() => buildToc(headings), [headings]);

  return (
    <Sidebar collapsible="offcanvas" variant="floating">
      <SidebarHeader className="border-b border-gray-200 py-6">
        <Link
          href={adminRessources ? `/admin?tab=tutorials` : `/docs/bibliotheque`}
          className="mb-6 flex items-center gap-1 text-gray-600 hover:text-cyan-500 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">
            {t("sidebar.goBackToLibrary")}
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 px-3">
          {t("sidebar.title")}
        </h1>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <NavMain items={toc} />
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-500 text-center">Documentation v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
