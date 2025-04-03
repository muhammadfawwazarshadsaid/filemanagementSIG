"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"

export function SemenIndonesia() {
  const { isMobile } = useSidebar()


  return (
    <div className="flex justify-center items-center">
      {/* <div className="border-4 border-white rounded-lg"> */}
        <Avatar className="h-8 w-12 lg:h-14 flex justify-center items-center m-0 p-0 gap-2">
          <AvatarImage className="h-8 object-cover rounded-sm" src="/logo.png" alt="logo" />
          <AvatarFallback className="object-cover gap-0" >SIG</AvatarFallback>
        </Avatar>
      {/* </div> */}
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-bold">SIG</span>
        <span className="truncate text-xs text-[oklch(0.985_0_0)]">Portal Manajemen Berkas</span>
      </div>
    </div>
  )
}
