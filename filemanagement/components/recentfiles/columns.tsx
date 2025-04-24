"use client";

import { ColumnDef, FilterFn, Row, Table, TableMeta } from "@tanstack/react-table";
import { ArrowUpDown, Clock1, FolderIcon, MoreHorizontal, PlusCircle } from "lucide-react";
import { JSX } from "react";
import { SupabaseClient } from '@supabase/supabase-js';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/recentfiles/sort";
import { DataTableRowActions, DataTableRowActionsProps } from "@/components/recentfiles/actions";
import { Schema } from "@/components/recentfiles/schema";
import { formatRelative, parseISO } from 'date-fns';
import { id } from 'date-fns/locale'; // Locale Bahasa Indonesia

// --- Filter Function Tanggal ---
import { isValid, startOfDay, endOfDay } from 'date-fns'; // Tambahkan import

// --- Interface MyTableMeta (Harus cocok dengan definisi di komponen induk) ---
interface MyTableMeta extends TableMeta<Schema> {
    accessToken: string | null | undefined;
    onActionComplete: (() => void) | undefined;
    supabase: SupabaseClient | null | undefined;
    userId: string | undefined | null;
    workspaceOrFolderId: string | null | undefined;
    onSelectFileForPreview?: (file: Schema) => void;
    onOpenPreviewSheet?: () => void;
    onAddPengesahanDate?: (file: Schema) => void; // Pastikan ada di sini juga
}

// ========================================================================
// Helper Functions (getFileIcon, getFriendlyFileType, formatRelativeTime)
// Tetap sama...
function getFileIcon(mimeType: string | undefined, isFolder: boolean | undefined, iconLink?: string | null): string { /* ... kode ... */ const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return iconLink || '/folder.svg'; if (iconLink) return iconLink; if (!effectiveMimeType) return '/file.svg'; if (effectiveMimeType.startsWith('image/')) return '/picture.svg'; if (effectiveMimeType.startsWith('video/')) return '/video.svg'; if (effectiveMimeType.startsWith('audio/')) return '/music.svg'; if (effectiveMimeType.startsWith('application/zip')) return '/zip.svg'; if (effectiveMimeType === 'application/pdf') return '/pdf.svg'; if (effectiveMimeType.includes('word')) return '/word.svg'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return '/ppt.svg'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return '/xlsx.svg'; if (effectiveMimeType === 'text/plain') return '/txt.svg'; if (effectiveMimeType.includes('html')) return '/web.svg'; if (effectiveMimeType.startsWith('text/')) return '/txt.svg'; if (effectiveMimeType === 'application/vnd.google-apps.document') return '/gdoc.svg'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return '/folder-google.svg'; return '/file.svg'; }
function getFriendlyFileType(mimeType: string | undefined, isFolder: boolean | undefined): string { /* ... kode ... */ const effectiveMimeType = mimeType || ''; const effectiveIsFolder = isFolder || false; if (effectiveIsFolder) return 'Folder'; if (!effectiveMimeType) return 'Tidak Dikenal'; if (effectiveMimeType.startsWith('image/')) return 'Gambar'; if (effectiveMimeType.startsWith('video/')) return 'Video'; if (effectiveMimeType.startsWith('audio/')) return 'Audio'; if (effectiveMimeType.startsWith('application/zip')) return 'Arsip ZIP'; if (effectiveMimeType === 'application/pdf') return 'Dokumen PDF'; if (effectiveMimeType.includes('word')) return 'Dokumen Word'; if (effectiveMimeType.includes('presentation') || effectiveMimeType.includes('powerpoint')) return 'Presentasi PPT'; if (effectiveMimeType.includes('sheet') || effectiveMimeType.includes('excel')) return 'Spreadsheet Excel'; if (effectiveMimeType === 'text/plain') return 'Teks Biasa'; if (effectiveMimeType.includes('html')) return 'Dokumen Web'; if (effectiveMimeType.startsWith('text/')) return 'Dokumen Teks'; if (effectiveMimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; if (effectiveMimeType === 'application/vnd.google-apps.document') return 'Google Docs'; if (effectiveMimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets'; if (effectiveMimeType === 'application/vnd.google-apps.presentation') return 'Google Slides'; if (effectiveMimeType.includes('/')) { const sub = effectiveMimeType.split('/')[1].replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ').trim(); return sub.charAt(0).toUpperCase() + sub.slice(1); } return 'File Lain'; }

function formatRelativeTimeWithDateFns(dateString: string | null | undefined): JSX.Element {
    if (!dateString) return <div className="text-xs text-gray-400">-</div>;
    try {
        const d = parseISO(dateString);
        if (isNaN(d.getTime())) return <div className="text-xs text-gray-400">Invalid</div>;
        const relativeTime = formatRelative(d, new Date(), { locale: id });
        return (
            <div className="flex items-center text-xs">
                <Clock1 size={14} className="mr-1.5 text-gray-500"/>
                <span className="truncate">{relativeTime.charAt(0).toUpperCase() + relativeTime.slice(1)}</span>
            </div>
        );
    } catch (e) {
         console.error("Error parsing date with date-fns:", dateString, e);
        return <div className="text-xs text-gray-400">Error</div>;
    }
}

// Filter tanggal tetap sama
const dateBetweenFilterFn: FilterFn<any> = ( row: Row<any>, columnId: string, filterValue: [Date | null, Date | null], addMeta: (meta: any) => void ) => {
    const dateStr = row.getValue(columnId) as string | null | undefined;
    const [filterFrom, filterTo] = filterValue;
    if (!dateStr) return false;
    let rowDate: Date;
    try {
         const compliantDateString = dateStr.replace(' ', 'T');
         rowDate = parseISO(compliantDateString);
         if (!isValid(rowDate)) return false;
    } catch (e) {
         return false;
    }
    const validFilterFrom = filterFrom instanceof Date && isValid(filterFrom) ? startOfDay(filterFrom) : null;
    const validFilterTo = filterTo instanceof Date && isValid(filterTo) ? endOfDay(filterTo) : null;
    const rowTime = rowDate.getTime();
    const fromTime = validFilterFrom ? validFilterFrom.getTime() : -Infinity;
    const toTime = validFilterTo ? validFilterTo.getTime() : Infinity;
    return rowTime >= fromTime && rowTime <= toTime;
};
// ========================================================================
// Definisi Kolom Utama
// ========================================================================
export const columns: ColumnDef<Schema>[] = [
    // --- Kolom Select ---
    { id: "select", header: ({table})=>(<Checkbox checked={table.getIsAllPageRowsSelected()||(table.getIsSomePageRowsSelected()&&"indeterminate")} onCheckedChange={(v)=>table.toggleAllPageRowsSelected(!!v)} aria-label="Select all"/>), cell: ({row})=>(<Checkbox checked={row.getIsSelected()} onCheckedChange={(v)=>row.toggleSelected(!!v)} aria-label="Select row"/>), size:50, enableSorting:false, enableHiding:false },

    // --- Kolom Nama File (Termasuk Deskripsi) ---
    {
        accessorKey: "filename",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        cell: ({ row, table }) => {
            const i = row.original;
            const icon = getFileIcon(i.mimeType, i.isFolder, i.iconLink);
            const fb = i.isFolder ? "DIR" : i.filename.split('.').pop()?.substring(0, 3).toUpperCase() || "FILE";
            const filename = i.filename;
            const description = i.description; // Ambil deskripsi
            const meta = table.options.meta as MyTableMeta | undefined;
            return (
                <div
                    className="flex items-start space-x-2 cursor-pointer group hover:bg-gray-50 -ml-2 pl-2 py-1 rounded" // Gunakan items-start agar deskripsi bisa di bawah
                    onClick={() => {
                        if (meta?.onSelectFileForPreview) meta.onSelectFileForPreview(i);
                        if (meta?.onOpenPreviewSheet) meta.onOpenPreviewSheet();
                    }}
                    title={`Klik untuk melihat detail ${filename}`}
                >
                    <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5"> {/* Sedikit margin top untuk avatar agar sejajar text */}
                        <AvatarImage src={icon} className="object-contain" />
                        <AvatarFallback className="text-[9px]">{fb}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col md:w-[250px]"> {/* Flex column untuk nama dan deskripsi */}
                        {/* Nama File */}
                        {i.webViewLink ? (
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-sm hover:underline block truncate break-words group-hover:text-blue-600"
                                title={`Lihat preview ${filename}`}
                            >
                                {filename}
                            </a>
                        ) : (
                            <span className="font-medium text-sm block break-words" title={filename}>
                                {filename}
                            </span>
                        )}
                        {/* Deskripsi (jika ada) */}
                        {description && (
                            <div
                                className="text-xs text-gray-500 mt-1 whitespace-normal overflow-hidden display-[-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]" // Batasi 2 baris
                                title={description}
                            >
                                {description}
                            </div>
                        )}
                    </div>
                </div>
            );
        },
        size: 300,
    },

    // --- Kolom Tipe File ---
    { accessorKey: "mimeType", header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />, cell: ({ row }) => { const i = row.original; const friendlyType = getFriendlyFileType(i.mimeType, i.isFolder); return ( <div className="w-[120px] text-xs text-gray-600 truncate break-words" title={i.mimeType ?? 'Tipe tidak diketahui'}>{friendlyType}</div> ); }, size: 120, },

    // --- Kolom Lokasi Folder ---
    { accessorKey: "pathname", header: "Lokasi", cell: ({ row }) => { const p = row.original.pathname || "-"; return ( <div className="w-[150px] text-xs text-gray-600 overflow-hidden truncate break-words" title={p}>{p}</div> ); }, size: 150, },

    // --- Kolom Deskripsi (DIHAPUS) ---
    // { accessorKey: "description", header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />, cell: ({ row }) => { const description = row.original.description || '-'; return ( <div className="w-[180px] whitespace-normal overflow-hidden display-[-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] text-xs" title={row.original.description || ''}>{description}</div> ); }, size: 180, },

    // --- Kolom Waktu Pengesahan (UPDATED NAME) ---
    {
        accessorKey: "pengesahan_pada",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Pengesahan" />, // Nama diubah
        cell: ({ row }) => formatRelativeTimeWithDateFns(row.getValue("pengesahan_pada")),
        sortingFn: 'datetime',
        filterFn: dateBetweenFilterFn,
        size: 120
    },

    // --- Kolom Dibuat (DIHAPUS) ---
    // { accessorKey: "createdat", header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />, cell: ({ row }) => formatRelativeTimeWithDateFns(row.getValue("createdat")), sortingFn: 'datetime', filterFn: dateBetweenFilterFn, size: 120 },

    // --- Kolom Perubahan Terakhir Unggahan (UPDATED NAME) ---
    {
        accessorKey: "lastmodified",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Perubahan Terakhir Unggahan" />, // Nama diubah
        cell: ({ row }) => formatRelativeTimeWithDateFns(row.getValue("lastmodified")),
        sortingFn: 'datetime',
        filterFn: dateBetweenFilterFn,
        size: 120
    },

    // --- Kolom Aksi ---
    { id: "actions", cell: ({ row, table }) => { /* ... kode cell aksi ... */ const meta = table.options.meta as MyTableMeta | undefined; if ( !meta?.onActionComplete || !meta?.supabase || !meta?.userId || !meta?.workspaceOrFolderId ) { console.error("Props penting aksi hilang:", row.original.id, { meta }); return <div className="flex justify-center items-center h-8 w-8 text-red-500" title="Aksi tidak tersedia (konfigurasi error)">!</div>; } const actionProps: DataTableRowActionsProps = { row: row, accessToken: meta?.accessToken ?? null, onActionComplete: meta.onActionComplete, supabase: meta.supabase, userId: meta.userId, workspaceId: meta.workspaceOrFolderId, }; return <DataTableRowActions {...actionProps} />; }, size: 80, enableSorting: false, enableHiding: false, },
];