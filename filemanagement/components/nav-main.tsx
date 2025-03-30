"use client"
import { AudioWaveform, ChevronRight, Command, FolderPlusIcon, GalleryVerticalEnd, PlusCircle, type LucideIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { Button } from "./ui/button"

const data = {
    teams: [
    {
      name: "Acme Inc",
      plan: "Workspace",
      color: "#1D4ED8", // Biru Tua (Royal Blue)
    },
    {
      name: "Acme Corp.",
      plan: "Workspace",
      color: "#34D399", // Hijau Mint
    },
    {
      name: "Evil Corp.",
      plan: "Workspace",
      color: "#EC4899",
    },
    {
      name: "Alpha Tech",
      plan: "Workspace",
      color: "#F59E0B", // Kuning Terang
    },
    {
      name: "Beta System",
      plan: "Workspace",
      color: "#3B82F6", 
    },
  ],
}
export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <TeamSwitcher teams={data.teams} />
      <SidebarGroupLabel className="">Main Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items && item.items.length > 0 ? (
              <Collapsible
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <div>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span className="flex-1">{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem  key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                            {subItem.icon && <subItem.icon fill="white"/>}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}

                      <Button className=" h-6 text-xs w-20 gap-1 text-white bg-white/10 hover:bg-white/20"><PlusCircle></PlusCircle> Tambah</Button>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ) : (
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}