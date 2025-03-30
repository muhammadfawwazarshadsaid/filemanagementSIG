"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Folder,
  FolderArchive,
  FolderDot,
  FolderPlus,
  FolderPlusIcon,
  FolderTree,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  LayoutDashboardIcon,
  LayoutPanelTop,
  LucideLayoutDashboard,
  Map,
  PieChart,
  ScissorsSquareDashedBottom,
  Settings2,
  SquareDashedBottom,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SemenIndonesia } from "./semenindonesia"
import { Button } from "./ui/button"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      plan: "Workspace",
    },
    {
      name: "Acme Corp.",
      plan: "Workspace",
    },
    {
      name: "Evil Corp.",
      plan: "Workspace",
    },
  ],
  navMain: [
    {
      title: "Folder",
      url: "#",
      icon: FolderTree,
      items: [
        {
          title: "Genesis",
          url: "#",
          icon: Folder,
        },
        {
          title: "Explorer",
          url: "#",
          icon: Folder,
        },
        {
          title: "Quantum",
          url: "#",
          icon: Folder,
        },
      ],
    },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "General",
    //       url: "#",
    //     },
    //     {
    //       title: "Team",
    //       url: "#",
    //     },
    //     {
    //       title: "Billing",
    //       url: "#",
    //     },
    //     {
    //       title: "Limits",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SemenIndonesia teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      {/* <SidebarRail /> */}
    </Sidebar>
  )
}
