// File: components/approvals/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/recentfiles/sort";
import {
  ProcessedApprovalRequest,
  IndividualApprovalStatusKey,
  IndividualApproverAction
} from "./schema";
import { Avatar as ShadCNAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// Tooltip tidak lagi digunakan untuk kolom komentar ini, tapi mungkin masih untuk kolom lain
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO, isValid as isValidDate } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Edit3, Hourglass, Users, AlertCircle, Info, MessageSquare, MessagesSquare } from "lucide-react";
import { MyTableMeta as RecentFilesMyTableMeta } from "@/components/recentfiles/datatable";
import { Schema as RecentFileSchema } from "@/components/recentfiles/schema";
import { toast } from "sonner";
import React from "react";
import { ProcessedApprovalDataTableRowActions } from "./actions";

// Helper untuk ikon file
function getFileIcon(mimeType?: string | null, iconLink?: string | null): string {
  if (iconLink && !(mimeType || '').includes('google-apps')) return iconLink;
  if (!mimeType) return '/file.svg';
  if (mimeType.startsWith('image/')) return '/picture.svg';
  if (mimeType === 'application/pdf') return '/pdf.svg';
  if (mimeType.includes('word')) return '/word.svg';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '/ppt.svg';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '/xlsx.svg';
  if (mimeType === 'application/vnd.google-apps.document') return '/gdoc.svg';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg';
  if (mimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg';
  return '/file.svg';
}

// Helper untuk format tanggal
function formatDate(dateString?: string | null, dateFormat: string = "dd MMM yy, HH:mm"): string {
  if (!dateString) return "-";
  try {
    const date = parseISO(dateString);
    if (!isValidDate(date)) return "Tgl Invalid";
    return format(date, dateFormat, { locale: localeID });
  }
  catch (e) {
    console.warn("Invalid date string for formatDate:", dateString);
    return "Tgl Invalid";
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name || name.trim() === "" || name === "Anda") {
    return name === "Anda" ? "A" : "?";
  }
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + (words[1][0] || '')).toUpperCase();
  } else if (words.length === 1 && words[0].length > 0) {
    return words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
  }
  return "?";
}

export interface ApprovalsTableMeta extends RecentFilesMyTableMeta {
  onSelectFileForPreview: (file: RecentFileSchema) => void;
  onOpenPreviewSheet: () => void;
  makeApiCall: <T = any>(url: string, method?: string, body?: any, customHeaders?: Record<string, string>) => Promise<T | null>;
}

const getStatusVisuals = (statusKey: IndividualApprovalStatusKey | undefined) => {
  let StatusIcon: React.ElementType = AlertCircle;
  let statusColor = "text-muted-foreground";
  switch(statusKey) {
    case 'approved': StatusIcon = CheckCircle2; statusColor = "text-green-600 dark:text-green-400"; break;
    case 'revised': StatusIcon = Edit3; statusColor = "text-orange-500 dark:text-orange-400"; break;
    case 'rejected': StatusIcon = XCircle; statusColor = "text-red-600 dark:text-red-500"; break;
    case 'pending': StatusIcon = Hourglass; statusColor = "text-blue-500 dark:text-blue-400"; break;
    case 'unknown': default: StatusIcon = Info; statusColor = "text-gray-500 dark:text-gray-400"; break;
  }
  return { StatusIcon, statusColor };
};

export const columns = (): ColumnDef<ProcessedApprovalRequest>[] => [
  {
    id: "select",
    header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" className="translate-y-[2px]" /> ),
    cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="translate-y-[2px]" /> ),
    enableSorting: false, enableHiding: false, size: 40,
  },
  {
    accessorKey: "file",
    header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    cell: ({ row, table }) => {
      const request = row.original; const fileData = request.file; const meta = table.options.meta as ApprovalsTableMeta | undefined;
      if (!fileData || !fileData.id) { return <div className="text-xs text-muted-foreground">Info File Tdk Lengkap</div>; }
      const icon = getFileIcon(fileData.mimeType, fileData.iconLink); const filenameDisplay = fileData.filename || "Nama File Tidak Ada"; const fallback = filenameDisplay.substring(0, 2).toUpperCase();
      const handlePreviewClick = () => {
        if (!fileData?.id) { toast.warning("ID file tidak tersedia untuk preview."); return; }
        const fileForPreview: RecentFileSchema = {
          id: fileData.id, filename: filenameDisplay, isFolder: false,
          mimeType: fileData.mimeType || 'application/octet-stream',
          pathname: `Workspace: ${fileData.workspace_id || request.fileIdRef}`,
          description: fileData.description || "", webViewLink: null,
          iconLink: fileData.iconLink || getFileIcon(fileData.mimeType),
          createdat: request.createdAt, lastmodified: request.createdAt,
          pengesahan_pada: null, is_self_file: null,
        };
        if (meta?.onSelectFileForPreview && meta?.onOpenPreviewSheet) { meta.onSelectFileForPreview(fileForPreview); meta.onOpenPreviewSheet(); } else { toast.error("Fungsi preview file tidak terkonfigurasi."); }
      };
      return ( <div onClick={handlePreviewClick} className="flex items-start space-x-2 group cursor-pointer hover:bg-accent/50 -ml-2 pl-2 py-0.5 rounded" title={`Klik untuk preview ${filenameDisplay}`}> <ShadCNAvatar className="h-6 w-6 flex-shrink-0 mt-0.5"> <AvatarImage src={icon} alt={filenameDisplay} className="object-contain" /> <AvatarFallback className="text-[8px]">{fallback}</AvatarFallback> </ShadCNAvatar> <div className="flex flex-col min-w-0 md:w-[160px] lg:w-[200px]"> <span className="font-medium text-sm block truncate group-hover:text-blue-600">{filenameDisplay}</span> {fileData.description && (<p className="text-xs text-gray-500 truncate" title={fileData.description}>{fileData.description}</p>)} </div> </div> );
    }, size: 250, minSize: 200, maxSize: 400,
  },
  {
    accessorKey: "overallStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status Keseluruhan" />,
    cell: ({ row }) => {
      const status = row.original.overallStatus; let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline"; let IconComp: React.ElementType | null = AlertCircle; let textColor = "text-foreground";
      switch (status) { case 'Sah': badgeVariant = "default"; IconComp = CheckCircle2; textColor = "text-green-700 dark:text-green-400"; break; case 'Perlu Revisi': badgeVariant = "destructive"; IconComp = Edit3; textColor = "text-orange-600 dark:text-orange-400"; break; case 'Ditolak': badgeVariant = "destructive"; IconComp = XCircle; textColor = "text-red-700 dark:text-red-500"; break; case 'Menunggu Persetujuan': badgeVariant = "secondary"; IconComp = Hourglass; textColor = "text-blue-600 dark:text-blue-400"; break; case 'Belum Ada Tindakan': badgeVariant = "outline"; IconComp = Info; textColor = "text-muted-foreground"; break; }
      return ( <Badge variant={badgeVariant} className={`capitalize text-xs whitespace-nowrap border ${ badgeVariant === 'default' ? 'bg-green-100 border-green-300 dark:bg-green-800/30 dark:border-green-700' : badgeVariant === 'secondary' ? 'bg-blue-100 border-blue-300 dark:bg-blue-800/30 dark:border-blue-700' : badgeVariant === 'destructive' && status === 'Perlu Revisi' ? 'bg-orange-100 border-orange-300 dark:bg-orange-800/30 dark:border-orange-700' : badgeVariant === 'destructive' ? 'bg-red-100 border-red-300 dark:bg-red-800/30 dark:border-red-700' : 'border-border dark:border-slate-700'}`}> {IconComp && <IconComp className={`mr-1.5 h-3.5 w-3.5 ${textColor}`} />} <span className={textColor}>{status}</span> </Badge> );
    }, size: 180, minSize: 150,
  },
  {
    id: "approverActions",
    header: ({column}) => <DataTableColumnHeader column={column} title="Progres Approver" />,
    cell: ({ row }) => {
      const actions = row.original.approverActions;
      if (!actions || actions.length === 0) return <span className="text-xs text-muted-foreground">- Tidak ada approver -</span>;
      return (
        // TooltipProvider di sini mungkin tidak lagi diperlukan jika Tooltip hanya di kolom Komentar (yang kini diubah)
        // atau jika sudah ada provider global.
        <div className="flex flex-col items-start space-y-1.5 cursor-default py-1 w-full max-w-xs">
          <ul className="space-y-1.5 w-full">
            {actions.map((action, idx) => {
              const { StatusIcon, statusColor } = getStatusVisuals(action.statusKey);
              const initials = getInitials(action.approverName);
              const displayName = action.approverName || 'Approver N/A';
              // Jika remarks ingin ditampilkan juga di tooltip ini, pastikan ada
              const tooltipContent = (
                <>
                  <p className="font-semibold">{displayName}</p>
                  {action.approverEmail && <p className="text-muted-foreground">{action.approverEmail}</p>}
                  {action.remarks && <p className="mt-1 pt-1 border-t border-border">Catatan: {action.remarks}</p>}
                  {action.actioned_at && <p className="text-xs text-muted-foreground mt-1">Pada: {formatDate(action.actioned_at, "dd MMM yy, HH:mm")}</p>}
                </>
              );

              return (
                <li key={`${action.approverId}-${action.actioned_at || idx}`} className="flex items-center text-xs space-x-2 w-full">
                  <TooltipProvider delayDuration={100}> {/* Dibutuhkan jika tooltip masih dipakai di sini */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <div className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{initials}</span>
                          </div>
                          <span className="truncate max-w-[100px]" title={displayName + (action.approverEmail ? ` (${action.approverEmail})` : '')}>
                            {displayName}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-xs break-words">
                        {tooltipContent}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className={`flex items-center space-x-1 ${statusColor} whitespace-nowrap ml-auto`}>
                    <StatusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="capitalize">{action.statusDisplay}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          {actions.length === 0 && <p className="text-xs text-muted-foreground">Belum ada tindakan.</p>}
        </div>
      );
    },
    size: 260, minSize: 220,
  },
  // --- KOLOM KOMENTAR (DIMODIFIKASI) ---
  {
    id: "allRemarks", // Ganti ID agar lebih deskriptif
    accessorFn: row => {
        // Accessor untuk sorting bisa berdasarkan jumlah komentar atau teks gabungan (mungkin kurang berguna)
        // Untuk display semua, accessor mungkin tidak terlalu kritikal selain untuk filtering.
        return row.approverActions.filter(action => action.remarks).map(action => action.remarks).join(' ');
    },
    header: ({ column }) => <DataTableColumnHeader column={column} title="Komentar" />, // Judul lebih umum
    cell: ({ row }) => {
      const actionsWithRemarks = row.original.approverActions
        .filter(action => action.remarks && action.remarks.trim() !== '') // Hanya yang punya remarks non-kosong
        .sort((a, b) => { // Urutkan berdasarkan actioned_at, yang terbaru di atas
          if (a.actioned_at && b.actioned_at) {
            return new Date(a.actioned_at).getTime() - new Date(b.actioned_at).getTime(); // Yang lebih awal dulu
          }
          if (a.actioned_at) return -1;
          if (b.actioned_at) return 1;
          return 0;
        });

      if (actionsWithRemarks.length === 0) {
        return <span className="text-xs text-muted-foreground">Tidak ada komentar.</span>;
      }

      return (
        <div className="text-xs w-full space-y-2 py-1"> {/* Izinkan konten tumbuh dan beri jarak antar komentar */}
          {actionsWithRemarks.map((action, index) => (
            <div key={index} className="p-1.5 border-l-2 border-slate-300 dark:border-slate-600 pl-2 bg-slate-50 dark:bg-slate-800/30 rounded-r-sm">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {action.approverName || 'N/A'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {action.actioned_at ? formatDate(action.actioned_at, "dd MMM, HH:mm") : ""}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words leading-snug">
                {action.remarks}
              </p>
            </div>
          ))}
        </div>
      );
    },
    size: 300, minSize: 250, // Beri lebar yang cukup
    enableSorting: false, // Sorting kolom ini mungkin kurang intuitif jika menampilkan semua komentar
  },
  // --- END KOLOM KOMENTAR ---
  {
    accessorKey: "assigner.displayname",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pengaju" />,
    cell: ({ row }) => {
      const assigner = row.original.assigner;
      const displayName = assigner?.displayname || "N/A";
      return (
        <div className="flex flex-col text-xs w-[120px] min-w-0">
          <span className="font-medium truncate" title={displayName + (assigner?.primaryemail ? ` (${assigner.primaryemail})` : '')}>
            {displayName}
          </span>
          {assigner?.primaryemail && displayName !== "Anda" && (
            <span className="text-muted-foreground truncate" title={assigner.primaryemail}>
              {assigner.primaryemail}
            </span>
          )}
        </div>
      );
    }, size: 150, minSize: 120,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Diajukan" />,
    cell: ({ row }) => <div className="text-xs w-[110px] whitespace-nowrap">{formatDate(row.original.createdAt)}</div>, size: 130, minSize: 120,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row, table }) => {
      return <ProcessedApprovalDataTableRowActions row={row} meta={table.options.meta as ApprovalsTableMeta} />;
    },
    size: 70,
    enableSorting: false,
  },
];