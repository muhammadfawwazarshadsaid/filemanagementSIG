"use client";

import React, { useEffect, useState, useCallback, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar as ShadCNAvatar, AvatarFallback } from "@/components/ui/avatar";
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
    CalendarDays
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
    CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Impor tipe dari schema.ts Anda
import {
    ApprovalFile,
    ApprovalUser,
    IndividualApproverAction,
    OverallApprovalStatusKey,
    IndividualApprovalStatusKey
} from '@/components/approvals/schema';

// Helper Functions (bisa dipindah ke file utils)
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
        if (!isValidDate(date)) return "Tanggal Tidak Valid";
        return format(date, customFormat, { locale: localeID });
    } catch (e) {
        return "Format Tanggal Salah";
    }
}

// Tipe untuk detail approval yang di-fetch (HARUS SAMA DENGAN YANG DIKEMBALIKAN API ANDA)
interface ApprovalRequestDetail {
    fileIdRef: string;
    file: (ApprovalFile & { 
        gdrive_fetch_error?: string | null; 
        mimeType?: string | null; // Pastikan ada mimeType untuk ikon
        description?: string | null; 
        db_created_at?: Date | string | null; 
        db_updated_at?: Date | string | null; 
        pengesahan_pada?: Date | string | null; 
        color?: string | null; 
        labels?: string[]; 
    }) | null;
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
        details?: string;
        timestamp: string;
        statusKey?: IndividualApprovalStatusKey;
        remarks?: string;
        isNotification?: boolean;
    }>;
}

const getStatusVisuals = (statusKey?: IndividualApprovalStatusKey | OverallApprovalStatusKey) => {
    let StatusIcon: React.ElementType = Info;
    let statusColor = "text-gray-500 dark:text-gray-400";
    let barBgColor = "bg-gray-300 dark:bg-gray-600"; // Warna bar default
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
    const fileId = params.fileId as string;

    const [detail, setDetail] = useState<ApprovalRequestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            setAccessToken(token);
        } else {
            toast.error("Autentikasi Gagal", { description: "Token tidak ditemukan. Silakan login kembali."});
            // router.push("/masuk?reason=no_token"); 
        }
    }, [router]);

    const fetchApprovalDetail = useCallback(async (id: string) => {
        if (!accessToken) {
            setError("Token akses tidak valid atau tidak tersedia untuk memuat detail.");
            setIsLoading(false); // Set loading false jika tidak ada token
            // toast.error("Gagal Memuat Detail", { description: "Token akses tidak ditemukan." }); // Dihandle di useEffect
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/approvals/getinfo?fileIdRef=${id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            const result = await response.json(); // Selalu coba parse JSON responsnya

            if (!response.ok) {
                throw new Error(result.error || `Gagal mengambil detail approval: Server merespons dengan status ${response.status}`);
            }
            
            if (result.data) {
                setDetail(result.data as ApprovalRequestDetail);
            } else {
                throw new Error(result.error || "Data tidak ditemukan dalam respons API.");
            }
        } catch (err: any) {
            console.error("Error fetching approval detail:", err);
            setError(err.message);
            setDetail(null);
            // toast.error("Gagal Memuat Detail Approval", { description: err.message }); // Dihandle di render
        } finally {
            setIsLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (fileId && accessToken) {
            fetchApprovalDetail(fileId);
        } else if (fileId && !accessToken) {
            // Jangan langsung error jika accessToken masih loading dari useEffect pertama
            // Tunggu accessToken terisi atau jika setelah beberapa saat tetap null, baru tampilkan error
            // Untuk sekarang, kita biarkan fetchApprovalDetail yang menghandle jika token null
            // Atau bisa set error setelah timeout jika token tidak kunjung ada.
             if (!isLoading && !accessToken) { // Jika sudah tidak loading awal page & token masih null
                setError("Sesi tidak valid atau token tidak ditemukan.");
             }
        } else if (!fileId) {
            setError("ID File tidak valid atau tidak ditemukan.");
            setIsLoading(false);
        }
    }, [fileId, accessToken, fetchApprovalDetail, isLoading]); // isLoading ditambahkan untuk re-check

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" /> <span className="ml-3 text-lg text-muted-foreground">Memuat Detail Persetujuan...</span></div>;
    }

    if (error || !detail) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900">
                 <header className="bg-background dark:bg-slate-800/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30">
                    <div className="max-w-5xl mx-auto flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Kembali</span>
                        </Button>
                        <h1 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 truncate">
                            Error
                        </h1>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Gagal Memuat Detail</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">{error || "Data detail approval tidak dapat ditemukan atau terjadi kesalahan pada server."}</p>
                        <div className="flex space-x-3 justify-center">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
                            </Button>
                            {fileId && accessToken && 
                                <Button onClick={() => { setIsLoading(true); fetchApprovalDetail(fileId); }} disabled={isLoading}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                                </Button>
                            }
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const { StatusIcon: OverallStatusIconComponent, statusColor: overallStatusColorClass, badgeVariant: overallBadgeVariant } = getStatusVisuals(detail.overallStatus);

    return (
        <TooltipProvider>
        <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900">
            <header className="bg-background dark:bg-slate-800/70 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Kembali</span>
                    </Button>
                    <h1 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-slate-100 truncate" title={detail.file?.filename || "Detail Persetujuan"}>
                        Detail Persetujuan
                    </h1>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Informasi File */}
                    <Card className="overflow-hidden shadow-md dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardHeader className="bg-slate-50 dark:bg-slate-700/30 p-4 md:p-5 border-b dark:border-slate-700">
                            <div className="flex items-start space-x-3 md:space-x-4">
                                <FileTextIcon className="h-7 w-7 md:h-8 md:w-8 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight" title={detail.file?.filename || undefined}>
                                        {detail.file?.filename || "Nama File Tidak Diketahui"}
                                    </CardTitle>
                                    <CardDescription className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                        Diajukan oleh: <span className="font-medium text-slate-700 dark:text-slate-300">{detail.assigner?.displayname || "N/A"}</span>
                                        <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                                        <CalendarDays className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
                                        {formatDate(detail.createdAt)}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 md:p-5 text-sm text-slate-700 dark:text-slate-300 space-y-3">
                            {detail.file?.description && <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.file.description}</p>}
                             <Badge variant={overallBadgeVariant} className={`text-xs ${overallStatusColorClass}`}>
                                <OverallStatusIconComponent className={`mr-1.5 h-3.5 w-3.5`} />
                                Status Keseluruhan: {detail.overallStatus}
                            </Badge>
                            {detail.file?.gdrive_fetch_error && (
                                <p className="text-xs text-red-500 dark:text-red-400 italic bg-red-50 dark:bg-red-900/20 p-2 rounded-md">Error Google Drive: {detail.file.gdrive_fetch_error}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Approver - Bar Step */}
                    <Card className="shadow-md dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardHeader className="pb-3 pt-4 px-4 md:px-5">
                            <CardTitle className="text-base md:text-lg font-semibold flex items-center text-slate-700 dark:text-slate-200">
                                <Users className="mr-2.5 h-5 w-5 text-slate-500 dark:text-slate-400"/>Progres Persetujuan ({detail.approvers.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-4 md:px-5 pb-4 md:pb-5">
                            {detail.approvers && detail.approvers.length > 0 ? (
                                <div className="relative flex items-start pt-2 pb-1 space-x-0 overflow-x-auto snap-x snap-mandatory no-scrollbar">
                                    {detail.approvers.map((approver, index) => {
                                        const { StatusIcon, statusColor, barBgColor } = getStatusVisuals(approver.statusKey);
                                        const initials = getInitials(approver.approverName);
                                        const isLast = index === detail.approvers.length - 1;
                                        return (
                                            <Fragment key={approver.approverId + index + (approver.actioned_at || '')}> {/* Kunci lebih unik */}
                                                <TooltipProvider delayDuration={150}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex flex-col items-center flex-shrink-0 w-24 md:w-28 p-2 snap-center hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md cursor-default transition-colors">
                                                                <div className={`relative h-10 w-10 rounded-full ${getAvatarBgColor(approver.approverName)} flex items-center justify-center text-white text-base font-medium mb-1.5 shadow`}>
                                                                    {initials}
                                                                    <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full bg-card dark:bg-slate-800 border-2 ${statusColor.includes('green') ? 'border-green-500' : statusColor.includes('red') ? 'border-red-500' : statusColor.includes('orange') ? 'border-orange-500' : statusColor.includes('blue') ? 'border-blue-500' : 'border-gray-400'}`}>
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
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom" className="text-xs max-w-xs bg-background dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                                            <p className="font-semibold text-foreground dark:text-slate-100">{approver.approverName || 'N/A'}</p>
                                                            <p className="text-muted-foreground">Status: <span className={`capitalize ${statusColor}`}>{approver.statusDisplay}</span></p>
                                                            {approver.actioned_at && <p className="text-muted-foreground">Tanggal: {formatDate(approver.actioned_at)}</p>}
                                                            {approver.remarks && <p className="mt-1 border-t border-slate-200 dark:border-slate-700 pt-1 text-muted-foreground">Komentar: <em className="text-foreground/80 dark:text-slate-300/80 whitespace-pre-wrap">{approver.remarks}</em></p>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                {!isLast && ( // Garis penghubung
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
                    </Card>

                    {/* Log Aktivitas */}
                    <Card className="shadow-md dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardHeader className="pb-3 pt-4 px-4 md:px-5">
                            <CardTitle className="text-base md:text-lg font-semibold text-slate-700 dark:text-slate-200">Log Aktivitas</CardTitle>
                        </CardHeader>
                        <CardContent className="px-0">
                            {detail.activityLog && detail.activityLog.length > 0 ? (
                                <ul className="divide-y divide-slate-200 dark:divide-slate-700/50 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {detail.activityLog.map((log) => {
                                        const { StatusIcon: LogStatusIcon, statusColor: logStatusColor } = getStatusVisuals(log.statusKey);
                                        const avatarInitials = getInitials(log.actorName);
                                        const avatarBg = getAvatarBgColor(log.actorName);
                                        
                                        let ActionSpecificIcon = FileTextIcon; 
                                        if(log.actionDescription.toLowerCase().includes("mengajukan")) ActionSpecificIcon = Edit3;
                                        else if(log.actionDescription.toLowerCase().includes("menyetujui") || log.statusKey === 'approved') ActionSpecificIcon = CheckCircle2;
                                        else if(log.actionDescription.toLowerCase().includes("menolak") || log.statusKey === 'rejected') ActionSpecificIcon = XCircle;
                                        else if(log.actionDescription.toLowerCase().includes("revisi") || log.statusKey === 'revised') ActionSpecificIcon = Edit3;
                                        else if(log.actionDescription.toLowerCase().includes("komentar")) ActionSpecificIcon = MessageSquare;
                                        else if(log.actorType === 'system') ActionSpecificIcon = Info;


                                        return (
                                            <li key={log.id} className="p-3 md:p-4 hover:bg-slate-100/70 dark:hover:bg-slate-700/30 transition-colors">
                                                <div className="flex items-start space-x-3">
                                                    <div className={`flex-shrink-0 h-9 w-9 rounded-full ${avatarBg} flex items-center justify-center text-sm font-medium text-white shadow`}>
                                                        {avatarInitials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                                                            <strong className="font-semibold text-slate-800 dark:text-slate-100">{log.actorName}</strong>
                                                            <span className="mx-1 text-slate-400 dark:text-slate-500">&bull;</span>
                                                            <ActionSpecificIcon className={`inline h-4 w-4 mr-1 align-middle ${log.statusKey ? logStatusColor : 'text-slate-500 dark:text-slate-400'}`} />
                                                            {log.actionDescription}
                                                            {log.details && !log.remarks && <strong className="ml-1 text-slate-600 dark:text-slate-300">{` "${log.details}"`}</strong>}
                                                        </div>
                                                        {log.remarks && (
                                                            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600 pl-2.5 py-1 italic whitespace-pre-wrap bg-slate-50 dark:bg-slate-700/30 rounded-r-md">
                                                                {log.remarks}
                                                            </p>
                                                        )}
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                                            {formatDate(log.timestamp, "dd MMM yyyy, HH:mm:ss")}
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
                    </Card>
                </div>
            </main>
        </div>
        </TooltipProvider>
    );
}