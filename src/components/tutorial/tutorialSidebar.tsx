// TutorialSidebar.tsx - Garde ta structure, améliore juste les styles
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const items = [
  {
    title: "Introduction",
    href: "/tutorials/introduction",
  },
  {
    title: "Getting Started",
    href: "/tutorials/getting-started",
  },
];

export function TutorialSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="floating">
      <SidebarHeader className="border-b border-gray-200 py-6">
        <Link
          href="/admin?tab=tutorials"
          className="mb-6 flex items-center gap-1 text-gray-600 hover:text-cyan-500 transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Retour à la liste</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 px-3">Tutoriels</h1>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className="hover:bg-cyan-50 hover:text-cyan-700 transition-colors rounded-lg"
                  >
                    <a
                      href={item.href}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-500 text-center">Documentation v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
