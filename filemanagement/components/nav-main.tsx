// src/components/nav-main.tsx
"use client"
import { ChevronRight, Folder, FolderPlus, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"; // Sesuaikan path
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
} from "@/components/ui/sidebar"; // Sesuaikan path UI Anda
import { Button } from "./ui/button"; // Sesuaikan path

// Tipe data untuk item navigasi
export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: NavItem[];
}

export function NavMain({
    items,
    isLoadingFolders, // Terima status loading folder
}: {
    items: NavItem[];
    isLoadingFolders?: boolean;
}) {
    // Fungsi untuk render tombol tambah (jika diperlukan)
    // const handleAddFolderClick = () => { console.log("Tambah folder clicked"); };

  return (
      
        <SidebarGroup>
            {/* Label Menu bisa dipindah ke AppSidebar jika TeamSwitcher di sana */}
            <SidebarGroupLabel className="">Main Menu</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {/* Hanya buat Collapsible jika item.items ADA (bukan null/undefined) */}
                        {Array.isArray(item.items) ? (
                            <Collapsible
                                asChild
                                defaultOpen={item.isActive || item.title === "Folder"} // Buka jika aktif atau itu "Folder"
                                className="group/collapsible"
                            >
                                <div className="w-full">
                                    <CollapsibleTrigger asChild className="w-full">
                                        <SidebarMenuButton tooltip={item.title}>
                                            {item.icon && <item.icon />}
                                            <span className="flex-1 truncate">{item.title}</span>
                                            {/* Loading atau Chevron */}
                                            {(item.title === "Folder" && isLoadingFolders) ? (
                                                 <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                                            ) : (
                                                 <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            )}
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {/* Pesan Loading/Kosong untuk Folder */}
                                            {(item.title === "Folder" && isLoadingFolders) && (
                                                <div className="px-3 py-2 text-xs text-gray-500 italic text-center">Memuat...</div>
                                            )}
                                            {(item.title === "Folder" && !isLoadingFolders && (!item.items || item.items.length === 0)) && (
                                                <div className="px-3 py-2 text-xs text-gray-500 italic text-center">Kosong</div>
                                            )}

                                            {/* Render Sub Item (Folder) */}
                                            {item.items && item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild>
                                                        {/* Ganti <a> dengan <Link> Next.js jika pakai App Router */}
                                                        <a href={subItem.url} className="flex items-center gap-2">
                                                            {subItem.icon && <subItem.icon fill="white" className="w-4 h-4 flex-shrink-0 text-white" />}
                                                            <span className="truncate">{subItem.title}</span>
                                                        </a>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                             {/* Tombol Tambah (Contoh jika mau ditaruh di sini) */}
                                             {/* {item.title === "Folder" && !isLoadingFolders && (
                                                <SidebarMenuSubItem className="mt-1">
                                                     <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs" onClick={handleAddFolderClick}>
                                                         <FolderPlus size={14} className="mr-2" /> Tambah Folder
                                                     </Button>
                                                 </SidebarMenuSubItem>
                                             )} */}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        ) : (
                             // Render item menu biasa
                            <SidebarMenuButton asChild tooltip={item.title}>
                                <a href={item.url}>
                                    {item.icon && <item.icon />}
                                    <span className="truncate">{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

