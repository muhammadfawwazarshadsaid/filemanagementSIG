// app/components/grade-entry-row-actions.tsx
'use client';

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Ban, Check, Edit, Loader2 } from "lucide-react";
import { GradeTableRowData } from "./schema";

interface GradeEntryRowActionsProps {
  row: Row<GradeTableRowData>;
  isEditingThisRow: boolean;
  isSavingThisRow: boolean;
  onEditRow: (rowId: string) => void;
  onCancelRow: (rowId: string) => void;
  onSaveRow: (rowId: string) => Promise<void>;
  // Tambahkan aksi lain jika perlu, misal on View Student Details
}

export function GradeEntryRowActions({
    row,
    isEditingThisRow,
    isSavingThisRow,
    onEditRow,
    onCancelRow,
    onSaveRow,
}: GradeEntryRowActionsProps) {

    const handleSave = async () => {
        await onSaveRow(row.original.id);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                    // Nonaktifkan jika sedang menyimpan baris lain atau edit header
                    disabled={isSavingThisRow}
                >
                    <DotsHorizontalIcon className="h-4 w-4" />
                    <span className="sr-only">Buka menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                {isEditingThisRow ? (
                    <>
                        <DropdownMenuItem
                            onClick={handleSave}
                            disabled={isSavingThisRow}
                            className="text-green-600 focus:bg-green-100 focus:text-green-700"
                        >
                            {isSavingThisRow ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             ) : (
                                <Check className="mr-2 h-4 w-4" />
                             )}
                            Simpan Baris Ini
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onCancelRow(row.original.id)}
                            disabled={isSavingThisRow}
                             className="text-red-600 focus:bg-red-100 focus:text-red-700"
                        >
                            <Ban className="mr-2 h-4 w-4" />
                            Batal Edit Baris
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem onClick={() => onEditRow(row.original.id)}>
                         <Edit className="mr-2 h-4 w-4" />
                        Edit Nilai Baris Ini
                    </DropdownMenuItem>
                )}
                {/* <DropdownMenuSeparator />
                <DropdownMenuItem>Lihat Detail Siswa</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100">
                    Hapus Siswa
                </DropdownMenuItem> */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}