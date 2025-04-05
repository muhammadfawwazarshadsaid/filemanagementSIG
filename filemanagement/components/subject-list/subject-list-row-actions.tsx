// app/components/subject-list-row-actions.tsx
'use client';

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";
import Link from "next/link"; // Import Link dari Next.js

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SubjectSummary } from "./schema"; // Sesuaikan path jika perlu
import { BookOpen, Edit } from "lucide-react"; // Impor ikon yang sesuai

interface SubjectListRowActionsProps {
  row: Row<SubjectSummary>;
}

export function SubjectListRowActions({ row }: SubjectListRowActionsProps) {
  // Dapatkan subjectId dari data original baris
  const subjectId = row.original.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted" // Tombol titik tiga
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Buka menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem asChild>
           {/* Link ke halaman detail mapel */}
           <Link href={`/guru/inputnilai/${subjectId}`}>
               <BookOpen className="mr-2 h-4 w-4" />
               Detail Mapel
           </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
             {/* Link ke halaman input nilai */}
            <Link href={`/guru/inputnilai/${subjectId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Input Nilai
            </Link>
        </DropdownMenuItem>
        {/* Anda bisa menambahkan aksi lain di sini jika perlu */}
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100">
            Hapus Mata Pelajaran
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}