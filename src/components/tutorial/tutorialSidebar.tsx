import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
    <Sidebar variant="floating">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroupLabel>
          {" "}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tutoriels
          </h1>
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <a href={item.href}>
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
