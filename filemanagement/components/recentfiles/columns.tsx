// src/components/recentfiles/columns.tsx
"use client";

import { ColumnDef, FilterFn, Row, Table } from "@tanstack/react-table";
import { ArrowUpDown, Clock1, FolderIcon, MoreHorizontal } from "lucide-react";
import { JSX } from "react";
import { SupabaseClient } from '@supabase/supabase-js';

// Impor Komponen UI dan Helper
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/recentfiles/sort";
import { DataTableRowActions, DataTableRowActionsProps } from "@/components/recentfiles/actions"; // Pastikan path ini benar
import { Schema } from "@/components/recentfiles/schema";

// ========================================================================
// Helper Functions (Sama seperti sebelumnya)
// ========================================================================
function getFileIcon(mimeType: string, isFolder: boolean, iconLink?: string | null): string { /* ... implementasi ... */
    if (isFolder) return iconLink || '/folder.svg'; if (iconLink) return iconLink; if (!mimeType) return '/file.svg';
    if (mimeType.startsWith('image/')) return '/picture.svg'; if (mimeType.startsWith('video/')) return '/video.svg'; if (mimeType.startsWith('audio/')) return '/music.svg';
    if (mimeType.startsWith('application/zip')) return '/zip.svg'; if (mimeType === 'application/pdf') return '/pdf.svg'; if (mimeType.includes('word')) return '/word.svg';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '/ppt.svg'; if (mimeType.includes('sheet') || mimeType.includes('excel')) return '/xlsx.svg';
    if (mimeType === 'text/plain') return '/txt.svg'; if (mimeType.includes('html')) return '/web.svg'; if (mimeType.startsWith('text/')) return '/txt.svg';
    if (mimeType === 'application/vnd.google-apps.document') return '/gdoc.svg'; if (mimeType === 'application/vnd.google-apps.spreadsheet') return '/gsheet.svg'; if (mimeType === 'application/vnd.google-apps.presentation') return '/gslide.svg';
    return '/file.svg';
}
function getFriendlyFileType(mimeType: string, isFolder: boolean): string { /* ... implementasi ... */
    if (isFolder) return 'Folder'; if (!mimeType) return 'Tidak Dikenal';
    if (mimeType.startsWith('image/')) return 'Gambar'; if (mimeType.startsWith('video/')) return 'Video'; if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('application/zip')) return 'Arsip ZIP'; if (mimeType === 'application/pdf') return 'Dokumen PDF'; if (mimeType.includes('word')) return 'Dokumen Word';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentasi PPT'; if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Spreadsheet Excel';
    if (mimeType === 'text/plain') return 'Teks Biasa'; if (mimeType.includes('html')) return 'Dokumen Web'; if (mimeType.startsWith('text/')) return 'Dokumen Teks';
    if (mimeType === 'application/vnd.google-apps.folder') return 'Folder Google'; if (mimeType === 'application/vnd.google-apps.document') return 'Google Docs';
    if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets'; if (mimeType === 'application/vnd.google-apps.presentation') return 'Google Slides';
    if (mimeType.includes('/')) { const sub = mimeType.split('/')[1].replace(/^vnd\.|\.|\+xml|x-|google-apps\./g, ' ').trim(); return sub.charAt(0).toUpperCase() + sub.slice(1); } return 'File Lain';
}
function formatRelativeTime(dateString: string | null | undefined): JSX.Element { /* ... implementasi ... */
    if (!dateString) return <div className="text-xs text-gray-400">-</div>; try { const d=new Date(dateString); if (isNaN(d.getTime())) return <div className="text-xs text-gray-400">Invalid</div>; const n=new Date(); const df=Math.round((n.getTime()-d.getTime())/1000); const r=new Intl.RelativeTimeFormat('id',{numeric:'auto'}); if(df<60)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-df,'second')}</span></div>; const dm=Math.round(df/60); if(dm<60)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-dm,'minute')}</span></div>; const dh=Math.round(df/3600); if(dh<24)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-dh,'hour')}</span></div>; const dd=Math.round(df/86400); if(dd<=7&&df>=0)return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{r.format(-dd,'day')}</span></div>; const fd=d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}); return <div className="flex items-center text-xs"><Clock1 size={14} className="mr-1.5 text-gray-500"/><span className="truncate">{fd}</span></div>;} catch(e){ return <div className="text-xs text-gray-400">Error</div>; }
}
// --- Contoh Custom Filter Function untuk Rentang Tanggal ---
const dateBetweenFilterFn: FilterFn<any> = (
  row: Row<any>,
  columnId: string,
  filterValue: [Date | null, Date | null], // Nilai filter adalah [from, to]
  addMeta: (meta: any) => void
) => {
  const date = row.getValue(columnId) as string | Date | null | undefined;
  const [from, to] = filterValue;

  if (!date) {
    return false; // Atau true jika Anda ingin baris tanpa tanggal tetap muncul
  }

  // Coba konversi ke objek Date jika belum
  let rowDate: Date;
  try {
    rowDate = new Date(date);
    if (isNaN(rowDate.getTime())) {
        console.warn(`Invalid date format in column ${columnId} for row ${row.id}:`, date);
        return false; // Abaikan baris dengan format tanggal tidak valid
    }
  } catch (e) {
    console.error(`Error parsing date in column ${columnId} for row ${row.id}:`, date, e);
    return false;
  }


  // --- Logika Perbandingan ---
  // Normalisasi 'to' date ke akhir hari (23:59:59.999) agar inklusif
  const toEndOfDay = to ? new Date(to.getTime()) : null;
  if (toEndOfDay) {
      toEndOfDay.setHours(23, 59, 59, 999);
  }

  const isAfterFrom = from ? rowDate.getTime() >= from.getTime() : true;
  const isBeforeTo = toEndOfDay ? rowDate.getTime() <= toEndOfDay.getTime() : true;

  // Debugging (opsional)
  // console.log(`Row ${row.id}, Column <span class="math-inline">\{columnId\}\: Date\=</span>{rowDate.toISOString()}, From=<span class="math-inline">\{from?\.toISOString\(\)\}, To\=</span>{toEndOfDay?.toISOString()}, InRange=${isAfterFrom && isBeforeTo}`);

  return isAfterFrom && isBeforeTo;
};
// --- Interface Meta (Struktur data yang diharapkan dari DataTable) ---
interface MyTableMeta {
  accessToken: string | null | undefined; // Definisikan sebagai mungkin undefined di sini
  onActionComplete: (() => void) | undefined; // Definisikan sebagai mungkin undefined di sini
  supabase: SupabaseClient | null | undefined;
  userId: string | undefined | null;
  workspaceOrFolderId: string | null | undefined;
}

// ========================================================================
// Definisi Kolom Utama
// ========================================================================
export const columns: ColumnDef<Schema>[] = [
    // --- Kolom Select ---
    { id: "select", /* ... definisi select ... */ header: ({table})=>(<Checkbox checked={table.getIsAllPageRowsSelected()||(table.getIsSomePageRowsSelected()&&"indeterminate")} onCheckedChange={(v)=>table.toggleAllPageRowsSelected(!!v)} aria-label="Select all"/>), cell: ({row})=>(<Checkbox checked={row.getIsSelected()} onCheckedChange={(v)=>row.toggleSelected(!!v)} aria-label="Select row"/>), size:50, enableSorting:false, enableHiding:false },
    // --- Kolom Nama File ---
   // --- Kolom Nama File (MODIFIED) ---
    {
      accessorKey: "filename",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
      cell: ({ row }) => {
        const i = row.original;
        const icon = getFileIcon(i.mimeType, i.isFolder, i.iconLink);
        const fb = i.isFolder ? "DIR" : i.filename.split('.').pop()?.substring(0, 3).toUpperCase() || "FILE";
        const filename = i.filename; // Ambil nama file untuk title
        return (
          <div className="flex items-center space-x-2">
            {/* Pastikan Avatar tidak menyusut jika nama file panjang */}
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={icon} className="object-contain" />
              <AvatarFallback className="text-[9px]">{fb}</AvatarFallback>
            </Avatar>
            {/* Wadah untuk teks nama file dengan lebar tetap dan penanganan overflow */}
            <div className="md:w-[250px] truncate break-words"> {/* Batasi lebar div ini */}
              {i.webViewLink ? (
                <a
                  href={i.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  // Gunakan block agar break-words efektif & styling konsisten
                  className="font-medium text-sm hover:underline block truncate break-words"
                  title={filename} // Tampilkan nama lengkap saat hover
                  onClick={(e) => e.stopPropagation()}
                >
                  {filename}
                </a>
              ) : (
                <span
                  // Gunakan block agar break-words efektif & styling konsisten
                  className="font-medium text-sm block break-words"
                  title={filename} // Tampilkan nama lengkap saat hover
                >
                  {filename}
                </span>
              )}
            </div>
          </div>
        );
      },
      // minSize bisa dihapus jika kita sudah kontrol lebar di cell,
      // tapi size bisa dipertahankan untuk layout awal
      // minSize: 250,
      size: 100, // Lebar awal yang diinginkan
    },

    // --- Kolom Tipe File (MODIFIED) ---
    {
      accessorKey: "mimeType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
      cell: ({ row }) => {
        const i = row.original;
        const friendlyType = getFriendlyFileType(i.mimeType, i.isFolder);
        return (
          // Beri lebar tetap dan paksa wrap
          <div className="md:w-[100px] text-xs text-gray-600 truncate break-words" title={i.mimeType}>
            {friendlyType}
          </div>
        );
      },
      size: 100, // Lebar kolom
    },

    // --- Kolom Lokasi Folder (MODIFIED) ---
    {
      accessorKey: "pathname",
      header: "Lokasi",
      cell: ({ row }) => {
        const p = row.original.pathname || "-";
        return (
          // Beri lebar tetap dan paksa wrap
          <div className="md:w-[100px] text-xs text-gray-600 overflow-hidden truncate break-words" title={p}>
            {p}
          </div>
        );
      },
      size: 100, // Lebar kolom
    },

    // --- Kolom Deskripsi (MODIFIED) ---
{
      accessorKey: "description",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
      cell: ({ row }) => {
        const description = row.original.description || '-';
        return (
          // --- MODIFIKASI UTAMA DI SINI ---
          <div
            // Tetapkan lebar kolom
            className="md:w-[120px] w-200px
                       // Pastikan teks wrap normal
                       whitespace-normal
                       // Sembunyikan teks yang overflow
                       overflow-hidden
                       // Properti CSS untuk line clamping (maks 3 baris)
                       display-[-webkit-box]
                       [-webkit-box-orient:vertical]
                       [-webkit-line-clamp:3]
                       // Styling teks lainnya
                       text-xs"
            // Tampilkan teks penuh saat hover
            title={row.original.description || ''}
          >
            {description}
          </div>
          // --- AKHIR MODIFIKASI ---
        );
      },
      // Sesuaikan size agar konsisten dengan w-[...] di atas
      size: 200,
    },
    {
        accessorKey: "createdat",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />,
        cell: ({ row }) => formatRelativeTime(row.getValue("createdat")),
        sortingFn: 'datetime',
        // --- >>> TAMBAHKAN filterFn <<< ---
        filterFn: dateBetweenFilterFn, // Gunakan custom function atau built-in 'inDateRange' jika ada
        size: 120
    },
    // --- Kolom Diperbarui terakhir ---
    {
        accessorKey: "lastmodified",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Diubah" />,
        cell: ({ row }) => formatRelativeTime(row.getValue("lastmodified")),
        sortingFn: 'datetime',
        // --- >>> TAMBAHKAN filterFn <<< ---
        filterFn: dateBetweenFilterFn, // Gunakan custom function atau built-in 'inDateRange' jika ada
        size: 120
    },
    // --- >>> KOLOM AKSI (DENGAN PERBAIKAN TYPE) <<< ---
    {
        id: "actions",
        cell: ({ row, table }) => {
            // Akses meta (tipenya bisa undefined)
            const meta = table.options.meta as MyTableMeta | undefined;

            // Ambil props, bisa jadi undefined jika meta tidak ada atau prop tidak ada di meta
            const currentAccessToken = meta?.accessToken;
            const currentOnActionComplete = meta?.onActionComplete;
            const currentSupabase = meta?.supabase;
            const currentUserId = meta?.userId;
            const currentWorkspaceOrFolderId = meta?.workspaceOrFolderId;

            // --- Validasi WAJIB sebelum merender Actions ---
            // Cek semua props yang *diperlukan* oleh DataTableRowActions
            // kecuali accessToken yang boleh null
            if (
                !currentOnActionComplete ||
                !currentSupabase ||
                !currentUserId ||
                !currentWorkspaceOrFolderId
            ) {
                console.error("Props penting (callback/supabase/user/folderId) hilang dari table meta untuk baris:", row.original.id, { meta });
                return <div className="flex justify-center items-center h-8 w-8 text-red-500" title="Aksi tidak tersedia (konfigurasi error)">!</div>;
            }

            // --- Persiapan props untuk DataTableRowActions ---
            // Di sini kita memastikan tipe yang diteruskan sesuai harapan Actions
            const actionProps: DataTableRowActionsProps = {
                 row: row,
                 // --- >>> PERBAIKAN: Gunakan ?? null <<< ---
                 // Jika currentAccessToken adalah undefined, teruskan null.
                 // Jika sudah string atau null, teruskan nilainya.
                 accessToken: currentAccessToken ?? null,
                 // --- >>> AKHIR PERBAIKAN <<< ---
                 onActionComplete: currentOnActionComplete,
                 supabase: currentSupabase, // Sudah divalidasi di atas
                 userId: currentUserId,           // Sudah divalidasi di atas
                 workspaceId: currentWorkspaceOrFolderId, // Sudah divalidasi di atas
            };

            // Render komponen aksi dengan props yang sudah divalidasi & dikonversi tipenya
            return ( <DataTableRowActions {...actionProps} /> );
        },
        size: 80,
        enableSorting: false,
        enableHiding: false,
    },
];