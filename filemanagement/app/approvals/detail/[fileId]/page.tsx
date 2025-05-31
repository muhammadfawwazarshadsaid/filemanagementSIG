"use client";

import React, { useEffect, useState, useCallback, Fragment } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar"; // Sesuaikan path
import { NavUser } from "@/components/nav-user";     // Sesuaikan path
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Sesuaikan path
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Loader2,
    ArrowLeft,
    FileText as FileTextIcon,
    Users,
    AlertCircle,
    RefreshCw,
    MessageSquare,
    CheckCircle2,
    XCircle,
    Edit3,
    Hourglass,
    Info,
    CalendarDays,
    ExternalLink,
    // Share2 // Untuk tombol share (jika ada), bisa ditambahkan jika perlu
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar as ShadCNAvatar, AvatarFallback } from "@/components/ui/avatar";


import type {
    ApprovalUser,
    IndividualApproverAction,
    OverallApprovalStatusKey,
    IndividualApprovalStatusKey,
    ApprovalFile,
} from '@/components/approvals/schema';
import { useUser } from '@stackframe/stack'; // Impor useUser untuk signout

type FileDetailInResponse = {
    id: string; filename: string | null; mimeType: string | null; description: string | null;
    workspace_id: string | null; user_id: string | null; gdrive_fetch_error?: string | null;
    db_created_at?: string | null; db_updated_at?: string | null;
    pengesahan_pada?: string | null; color?: string | null; labels?: string[];
    webViewLink?: string | null;
};

interface ApprovalRequestDetail {
    sharedApprovalProcessCuid: string;
    fileIdRef: string;
    file: FileDetailInResponse | null;
    assigner: ApprovalUser | null;
    createdAt: string;
    updatedAt?: string;
    overallStatus: OverallApprovalStatusKey;
    approvers: IndividualApproverAction[];
    activityLog: Array<{
        id: string;
        actorName: string;
        actorType: 'assigner' | 'approver' | 'system' | 'notification_recipient';
        actionDescription: string;
        details?: string | null;
        timestamp: string;
        formattedTimestamp?: string;
        statusKey?: IndividualApprovalStatusKey;
        remarks?: string | null;
        isNotification?: boolean;
    }>;
}

function getInitials(name: string | null | undefined): string {
    if (!name || name.trim() === "") return "??";
    if (name.toLowerCase() === "anda") return "AN";
    const words = name.trim().split(/\s+/);
    if (words.length === 1 && words[0].length > 0) {
        return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
    } else if (words.length >= 2) {
        return (words[0][0] + (words[1][0] || '')).toUpperCase();
    }
    return "??";
}

function getAvatarBgColor(name: string | null | undefined): string {
    if (!name) return 'bg-slate-400 dark:bg-slate-600';
    const colors = [
        'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 
        'bg-orange-500', 'bg-cyan-500'
    ];
    let hash = 0;
    if (name) {
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
    }
    return colors[Math.abs(hash) % colors.length];
}

function formatDate(dateString?: string | null, customFormat = "dd MMM yyyy, HH:mm"): string {
    if (!dateString) return "-";
    try {
        const date = parseISO(dateString);
        if (!isValidDate(date)) {
            console.warn("Invalid date string for formatDate:", dateString);
            return "Tanggal Tidak Valid";
        }
        return format(date, customFormat, { locale: localeID });
    } catch (e) {
        console.warn("Error formatting date:", dateString, e);
        return "Format Tanggal Salah";
    }
}

const getStatusVisuals = (statusKey?: IndividualApprovalStatusKey | OverallApprovalStatusKey) => {
    let StatusIcon: React.ElementType = Info;
    let statusColor = "text-gray-500 dark:text-gray-400";
    let barBgColor = "bg-gray-300 dark:bg-gray-600";
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";

    switch(statusKey) {
        case 'approved': case 'Sah':
            StatusIcon = CheckCircle2; statusColor = "text-green-600 dark:text-green-400"; barBgColor = "bg-green-500"; badgeVariant = "default";
            break;
        case 'revised': case 'Perlu Revisi':
            StatusIcon = Edit3; statusColor = "text-orange-500 dark:text-orange-400"; barBgColor = "bg-orange-500"; badgeVariant = "destructive";
            break;
        case 'rejected': case 'Ditolak':
            StatusIcon = XCircle; statusColor = "text-red-600 dark:text-red-500"; barBgColor = "bg-red-500"; badgeVariant = "destructive";
            break;
        case 'pending': case 'Menunggu Persetujuan':
            StatusIcon = Hourglass; statusColor = "text-blue-500 dark:text-blue-400"; barBgColor = "bg-blue-500"; badgeVariant = "secondary";
            break;
        case 'unknown': case 'Belum Ada Tindakan': default:
            StatusIcon = Info; statusColor = "text-gray-500 dark:text-gray-400"; barBgColor = "bg-gray-400 dark:bg-gray-500"; badgeVariant = "outline";
            break;
    }
    return { StatusIcon, statusColor, barBgColor, badgeVariant };
};


export default function ApprovalDetailPage() {
    const router = useRouter();
    const params = useParams();
    const stackframeUser = useUser(); // Menggunakan useUser dari stackframe
    const searchParamsHook = useSearchParams();

    const fileIdFromPath = params.fileId as string;
    const processCuidFromQuery = searchParamsHook.get('processId');

    const [approvalDetail, setApprovalDetail] = useState<ApprovalRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [activeWorkspaceNameFromSidebar, setActiveWorkspaceNameFromSidebar] = useState<string | null>(null); // Untuk judul header


    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            setAccessToken(token);
        } else {
            toast.error("Autentikasi Gagal", { description: "Token tidak ditemukan. Silakan login kembali."});
            stackframeUser?.signOut(); // Menggunakan stackframeUser untuk signOut
            router.push("/masuk"); 
        }
    }, [router, stackframeUser]);

    const fetchApprovalDetail = useCallback(async () => {
        if (!accessToken) {
            setError("Token akses tidak valid atau tidak tersedia untuk memuat detail.");
            setIsLoading(false); // Set loading false agar UI error bisa muncul
            return;
        }
        if (!fileIdFromPath && !processCuidFromQuery) {
            setError("Informasi ID (file atau proses) tidak lengkap untuk mengambil detail.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        console.log(`[Detail Page] Fetching detail for fileIdRef: ${fileIdFromPath}, processCuid: ${processCuidFromQuery}`);

        try {
            const apiUrl = new URL(`${window.location.origin}/api/approvals/getinfo`);
            if (fileIdFromPath) apiUrl.searchParams.append('fileIdRef', fileIdFromPath);
            if (processCuidFromQuery) apiUrl.searchParams.append('processId', processCuidFromQuery);
            
            const response = await fetch(apiUrl.toString(), {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Gagal mengambil detail approval: Server merespons dengan status ${response.status}`);
            }
            
            if (result.data) {
                setApprovalDetail(result.data as ApprovalRequestDetail);
            } else {
                throw new Error(result.error || "Data tidak ditemukan dalam respons API.");
            }
        } catch (err: any) {
            console.error("Error fetching approval detail:", err);
            setError(err.message);
            setApprovalDetail(null);
            // toast.error("Gagal Memuat Detail Approval", { description: err.message }); // Sudah dihandle di render
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, fileIdFromPath, processCuidFromQuery]);

    useEffect(() => {
        if (accessToken && (fileIdFromPath || processCuidFromQuery)) {
            fetchApprovalDetail();
        }
        // Kondisi untuk setError jika token atau ID tidak ada setelah loading awal
        // bisa dipertimbangkan untuk ditambahkan di sini, namun fetchApprovalDetail sudah memiliki guard clause
    }, [accessToken, fileIdFromPath, processCuidFromQuery, fetchApprovalDetail]);

    const handleWorkspaceUpdateForDetailPage = useCallback((
        _wsId: string | null, 
        wsName?: string | null, 
        _wsUrl?: string | null,
        _isSelf?: boolean | null
    ) => {
        // Mungkin Anda ingin mengambil nama workspace dari AppSidebar untuk ditampilkan di header halaman ini
        // setActiveWorkspaceNameFromSidebar(wsName);
        // Untuk saat ini, kita fokus pada judul dari detail file
    }, []);


    if (isLoading) {
        return (
            <TooltipProvider>
                <SidebarProvider>
                    <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdateForDetailPage} />
                    <SidebarInset>
                        <header className="flex w-full shrink-0 items-center gap-2 h-12">
                            <div className="flex w-full items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                                <Button variant="ghost" size="icon" onClick={() => router.push('/approvals')} className="mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">Memuat Detail...</h4>
                                <div className="flex-1" />
                                <NavUser />
                            </div>
                        </header>
                        <div className="flex-1 h-[calc(100vh-theme('space.12'))] overflow-y-auto bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
                                <span className="ml-3 text-lg text-muted-foreground">Memuat Detail Persetujuan...</span>
                            </div>
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        );
    }

    if (error || !approvalDetail) {
        return (
            <TooltipProvider>
                <SidebarProvider>
                    <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdateForDetailPage} />
                    <SidebarInset>
                        <header className="flex w-full shrink-0 items-center gap-2">
                            <div className="flex w-full items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                                 <Button variant="ghost" size="icon" onClick={() => router.push('/approvals')} className="mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <h4 className="scroll-m-20 text-lg font-semibold tracking-tight">Error Memuat Detail</h4>
                                <Button onClick={() => fetchApprovalDetail()} variant="outline" disabled={isLoading} className="dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:border-slate-600">
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    Muat Ulang Detail
                                </Button>
                                <div className="flex-1" />
                                <NavUser />
                            </div>
                        </header>
                        <main className="flex-1 h-[calc(100vh-theme('space.12'))] overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
                            <div className="flex flex-col items-center justify-center text-center h-full">
                                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Gagal Memuat Detail</h2>
                                <p className="text-muted-foreground mb-6 max-w-md">{error || "Data detail approval tidak dapat ditemukan."}</p>
                                <div className="flex space-x-3 justify-center">
                                    <Button variant="outline" onClick={() => router.push('/approvals')}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
                                    </Button>
                                    { (fileIdFromPath || processCuidFromQuery) && accessToken &&
                                        <Button onClick={() => fetchApprovalDetail()} disabled={isLoading}>
                                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Coba Lagi
                                        </Button>
                                    }
                                </div>
                            </div>
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        );
    }

    const { file, assigner, createdAt, updatedAt, overallStatus, approvers, activityLog, sharedApprovalProcessCuid } = approvalDetail;
    const { StatusIcon: OverallStatusIconComponent } = getStatusVisuals(overallStatus); // Ambil hanya ikon untuk header Card
    const pageTitle = file?.filename ? `Detail: ${file.filename}` : "Detail Persetujuan";

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar onWorkspaceUpdate={handleWorkspaceUpdateForDetailPage} />
                <SidebarInset>
                    {/* Header Utama Halaman */}
                    <header className="flex w-full shrink-0 items-center gap-2 h-12">
                        <div className="flex w-full items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                            <Button variant="ghost" size="icon" onClick={() => router.push('/approvals')} className="mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Kembali</span>
                            </Button>
                            <h4 className="scroll-m-20 text-lg font-semibold tracking-tight truncate max-w-[calc(100vw-300px)]" title={pageTitle}>
                                {pageTitle}
                            </h4>
                            <Button onClick={() => fetchApprovalDetail()} variant="outline" size="sm" disabled={isLoading} className="dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:border-slate-600 h-8">
                                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Muat Ulang Detail
                            </Button>
                            <div className="flex-1" />
                            <NavUser />
                        </div>
                    </header>

                    {/* Konten Utama Halaman */}
                    <main className="flex-1 h-[calc(100vh-theme('space.12'))] overflow-y-auto p-4 md:p-6 bg-[oklch(0.972_0.002_103.49)] ">
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Card Informasi File & Status Keseluruhan */}
                            <div className=" rounded-lg bg-white"> {/* Tanpa shadow, dengan border */}
                                <CardHeader className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700"> {/* bg dihilangkan */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-start space-x-3 md:space-x-4 mb-3 sm:mb-0">
                                            <FileTextIcon className="h-8 w-8 md:h-10 md:w-10 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-50 leading-tight" title={file?.filename ?? undefined}>
                                                    {file?.filename || "Nama File Tidak Diketahui"}
                                                </CardTitle>
                                                <CardDescription className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Diajukan oleh: <span className="font-medium text-slate-700 dark:text-slate-300">{assigner?.displayname || "N/A"}</span>
                                                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                                                    <CalendarDays className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
                                                    {formatDate(createdAt)}
                                                </CardDescription>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">ID Proses: {sharedApprovalProcessCuid.substring(0,12)}...</p>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusVisuals(overallStatus).badgeVariant} className={`text-sm px-3 py-1.5 self-start sm:self-center ${getStatusVisuals(overallStatus).statusColor}`}>
                                            <OverallStatusIconComponent className={`mr-1.5 h-3.5 w-3.5`} />
                                            {overallStatus}
                                        </Badge>
                                    </div>
                                    {file?.webViewLink && (
                                        <div className="mt-4">
                                            <Button variant="outline" size="sm" asChild className="dark:bg-slate-700 dark:hover:bg-slate-600 dark:border-slate-600 dark:text-slate-300">
                                                <a href={file.webViewLink ?? undefined} target="_blank" rel="noopener noreferrer">
                                                    Buka Dokumen di Google Drive <ExternalLink className="ml-2 h-4 w-4"/>
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                { (file?.description || file?.gdrive_fetch_error || file?.pengesahan_pada) && (
                                    <CardContent className="p-4 md:p-5 text-sm text-slate-700 dark:text-slate-300 space-y-3">
                                        {file?.description && (
                                            <div>
                                                <h4 className="font-medium text-slate-600 dark:text-slate-300 mb-1">Deskripsi Dokumen:</h4>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-700/40 p-3 rounded-md">{file.description}</p>
                                            </div>
                                        )}
                                        {file?.gdrive_fetch_error && <p className="text-xs text-red-500 dark:text-red-400 italic bg-red-50 dark:bg-red-900/20 p-2 rounded-md">Error Google Drive: {file.gdrive_fetch_error}</p>}
                                        {file?.pengesahan_pada && <p className="text-green-600 dark:text-green-400 font-medium mt-2">Telah Disahkan Pada: {formatDate(file.pengesahan_pada)}</p>}
                                    </CardContent>
                                )}
                            </div>

                           <div className=" rounded-lg bg-white">
                                <CardHeader className="pb-3 pt-4 px-4 md:px-5">
                                    <CardTitle className="text-base md:text-lg font-semibold flex items-center text-slate-700 dark:text-slate-200">
                                        <Users className="mr-2.5 h-5 w-5 text-slate-500 dark:text-slate-400"/>Progres Persetujuan ({approvers.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-2 sm:px-4 md:px-5 pb-4 md:pb-5">
                                    {approvers && approvers.length > 0 ? (
                                        <div className="relative flex items-start pt-2 pb-1 space-x-0 overflow-x-auto snap-x snap-mandatory no-scrollbar">
                                            {approvers.map((approver, index) => {
                                                const { StatusIcon, statusColor, barBgColor } = getStatusVisuals(approver.statusKey);
                                                const initials = getInitials(approver.approverName);
                                                const isLast = index === approvers.length - 1;
                                                return (
                                                    <Fragment key={approver.approverId + index + (approver.actioned_at || '')}>
                                                        {/* TooltipProvider, Tooltip, TooltipTrigger, TooltipContent DIHAPUS dari sini */}
                                                        <div 
                                                            className="flex flex-col items-center flex-shrink-0 w-24 md:w-28 p-2 snap-center hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md cursor-default transition-colors"
                                                            title={`Approver: ${approver.approverName || 'N/A'}\nStatus: ${approver.statusDisplay}${approver.actioned_at ? `\nTanggal: ${formatDate(approver.actioned_at)}` : ''}${approver.remarks ? `\nKomentar: ${approver.remarks}` : ''}`} // Info dasar bisa via title HTML
                                                        >
                                                            <div className={`relative h-10 w-10 rounded-full ${getAvatarBgColor(approver.approverName)} flex items-center justify-center text-white text-base font-medium mb-1.5`}>
                                                                {initials}
                                                                <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-card dark:bg-slate-800 border-2 ${statusColor.includes('green') ? 'border-green-500 dark:border-green-600' : statusColor.includes('red') ? 'border-red-500 dark:border-red-600' : statusColor.includes('orange') ? 'border-orange-500 dark:border-orange-600' : statusColor.includes('blue') ? 'border-blue-500 dark:border-blue-600' : 'border-gray-400 dark:border-gray-500'}`}>
                                                                    <StatusIcon className={`h-3.5 w-3.5 ${statusColor}`} />
                                                                </div>
                                                            </div>
                                                            <p className="text-xs font-medium text-center truncate w-full text-slate-700 dark:text-slate-200" title={approver.approverName || 'N/A'}>
                                                                {approver.approverName || 'N/A'}
                                                            </p>
                                                            <p className={`text-[11px] font-semibold capitalize ${statusColor}`} title={approver.statusDisplay}>
                                                                {approver.statusDisplay}
                                                            </p>
                                                        </div>
                                                        {!isLast && (
                                                            <div className={`flex-auto self-center h-1.5 ${barBgColor} opacity-60 min-w-[24px] md:min-w-[32px] rounded-sm mx-1`}></div>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">Tidak ada approver yang ditugaskan pada permintaan ini.</p>
                                    )}
                                </CardContent>
                            </div>

                            <div className=" rounded-lg bg-white">
                                <CardHeader className="pb-3 pt-4 px-4 md:px-5">
                                    <CardTitle className="text-base md:text-lg font-semibold text-slate-700 dark:text-slate-200">Log Aktivitas & Notifikasi</CardTitle>
                                </CardHeader>
                                <CardContent className="px-0">
                                    {activityLog && activityLog.length > 0 ? (
                                        <ul className="divide-y divide-slate-200 dark:divide-slate-700/50 max-h-[400px] overflow-y-auto no-scrollbar">
                                            {activityLog.map((log) => {
                                                const { StatusIcon: LogStatusIcon } = getStatusVisuals(log.statusKey);
                                                const avatarInitials = getInitials(log.actorName);
                                                const avatarBg = getAvatarBgColor(log.actorName);
                                                
                                                let ActionSpecificIcon: React.ElementType = Info; 
                                                if(log.actionDescription.toLowerCase().includes("mengajukan")) ActionSpecificIcon = Edit3;
                                                else if(log.actionDescription.toLowerCase().includes("menyetujui") || log.actionDescription.toLowerCase().includes("disahkan") || log.statusKey === 'approved') ActionSpecificIcon = CheckCircle2;
                                                else if(log.actionDescription.toLowerCase().includes("menolak") || log.statusKey === 'rejected') ActionSpecificIcon = XCircle;
                                                else if(log.actionDescription.toLowerCase().includes("revisi") || log.statusKey === 'revised') ActionSpecificIcon = Edit3;
                                                else if(log.actionDescription.toLowerCase().includes("komentar")) ActionSpecificIcon = MessageSquare;
                                                else if(log.actorType === 'system' || log.isNotification) ActionSpecificIcon = Info;

                                                return (
                                                    <li key={log.id} className="p-3 md:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                                                        <div className="flex items-start space-x-3">
                                                            <div className={`flex-shrink-0 h-9 w-9 rounded-full ${avatarBg} flex items-center justify-center text-sm font-medium text-white`}> {/* Tanpa shadow */}
                                                                {avatarInitials}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                                                                    <strong className="font-semibold text-slate-800 dark:text-slate-100">{log.actorName}</strong>
                                                                    <span className="mx-1 text-slate-400 dark:text-slate-500">&bull;</span>
                                                                    <ActionSpecificIcon className={`inline h-4 w-4 mr-1 align-middle ${log.statusKey ? getStatusVisuals(log.statusKey).statusColor : 'text-slate-500 dark:text-slate-400'}`} />
                                                                    {log.actionDescription}
                                                                    {log.details && !log.remarks && <strong className="ml-1 text-slate-600 dark:text-slate-300">{` "${log.details}"`}</strong>}
                                                                </div>
                                                                {log.remarks && !log.isNotification && (
                                                                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600 pl-2.5 py-1 italic whitespace-pre-wrap bg-slate-50 dark:bg-slate-700/30 rounded-r-md">
                                                                        {log.remarks}
                                                                    </p>
                                                                )}
                                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                                                    {log.formattedTimestamp || formatDate(log.timestamp, "dd MMM yyyy, HH:mm:ss")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8 px-4">Belum ada riwayat aktivitas untuk permintaan ini.</p>
                                    )}
                                </CardContent>
                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}