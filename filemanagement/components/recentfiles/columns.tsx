"use client";

import { ColumnDef, FilterFn, Row, Table, TableMeta } from "@tanstack/react-table";
import { ArrowUpDown, Clock1, FolderIcon, MoreHorizontal } from "lucide-react";
import { JSX } from "react";
import { SupabaseClient } from '@supabase/supabase-js';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/recentfiles/sort";
import { DataTableRowActions, DataTableRowActionsProps } from "@/components/recentfiles/actions";
import { Schema } from "@/components/recentfiles/schema";

// ========================================================================
// Helper Functions (getFileIcon, getFriendlyFileType, formatRelativeTime)
// ========================================================================
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string {
    const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false;
    if (effectiveIsFolder) return iconLink || '/folder.svg'; if (iconLink) return iconLink; if (!effectiveMimeType) return '/file.svg';
    if (effectiveMimeType.startsWith('image/')) return '/picture.svg'; if (effectiveMimeType.startsWith('video/')) return '/video.svg'; if (effectiveMimeType.startsWith('audio/')) return '/music.svg';
    if (effectiveMimeType.startsWith('application/zip')) return '/zip.svg'; if (effectiveMimeType === 'application/pdf') return '/pdf.svg'; if (effectiveMimeType.includes('word')) return '/word.svg';
    if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return '/ppt.svg'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return '/xlsx.svg';
    if (effectiveMimeType === 'text/plain') return '/txt.svg'; if (effectiveMimeType.includes('html')) return '/web.svg'; if (effectiveMimeType.startsWith('text/')) return '/txt.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg';
    if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; return '/file.svg';
}
function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string {
     const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return 'Folder'; if (!effectiveMimeType) return 'Tidak Dikenal';
     if (effectiveMimeType.startsWith('image/')) return 'Gambar'; if (effectiveMimeType.startsWith('video/')) return 'Video'; if (effectiveMimeType.startsWith('audio/')) return 'Audio';
     if (effectiveMimeType.startsWith('application/zip')) return 'Arsip ZIP'; if (effectiveMimeType === 'application/pdf') return 'Dokumen PDF'; if (effectiveMimeType.includes('word')) return 'Dokumen Word';
     if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return 'Presentasi PPT'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return 'Spreadsheet Excel';
     if (effectiveMimeType === 'text/plain') return 'Teks Biasa'; if (effectiveMimeType.includes('html')) return 'Dokumen Web'; if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks';
     if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs';
     if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides';
     if (effectiveMimeType.includes('/')) { const sub = effectiveMimeType.split('/')[1].replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ').trim(); return sub.charAt(0).toUpperCase() + sub.slice(1); } return 'File Lain';
}
function formatRelativeTime(dateString: string | null | undefined): JSX.Element {
    if (!dateString) return <div className="text-xs text-gray-400">-</div>;
    try { const d = new Date(dateString); if (isNaN(d.getTime())) return <div className="text-xs text-gray-400">Invalid</div>; const n=new Date(); const df=Math.round((n.getTime()-d.getTime())/1000); const r=new Intl.RelativeTimeFormat('id',{numeric:'auto'}); if(df<60&&df>=0)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-df,'second')}</span></div>; const dm=Math.round(df/60); if(dm<60&&df>=0)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-dm,'minute')}</span></div>; const dh=Math.round(df/3600); if(dh<24&&df>=0)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-dh,'hour')}</span></div>; const dd=Math.round(df/86400); if(dd<=7&&df>=0)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-dd,'day')}</span></div>; const fd=d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}); return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{fd}</span></div>;} catch(e){ return <div className="text-xs text-gray-400">Error</div>; }
}

// --- Filter Function Tanggal ---
const dateBetweenFilterFn: FilterFn<any> = ( row: Row<any>, columnId: string, filterValue: [Date | null, Date | null], addMeta: (meta: any) => void ) => {
    const date = row.getValue(columnId) as string | Date | null | undefined; const [from, to] = filterValue; if (!date) return false;
    let rowDate: Date; try { rowDate = new Date(date); if (isNaN(rowDate.getTime())) return false; } catch (e) { return false; }
    const toEndOfDay = to ? new Date(to.getTime()) : null; if (toEndOfDay) { toEndOfDay.setHours(23, 59, 59, 999); }
    const isAfterFrom = from ? rowDate.getTime() >= from.getTime() : true; const isBeforeTo = toEndOfDay ? rowDate.getTime() <= toEndOfDay.getTime() : true; return isAfterFrom && isBeforeTo;
};

// --- Interface Meta (diperbarui) ---
interface MyTableMeta extends TableMeta<Schema> {
    accessToken: string | null | undefined;
    onActionComplete: (() => void) | undefined;
    supabase: SupabaseClient | null | undefined;
    userId: string | undefined | null;
    workspaceOrFolderId: string | null | undefined;
    onSelectFileForPreview?: (file: Schema) => void;
    onOpenPreviewSheet?: () => void; // <-- Tambahkan ini
}

// ========================================================================
// Definisi Kolom Utama
// ========================================================================
export const columns: ColumnDef<Schema>[] = [
    // --- Kolom Select ---
    { id: "select", header: ({table})=>(<Checkbox checked={table.getIsAllPageRowsSelected()||(table.getIsSomePageRowsSelected()&&"indeterminate")} onCheckedChange={(v)=>table.toggleAllPageRowsSelected(!!v)} aria-label="Select all"/>), cell: ({row})=>(<Checkbox checked={row.getIsSelected()} onCheckedChange={(v)=>row.toggleSelected(!!v)} aria-label="Select row"/>), size:50, enableSorting:false, enableHiding:false },

    // --- Kolom Nama File (MODIFIED onClick) ---
    {
        accessorKey: "filename",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        cell: ({ row, table }) => {
            const i = row.original; const icon = getFileIcon(i.mimeType, i.isFolder, i.iconLink); const fb = i.isFolder ? "DIR" : i.filename.split('.').pop()?.substring(0, 3).toUpperCase() || "FILE"; const filename = i.filename; const meta = table.options.meta as MyTableMeta | undefined;
            return (
                <div className="flex items-center space-x-2 cursor-pointer group hover:bg-gray-50 -ml-2 pl-2 rounded"
                    onClick={() => { // <-- onClick di sini
                        if (meta?.onSelectFileForPreview) meta.onSelectFileForPreview(i);
                        if (meta?.onOpenPreviewSheet) meta.onOpenPreviewSheet();
                    }} title={`Klik untuk melihat detail ${filename}`} >
                    <Avatar className="h-6 w-6 flex-shrink-0"><AvatarImage src={icon} className="object-contain" /><AvatarFallback className="text-[9px]">{fb}</AvatarFallback></Avatar>
                    <div className="md:w-[250px] truncate break-words">
                        {i.webViewLink ? ( <a target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline block truncate break-words group-hover:text-blue-600" title={`Lihat preview ${filename}`} >{filename}</a>
                        ) : ( <span className="font-medium text-sm block break-words" title={filename}>{filename}</span> )}
                    </div>
                </div> );
        }, size: 300,
    },

    // --- Kolom Tipe File ---
    { accessorKey: "mimeType", header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />, cell: ({ row }) => { const i = row.original; const friendlyType = getFriendlyFileType(i.mimeType, i.isFolder); return ( <div className="w-[120px] text-xs text-gray-600 truncate break-words" title={i.mimeType ?? 'Tipe tidak diketahui'}>{friendlyType}</div> ); }, size: 120, },

    // --- Kolom Lokasi Folder ---
    { accessorKey: "pathname", header: "Lokasi", cell: ({ row }) => { const p = row.original.pathname || "-"; return ( <div className="w-[150px] text-xs text-gray-600 overflow-hidden truncate break-words" title={p}>{p}</div> ); }, size: 150, },

    // --- Kolom Deskripsi ---
    { accessorKey: "description", header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />, cell: ({ row }) => { const description = row.original.description || '-'; return ( <div className="w-[180px] whitespace-normal overflow-hidden display-[-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] text-xs" title={row.original.description || ''}>{description}</div> ); }, size: 180, },

    // --- Kolom Dibuat ---
    { accessorKey: "createdat", header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />, cell: ({ row }) => formatRelativeTime(row.getValue("createdat")), sortingFn: 'datetime', filterFn: dateBetweenFilterFn, size: 120 },

    // --- Kolom Diperbarui terakhir ---
    { accessorKey: "lastmodified", header: ({ column }) => <DataTableColumnHeader column={column} title="Diubah" />, cell: ({ row }) => formatRelativeTime(row.getValue("lastmodified")), sortingFn: 'datetime', filterFn: dateBetweenFilterFn, size: 120 },

    // --- Kolom Aksi ---
    { id: "actions", cell: ({ row, table }) => { const meta = table.options.meta as MyTableMeta | undefined; if ( !meta?.onActionComplete || !meta?.supabase || !meta?.userId || !meta?.workspaceOrFolderId ) { console.error("Props penting aksi hilang:", row.original.id, { meta }); return <div className="flex justify-center items-center h-8 w-8 text-red-500" title="Aksi tidak tersedia (konfigurasi error)">!</div>; } const actionProps: DataTableRowActionsProps = { row: row, accessToken: meta?.accessToken ?? null, onActionComplete: meta.onActionComplete, supabase: meta.supabase, userId: meta.userId, workspaceId: meta.workspaceOrFolderId, }; return <DataTableRowActions {...actionProps} />; }, size: 80, enableSorting: false, enableHiding: false, },
];