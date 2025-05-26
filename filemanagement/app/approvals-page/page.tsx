'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"; // Core layout
import { NavUser } from "@/components/nav-user"; // Common header component
import { Button } from "@/components/ui/button"; // Basic UI
import { Separator } from "@/components/ui/separator"; // Basic UI
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Core layout
import { Loader2, Search } from "lucide-react"; // Basic icons
import { TooltipProvider } from "@radix-ui/react-tooltip"; // Core layout
// import { supabase } from "@/lib/supabaseClient"; // Likely needed later for actual functionality
// import { Schema } from "@/components/recentfiles/schema"; // Specific to file data

// Minimal interface for workspace updates from sidebar
interface WorkspaceUpdateParams {
    workspaceId: string | null;
    workspaceName: string | null;
    workspaceUrl: string | null;
}

export default function SamplePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('Pilih Workspace');

    // Placeholder for data specific to "Pengajuan Persetujuan"
    // const [persetujuanData, setPersetujuanData] = useState<any[]>([]);
    // const [isFetchingData, setIsFetchingData] = useState(false);

    const handleWorkspaceUpdate = useCallback(({ workspaceId, workspaceName, workspaceUrl }: WorkspaceUpdateParams) => {
        console.log("PengajuanPersetujuanPage: Workspace updated", { workspaceId, workspaceName, workspaceUrl });
        setActiveWorkspaceId(workspaceId);
        setActiveWorkspaceName(workspaceName || 'Detail Workspace');
        // Reset or fetch data for the new workspace
        // setPersetujuanData([]);
        if (workspaceId) {
            // setIsFetchingData(true);
            // fetchDataForWorkspace(workspaceId); // Implement this
        }
    }, []);

    // Simulate initial loading or fetch essential page data
    useEffect(() => {
        setIsLoading(true);
        // Simulate some async operation or initial check
        setTimeout(() => {
            // Example: Check user authentication or basic setup
            // const user = supabase.auth.user();
            // if (!user) {
            // setError("Autentikasi diperlukan.");
            // router.push('/login'); // If using Next.js router
            // }
            setIsLoading(false);
        }, 1000); // Simulate delay
    }, []);

    // Placeholder for fetching "Pengajuan Persetujuan" data
    /*
    const fetchDataForWorkspace = useCallback(async (workspaceId: string) => {
        if (!supabase || !workspaceId) return;
        setIsFetchingData(true);
        setError(null);
        try {
            // Example: Fetch approval requests related to the workspaceId
            // const { data, error } = await supabase
            // .from('pengajuan_persetujuan')
            // .select('*')
            // .eq('workspace_id', workspaceId);

            // if (error) throw error;
            // setPersetujuanData(data || []);

        } catch (err: any) {
            console.error("Error fetching persetujuan data:", err);
            setError(`Gagal memuat data pengajuan: ${err.message}`);
            setPersetujuanData([]);
        } finally {
            setIsFetchingData(false);
        }
    }, [supabase]); // Add supabase if used

    useEffect(() => {
        if (activeWorkspaceId) {
            fetchDataForWorkspace(activeWorkspaceId);
        }
    }, [activeWorkspaceId, fetchDataForWorkspace]);
    */

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mr-2" /> Memuat halaman...
            </div>
        );
    }

    return (
       <TooltipProvider delayDuration={200}>
    <SidebarProvider>
        <AppSidebar
            onWorkspaceUpdate={(id, name, url) => handleWorkspaceUpdate({ workspaceId: id, workspaceName: name, workspaceUrl: url })}
        />
        <SidebarInset>
            <header className="flex w-full shrink-0 items-center gap-2 h-12">
                <div className="flex w-full items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                    <div className="flex flex-col items-left justify-start">
                        <h4 className="scroll-m-20 text-lg font-semibold tracking-tight truncate" title={activeWorkspaceName}>
                            {activeWorkspaceName || 'Pengajuan Persetujuan'}
                        </h4>
                    </div>
                    <div className="flex-1" /> {/* Spacer */}
                    {/* Optional: Search button or other header actions specific to this page */}
                    {/*
                    <Button variant={"outline"} title="Cari Pengajuan" onClick={() => console.log("Search clicked")}>
                        <Search className="h-4 w-4 mr-2 md:mr-0" />
                        <span className="hidden md:inline ml-2">Cari</span>
                    </Button>
                    */}
                    <NavUser />
                </div>
            </header>
                    
            <div className="flex-1 h-[calc(100vh-theme(space.12))] overflow-y-auto">
                <div className="flex flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)] min-h-full">
                    <div className="bg-muted/50 gap-4 p-4 inline-flex overflow-hidden flex-col rounded-xl bg-white">
                        <div>
                            <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">Pengajuan Persetujuan</h2>
                            <p className="text-xs text-gray-500">Workspace Aktif: {activeWorkspaceName || '...'}</p>
                        </div>
                    </div>
                    {/* Tambahkan konten lain di sini jika perlu */}
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
    {/* Toaster should be in the root layout (app/layout.tsx) */}
</TooltipProvider>
    );
}