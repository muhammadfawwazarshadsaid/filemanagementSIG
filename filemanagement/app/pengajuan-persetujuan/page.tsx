'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"; // Core layout
import { NavUser } from "@/components/nav-user"; // Common header component
import { Button } from "@/components/ui/button"; // Basic UI
// import { Separator } from "@/components/ui/separator"; // Dihapus karena tidak digunakan lagi
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Core layout
import {
    Archive,
    CheckCircle2,
    Edit,
    FileText,
    FileUp,
    Loader2,
    Plus,
    Signature,
    ListChecks, 
    X, 
} from "lucide-react"; // Basic icons
import { TooltipProvider } from "@radix-ui/react-tooltip"; // Core layout

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Fungsi Helper untuk Inisial dan Warna Avatar
function getInitials(name: string): string {
    if (!name || name.trim() === "") return "??";
    if (name.toLowerCase() === "anda") return "AN";

    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    } else if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return "??";
}

function getAvatarBgColor(name: string): string {
    if (!name) return 'bg-gray-400';
    const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; 
    }
    return colors[Math.abs(hash) % colors.length];
}

// Tipe untuk entri log
type ActivityLogEntryType = {
    id: string;
    actionIcon: React.ElementType;
    actionIconColorClass?: string;
    actorName: string;
    actorInitials: string;
    avatarBgClass: string;
    actionTextParts: Array<{ text: string; isStrong?: boolean; isFileName?: boolean; }>;
    remarks?: string;
    timestamp: string;
};

export default function PengajuanPersetujuanPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [activeWorkspaceName, setActiveWorkspaceName] = useState<string>('Pilih Workspace');
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const PREVIEW_LOG_COUNT = 3;

    const handleWorkspaceUpdate = useCallback(
        ( workspaceId: string | null, workspaceName: string | null, workspaceUrl: string | null, isSelf: boolean | null) => {
            console.log("PengajuanPersetujuanPage: Workspace updated", { workspaceId, workspaceName, workspaceUrl, isSelf });
            setActiveWorkspaceId(workspaceId);
            setActiveWorkspaceName(workspaceName || 'Detail Workspace');
            setIsLogModalOpen(false);
        },
        []
    );

    const hardcodedActivityLogData: ActivityLogEntryType[] = [
        { id: 'logAct7', actorName: 'Rina Amelia (Approver)', actorInitials: getInitials('Rina Amelia'), avatarBgClass: getAvatarBgColor('Rina Amelia'), actionTextParts: [ { text: ' menyetujui dokumen ' }, { text: '"Spesifikasi Teknis Proyek Zeta.docx"', isStrong: true, isFileName: true } ], timestamp: 'Baru saja', remarks: 'Sudah final, bisa dilanjutkan.', actionIcon: CheckCircle2, actionIconColorClass: 'text-green-500' },
        { id: 'logAct6', actorName: 'Anda', actorInitials: getInitials('Anda'), avatarBgClass: getAvatarBgColor('Anda'), actionTextParts: [ { text: ' mengirimkan revisi terakhir untuk ' }, { text: '"Spesifikasi Teknis Proyek Zeta.docx"', isStrong: true, isFileName: true }, { text: ' kepada ' }, { text: 'Rina Amelia (Approver)', isStrong: true } ], timestamp: '15 menit yang lalu', actionIcon: FileUp, actionIconColorClass: 'text-blue-500' },
        { id: 'logAct5', actorName: 'Rina Amelia (Approver)', actorInitials: getInitials('Rina Amelia'), avatarBgClass: getAvatarBgColor('Rina Amelia'), actionTextParts: [ { text: ' meminta revisi minor pada ' }, { text: '"Spesifikasi Teknis Proyek Zeta.docx"', isStrong: true, isFileName: true } ], timestamp: '1 jam yang lalu', remarks: 'Hanya perbaikan typo di halaman 5.', actionIcon: Edit, actionIconColorClass: 'text-orange-500' },
        { id: 'logAct4', actorName: 'Joko Susilo (Approver)', actorInitials: getInitials('Joko Susilo'), avatarBgClass: getAvatarBgColor('Joko Susilo'), actionTextParts: [ { text: ' menyetujui dokumen ' }, { text: '"Proposal Kemitraan Strategis Q3.pdf"', isStrong: true, isFileName: true } ], timestamp: 'Hari ini, 10:30 WIB', remarks: 'Bagus! Semua detail sudah lengkap dan jelas. Lanjutkan.', actionIcon: CheckCircle2, actionIconColorClass: 'text-green-500' },
        { id: 'logAct3', actorName: 'Anda', actorInitials: getInitials('Anda'), avatarBgClass: getAvatarBgColor('Anda'), actionTextParts: [ { text: ' mengirimkan revisi untuk dokumen ' }, { text: '"Proposal Kemitraan Strategis Q3.pdf"', isStrong: true, isFileName: true }, { text: ' kepada ' }, { text: 'Joko Susilo (Approver)', isStrong: true } ], timestamp: 'Kemarin, 17:00 WIB', actionIcon: FileUp, actionIconColorClass: 'text-blue-500' },
        { id: 'logAct2', actorName: 'Joko Susilo (Approver)', actorInitials: getInitials('Joko Susilo'), avatarBgClass: getAvatarBgColor('Joko Susilo'), actionTextParts: [ { text: ' meminta revisi untuk dokumen ' }, { text: '"Proposal Kemitraan Strategis Q3.pdf"', isStrong: true, isFileName: true } ], timestamp: '2 hari yang lalu, 14:15 WIB', remarks: 'Pada bagian analisis risiko, mohon tambahkan mitigasi untuk poin C.\nJuga, pastikan format tabel sudah benar.', actionIcon: Edit, actionIconColorClass: 'text-orange-500' },
        { id: 'logAct1', actorName: 'Anda', actorInitials: getInitials('Anda'), avatarBgClass: getAvatarBgColor('Anda'), actionTextParts: [ { text: ' mengajukan persetujuan untuk dokumen ' }, { text: '"Proposal Kemitraan Strategis Q3.pdf"', isStrong: true, isFileName: true }, { text: ' kepada ' }, { text: 'Joko Susilo (Approver)', isStrong: true } ], timestamp: '3 hari yang lalu, 09:00 WIB', actionIcon: FileUp, actionIconColorClass: 'text-blue-500' },
    ];

    const logsForPagePreview = hardcodedActivityLogData.slice(0, PREVIEW_LOG_COUNT);

    const ActivityLogItem = ({ log }: { log: ActivityLogEntryType }) => {
        const ActionIconComponent = log.actionIcon;
        return (
            // MODIFIKASI DI SINI untuk efek hover
            <div className={`
                flex items-start space-x-3 
                py-4 border-b border-gray-200 last:border-b-0 
                px-2 md:px-3 {/* Padding horizontal awal */}
                hover:bg-gray-100/70 {/* Background saat hover */}
                hover:px-4 md:hover:px-5 {/* Padding horizontal bertambah saat hover */}
                hover:rounded-lg {/* Sudut membulat saat hover */}
                transition-all duration-200 ease-in-out {/* Transisi halus */}
            `}>
                {/* Avatar Inisial */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${log.avatarBgClass} flex items-center justify-center`}>
                    <span className="text-sm font-medium text-white">{log.actorInitials}</span>
                </div>

                {/* Konten Log */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm">
                        <p className="text-gray-800">
                            {ActionIconComponent && (
                                <ActionIconComponent className={`inline-block h-4 w-4 mr-1.5 align-[-0.15em] ${log.actionIconColorClass || 'text-gray-500'}`} />
                            )}
                            <strong className="font-medium text-gray-900">{log.actorName}</strong>
                            {log.actionTextParts && log.actionTextParts.map((
                                part: { text: string; isStrong?: boolean; isFileName?: boolean },
                                index: number
                            ) => (
                                <React.Fragment key={index}>
                                    {part.isFileName && (
                                        <FileText
                                            className="inline-block h-[1.05em] w-[1.05em] mr-1 align-[-0.125em] text-sky-600"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <span className={part.isStrong ? "font-semibold text-gray-900" : "text-gray-700"}>
                                        {part.text}
                                    </span>
                                </React.Fragment>
                            ))}
                            .
                        </p>
                    </div>
                    {log.remarks && (
                        <div className="mt-1.5 text-xs p-2.5 bg-gray-50 rounded-md border border-gray-200">
                            <p className="italic text-gray-600 whitespace-pre-wrap">{log.remarks}</p>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">{log.timestamp}</p>
                </div>
            </div>
        );
    };

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    if (isLoading) {
        return (<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Memuat halaman...</div>);
    }

    return (
       <TooltipProvider delayDuration={200}>
            <SidebarProvider>
                <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdate} />
                <SidebarInset>
                    <header className="flex w-full shrink-0 items-center gap-2 h-12">
                        <div className="flex w-full items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1 mr-2" />
                            <div className="flex flex-col items-left justify-start">
                                <h4 className="scroll-m-20 text-lg font-semibold tracking-tight truncate" title={activeWorkspaceName}>
                                    {activeWorkspaceName || 'Pengajuan Persetujuan'}
                                </h4>
                            </div>
                            <div className="flex-1" />
                            <NavUser />
                        </div>
                    </header>
                    <div className="flex-1 h-[calc(100vh-theme(space.12))] overflow-y-auto">
                        <div className="flex flex-col gap-4 p-4 bg-gray-50 min-h-full">
                            <div className="bg-white p-4 rounded-xl">
                                <div>
                                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight">Pengajuan Persetujuan</h2>
                                    <p className="text-xs text-gray-500 mt-1">Anda dapat mengajukan persetujuan dokumen kepada approver</p>
                                    <Button variant={"default"} size="sm" className="w-fit mt-4">
                                        <Signature className="mr-2 h-4 w-4"/>Ajukan Persetujuan<Plus className="ml-2 h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl">
                                <div>
                                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight">Log Aktivitas</h2>
                                    <p className="text-xs text-gray-500 mt-1">Berikut adalah beberapa aktivitas terbaru.</p>
                                    <div className="mt-4 md:mt-5">
                                        {hardcodedActivityLogData && hardcodedActivityLogData.length > 0 ? (
                                            <>
                                                <div>
                                                    <ul role="list" className="space-y-0">
                                                        {logsForPagePreview.map((logEntry) => (
                                                            <li key={logEntry.id}>
                                                                <ActivityLogItem log={logEntry} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {hardcodedActivityLogData.length > PREVIEW_LOG_COUNT && (
                                                    <div className="mt-6 text-center">
                                                        <Button variant="outline" size="sm" onClick={() => setIsLogModalOpen(true)} className="text-sm w-full md:w-auto">
                                                            <ListChecks className="mr-2 h-4 w-4" />
                                                            Lihat semua {hardcodedActivityLogData.length} log aktivitas
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Archive className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                                <p className="text-sm font-medium text-gray-600">Belum Ada Aktivitas</p>
                                                <p className="text-xs text-gray-500 mt-1">Log aktivitas untuk workspace ini akan muncul di sini.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>

            <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="text-xl">Semua Log Aktivitas</DialogTitle>
                  <DialogDescription>Riwayat lengkap aktivitas pengajuan dan persetujuan.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-2">
                  {hardcodedActivityLogData.length > 0 ? (
                    <ul role="list" className="space-y-0">
                      {hardcodedActivityLogData.map((logEntry) => (
                        <li key={logEntry.id}>
                          <ActivityLogItem log={logEntry} />
                        </li>
                      ))}
                    </ul>
                  ) : ( <p className="text-sm text-gray-500 text-center py-4">Tidak ada aktivitas untuk ditampilkan.</p> )}
                </div>
                <DialogFooter className="pt-4 border-t sm:justify-start">
                    <Button variant="outline" onClick={() => setIsLogModalOpen(false)}>
                        <X className="mr-2 h-4 w-4" /> Tutup
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}