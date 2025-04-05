// app/components/subject-list-columns.tsx
'use client';

import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import Link from "next/link"; // Untuk link ke halaman input nilai
import { Badge } from "@/components/ui/badge"; // Untuk status
import { CheckCircle, Activity, XCircle } from "lucide-react"; // Ikon status
import { cn } from "@/lib/utils";
// Pastikan path schema benar dan tipenya sesuai (SubjectSummary punya academicYear)
import { ComponentSummary, SubjectSummary } from "./schema";
import { DataTableColumnHeader } from "./sort"; // Impor komponen header
import { SubjectListRowActions } from "./subject-list-row-actions"; // Impor aksi baris
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"; // Impor tooltip

// Opsi untuk filter status
export const statusOptions = [
    { value: 'Terisi Penuh', label: 'Terisi Penuh', icon: CheckCircle },
    { value: 'Dalam Proses', label: 'Dalam Proses', icon: Activity },
    { value: 'Belum Dimulai', label: 'Belum Dimulai', icon: XCircle },
];

export const subjectListColumns: ColumnDef<SubjectSummary>[] = [
    // Kolom No.
    {
        id: 'no',
        header: () => <div className="text-center">No.</div>,
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
        enableSorting: false,
        enableHiding: false,
        size: 40,
    },
    // Kolom Mata Pelajaran
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mata Pelajaran" />,
        cell: ({ row }) => {
            const rowData = row.original;
            // Link menggunakan ID unik (komposit) dari data baris
            return (
                <Link href={`/guru/input-nilai/${rowData.id}`} className="hover:underline font-medium">
                    {rowData.name}
                </Link>
            );
        },
        enableSorting: true,
        enableHiding: false, // Kolom ini sebaiknya tidak disembunyikan
    },
    // ---- Kolom Tahun Ajaran (Baru) ----
    {
        accessorKey: "academicYear", // Gunakan field dari data
        header: ({ column }) => <DataTableColumnHeader column={column} title="Thn. Ajaran" />,
        cell: ({ row }) => {
            const academicYear = row.getValue("academicYear") as string;
            // Tampilkan tahun ajaran, rata tengah
            return <div className="text-center text-sm">{academicYear}</div>;
        },
        enableSorting: true, // Aktifkan sorting jika perlu
        filterFn: (row, id, value) => { // Filter faceted (exact match)
            return value.includes(row.getValue(id));
        },
        size: 120, // Sesuaikan lebar kolom
    },
    // ---- End Kolom Tahun Ajaran ----

    // Kolom Total Bobot
    {
        accessorKey: "totalWeight",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Bobot" />,
        cell: ({ row }) => {
            const totalWeight = row.original.totalWeight;
            return <div className={cn("text-center", totalWeight !== 100 && "text-yellow-600 font-semibold")}>{totalWeight}%</div>;
        },
        enableSorting: true,
        size: 100,
    },
    // Kolom Jml Komponen
    {
        accessorKey: "componentCount",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jml Komponen" />,
        cell: ({ row }) => <div className="text-center">{row.original.componentCount}</div>,
        enableSorting: true,
        size: 100,
    },
    // Kolom Status
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pengisian" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const option = statusOptions.find(option => option.value === status);
            if (!option) return null;
            let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
            if (status === 'Terisi Penuh') badgeVariant = 'default';
            if (status === 'Belum Dimulai') badgeVariant = 'destructive';
            return (
                 <Badge variant={badgeVariant} className="text-xs whitespace-nowrap">
                     <option.icon className="mr-1 h-3 w-3" />
                    {option.label}
                 </Badge>
            );
        },
        enableSorting: true,
        filterFn: (row, id, value) => { // Filter faceted untuk status
            return value.includes(row.getValue(id));
        },
        size: 150,
    },
    // Kolom Komponen Penilaian
    {
        accessorKey: "components", // Akses array komponen
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komponen Penilaian" />,
        cell: ({ row }) => {
            const components: ComponentSummary[] | undefined = row.original.components;
            if (!components || components.length === 0) {
                return <span className="text-xs text-muted-foreground">N/A</span>;
            }
            const firstComponent = components[0];
            const remainingCount = components.length - 1;
            const allComponentNames = components.map(c => c.name).join(", ");
            return (
                <div className="flex items-center gap-1 flex-wrap">
                    {firstComponent?.name && ( <Badge variant="outline" className="text-xs whitespace-nowrap">{firstComponent.name}</Badge> )}
                    {remainingCount > 0 && (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs cursor-default">+{remainingCount} lainnya</Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs"><p className="text-xs">{allComponentNames}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            );
        },
        enableSorting: false,
        filterFn: (row, id, value: string[]) => { // Filter faceted untuk komponen
            const components = row.original.components;
            if (!components || value.length === 0) return true;
            return components.some(comp => value.includes(comp.name));
        },
    },
    // Kolom Aksi
    {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>, // Rata kanan header
        cell: ({ row }) => <div className="text-center"><SubjectListRowActions row={row} /></div>, // Rata tengah isi cell
        enableSorting: false,
        enableHiding: false,
        size: 60,
    }
];