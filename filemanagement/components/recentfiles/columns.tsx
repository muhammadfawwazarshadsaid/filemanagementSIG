"use client";

import { ColumnDef } from "@tanstack/react-table";
// Pastikan Schema menyertakan pathname dll.
import { Schema } from "@/components/recentfiles/schema"; // Sesuaikan path
import { DataTableColumnHeader } from "@/components/recentfiles/sort"; // Sesuaikan path
import { DataTableRowActions } from "@/components/recentfiles/actions"; // Sesuaikan path
import { ArrowUpDown, Clock1 } from "lucide-react"; // Hapus FolderIcon
import { Checkbox } from "@/components/ui/checkbox";
// import { Button } from "@/components/ui/button"; // Tidak perlu jika header pakai DataTableColumnHeader
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"; // Sesuaikan path
import { JSX } from "react";

// Helper getFileIcon (sama)
function getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'doc': case 'docx': case 'docs': return '/word.svg';
        case 'ppt': case 'pptx': return '/ppt.svg';
        case 'pdf': return '/pdf.svg';
        case 'xls': case 'xlsx': return '/xlsx.svg';
        // ... tambahkan case lain jika perlu
        default: return '/file.svg';
     }
}

// Helper formatRelativeTime (sama)
function formatRelativeTime(dateString: string | null | undefined): JSX.Element {
    if (!dateString) return <div className="text-xs text-gray-400">-</div>;
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.round((now.getTime() - date.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    if (diff < 60) return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500 flex-shrink-0" /><span className="truncate">{rtf.format(-diff, 'second')}</span></div>;
    const diffMinutes = Math.round(diff / 60);
    if (diffMinutes < 60) return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500 flex-shrink-0" /><span className="truncate">{rtf.format(-diffMinutes, 'minute')}</span></div>;
    const diffHours = Math.round(diff / 3600);
    if (diffHours < 24) return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500 flex-shrink-0" /><span className="truncate">{rtf.format(-diffHours, 'hour')}</span></div>;
    const diffDays = Math.round(diff / 86400);
    if (diffDays < 7) return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500 flex-shrink-0" /><span className="truncate">{rtf.format(-diffDays, 'day')}</span></div>;
    const formattedDate = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500 flex-shrink-0" /><span className="truncate">{formattedDate}</span></div>;
}

// Tipe Meta tidak diperlukan lagi
// interface MyTableMeta { /* ... */ }

// ========================================================================
// Definisi Kolom Utama (HANYA FILE + PATHNAME FOLDER)
// ========================================================================
export const columns: ColumnDef<Schema>[] = [
  // --- Kolom Select ---
  { id: "select", header: ({ table }) => (<Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all"/>), cell: ({ row }) => (<Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row"/>), enableSorting: false, enableHiding: false, size: 50 },

  // --- Kolom Nama File --- (Hanya render file)
  {
    accessorKey: "filename",
    header: ({ column }) => ( <DataTableColumnHeader column={column} title="Nama File" /> ),
    cell: ({ row }) => { // Tidak perlu 'table' lagi
      const item = row.original;
      const filename = item.filename;
      

      // Selalu render sebagai file
      return (
        <div className="flex items-center space-x-2">
           <Avatar className="h-5 w-5 flex-shrink-0">
             <AvatarImage src={getFileIcon(filename)} alt="ikon file" />
             <AvatarFallback className="text-[9px] font-bold">{(filename).split('.').pop()?.substring(0,3).toUpperCase() || "FILE"}</AvatarFallback>
           </Avatar>
           {/* Link ke Google Drive jika ada */}
           {item.webViewLink ? (
              <a href={item.webViewLink} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline truncate py-1" title={`Buka file ${filename}`} onClick={(e) => e.stopPropagation()}> {filename} </a>
           ) : ( <span className="font-medium text-sm truncate py-1" title={filename}>{filename}</span> )}
        </div>
      );
    },
    maxSize: 120,
  },

  // --- Kolom Pathname (Lokasi Folder) ---
  {
     accessorKey: "pathname",
     header: ({ column }) => ( <DataTableColumnHeader column={column} title="Lokasi Folder" /> ),
     cell: ({ row }) => {
        const folderPath = row.getValue("pathname") as string; // Ini adalah path folder saja
        return (
            <div className="text-xs text-gray-600 truncate w-[350px]" title={folderPath}>
                {folderPath}
            </div>
        );
     },
     size: 120,
  },

  // --- Kolom Deskripsi ---
  { accessorKey: "description", header: ({ column }) => ( <DataTableColumnHeader column={column} title="Deskripsi" /> ), cell: ({ row }) => ( <div className="w-[200px]"><span className="text-xs overflow-hidden text-ellipsis whitespace-normal line-clamp-3">{row.getValue("description") || '-'}</span></div> ), size: 220, },

  // --- Kolom Dibuat pada ---
  { accessorKey: "createdat", header: ({ column }) => ( <DataTableColumnHeader column={column} title="Dibuat" /> ), cell: ({ row }) => formatRelativeTime(row.getValue("createdat")), sortingFn: 'datetime', size: 180, },

  // --- Kolom Diperbarui terakhir ---
  { accessorKey: "lastmodified", header: ({ column }) => ( <DataTableColumnHeader column={column} title="Diubah" /> ), cell: ({ row }) => formatRelativeTime(row.getValue("lastmodified")), sortingFn: 'datetime', size: 180, },

  // --- Kolom Aksi ---
  { id: "actions", cell: ({ row }) => <DataTableRowActions row={row} />, size: 80, },
];