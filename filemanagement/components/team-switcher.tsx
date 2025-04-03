// src/components/TeamSwitcher.tsx
"use client"

import * as React from "react"
import { ChevronsUpDown, Check, Plus, Loader2 } from "lucide-react"; // Tambahkan Loader2
import { cn } from "@/lib/utils"; // Sesuaikan path
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Workspace } from "./app-sidebar";
// Impor tipe Workspace dari lokasi yang benar
// Impor helper warna jika belum

interface TeamSwitcherProps {
    workspaces: Workspace[]; // Terima daftar workspace dinamis
    selectedWorkspaceId: string | null; // ID workspace yg aktif
    onSelectWorkspace: (workspaceId: string) => void; // Callback saat dipilih
    isLoading?: boolean; // Status loading dari parent
    className?: string; // Prop className opsional
}

export function TeamSwitcher({
    workspaces,
    selectedWorkspaceId,
    onSelectWorkspace,
    isLoading,
    className
}: TeamSwitcherProps) {
    const { isMobile } = useSidebar();
    const [open, setOpen] = React.useState(false);

    // HAPUS STATE INI:
    // const [activeTeam, setActiveTeam] = React.useState(workspaces[0]);

    // HAPUS PENGECEKAN INI:
    // if (!activeTeam) {
    //   return null;
    // }

    // Dapatkan data workspace yang dipilih dari props
    const selectedWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId);

    // Tentukan teks dan warna tampilan berdasarkan props
    const displayIconText = selectedWorkspace?.name.substring(0, 2).toUpperCase() || "?";
    const displayName = selectedWorkspace?.name || (isLoading ? "Memuat..." : (workspaces.length > 0 ? "Pilih Workspace" : "Belum Ada"));
    // Gunakan helper untuk warna, berikan default jika tidak ada atau loading
    const displayColorClass = isLoading ? 'bg-gray-400' : (selectedWorkspace?.color);

    return (
        // Struktur Anda saat ini menggunakan DropdownMenu di dalam SidebarMenu
        // Pertimbangkan untuk menggantinya dengan Popover+Command seperti contoh sebelumnya agar lebih mirip combobox
        <SidebarMenu className={cn("mb-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-md", className)}>
            <SidebarMenuItem>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg" // Sesuaikan ukuran jika perlu
                            className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground disabled:opacity-60 w-full" // Tambah w-full
                            disabled={isLoading || workspaces.length === 0} // Disable saat loading atau kosong
                            aria-label={displayName}
                        >
                             {/* Ikon */}
                            <div className={cn("flex aspect-square size-8 items-center justify-center rounded-lg flex-shrink-0", displayColorClass)} >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-white"/>
                                ) : (
                                    <span className="text-sm font-medium text-white">{displayIconText}</span>
                                )}
                            </div>
                            {/* Nama Workspace */}
                             <div className="grid flex-1 text-left text-sm leading-tight mx-2 overflow-hidden"> {/* Tambah mx-2 dan overflow */}
                                <span className="truncate font-medium text-gray-800 dark:text-gray-100">{displayName}</span>
                            </div>
                             {/* Chevron (hanya jika tidak loading & ada pilihan) */}
                             {!isLoading && workspaces.length > 0 && <ChevronsUpDown className="ml-auto h-4 w-4 text-gray-500" />}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                         className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
                         align="start"
                         side={isMobile ? "bottom" : "right"}
                         sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Pilih Workspace
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        {workspaces.map((workspace) => ( // Ganti 'team' menjadi 'workspace'
                            <DropdownMenuItem
                                key={workspace.id} // Gunakan ID unik
                                onClick={() => {
                                    onSelectWorkspace(workspace.id); // Panggil callback dgn ID
                                    setOpen(false); // Tutup dropdown
                                }}
                                className={cn("cursor-pointer", selectedWorkspaceId === workspace.id ? "bg-accent" : "")} // Highlight yg aktif
                            >
                                <div className={cn("flex size-6 items-center justify-center rounded-md mr-2 flex-shrink-0", (workspace.color))} >
                                    <span className="text-xs font-medium text-white">{workspace.name.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <span className="truncate">{workspace.name}</span>
                                {/* Tampilkan check jika terpilih */}
                                {selectedWorkspaceId === workspace.id && <Check className="ml-auto h-4 w-4"/>}
                            </DropdownMenuItem>
                        ))}
                        {/* Tombol Tambah Workspace (opsional) */}
                        {/* <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2 cursor-pointer" onSelect={() => console.log('Tambah Workspace')}>
                            <Plus className="size-4" /> Tambah Workspace
                        </DropdownMenuItem> */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}