"use client";

import { NavMainProps } from "@/types/tuto";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";

export function NavMain({ items }: NavMainProps) {
  console.log(items);
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Contenu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(
          (section) =>
            section.depth !== 1 &&
            (section.children.length !== 0 ? (
              <Collapsible
                key={section.id}
                asChild
                defaultOpen={section.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={section.text} className="h-fit">
                      {section.text}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {section.children?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.id}>
                          <SidebarMenuSubButton
                            asChild
                            className="w-full h-fit"
                          >
                            <a
                              href={`#${section.id}`}
                              className={`block text-sm ${
                                section.isActive && section.id === subItem.id
                                  ? "text-cyan-700 font-semibold"
                                  : "text-gray-700"
                              } hover:text-cyan-600 py-1`}
                            >
                              {subItem.text}
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={section.id}>
                <SidebarMenuButton
                  asChild
                  className={`w-full h-fit ${
                    section.isActive
                      ? "text-cyan-700 font-semibold"
                      : "text-gray-700"
                  } hover:text-cyan-600 py-1`}
                >
                  <a href={`#${section.id}`} className="block text-sm">
                    {section.text}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
