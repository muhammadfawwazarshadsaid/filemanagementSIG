// File: app/api/workspaces/[workspaceId]/potential-files/route.ts

import { PrismaClient } from '@/lib/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PotentialFile {
  id: string;                 // file.id
  name: string | null;        // Nama file (akan diisi dengan placeholder jika tidak ada di DB)
  description: string | null;
  workspace_id: string;       // file.workspace_id (ID bersama workspace)
  user_id: string;            // file.user_id (bagian dari composite key file, merujuk ke workspace.user_id)
  pengesahan_pada: Date | null;
  is_self_file: boolean | null;
  // Anda bisa menambahkan field lain seperti created_at, updated_at jika perlu
}

// Tipe untuk hasil query Prisma sebelum ditransformasi menjadi PotentialFile
// Ini harus cocok dengan apa yang Anda 'select' dari database.
type PrismaFileResult = {
  id: string;
  description: string | null;
  workspace_id: string;
  user_id: string;
  pengesahan_pada: Date | null;
  is_self_file: boolean | null;
  created_at: Date; // Ditambahkan karena digunakan di orderBy
  // updated_at?: Date; // Uncomment jika Anda select updated_at
};

/**
 * Handler untuk metode GET
 * Mengembalikan daftar file yang ada dalam workspace tertentu.
 * VERSI INI TIDAK MENGGUNAKAN AUTENTIKASI.
 */
export async function GET(
  request: NextRequest, // Parameter request tetap ada sesuai signature Next.js Route Handler
) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId')

  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID wajib diisi." }, { status: 400 });
  }
  try {
    // Langsung dapatkan semua file yang terkait dengan workspaceId yang diberikan.
    const filesFromDb: PrismaFileResult[] = await prisma.file.findMany({
      where: {
        workspace_id: workspaceId, 
      },
      select: {
        id: true,
        description: true, 
        workspace_id: true,
        user_id: true,        
        pengesahan_pada: true,
        is_self_file: true,
        created_at: true, // Pastikan ini ada di model 'file' Anda
        // updated_at: true, // Uncomment jika Anda ingin mengambil field ini
      },
      orderBy: {
        created_at: 'desc' // Mengurutkan berdasarkan created_at
      }
    });

    // findMany mengembalikan array kosong jika tidak ada, jadi tidak perlu cek null.
    // if (filesFromDb.length === 0) {
    //   return NextResponse.json({ potential_files: [] }, { status: 200 });
    // }

    // Transformasi hasil query ke tipe PotentialFile, tambahkan placeholder untuk 'name'.
    const filesToReturn: PotentialFile[] = filesFromDb.map(file => ({
        ...file, // Menyalin semua properti dari file (id, description, dll.)
        name: `File ID: ${file.id}` // Placeholder untuk nama file.
                                    // Idealnya, sinkronkan nama file dari GDrive ke tabel 'file' Anda
                                    // dan tambahkan 'name' ke 'select' di atas serta ke PrismaFileResult.
                                    // Jika 'name' sudah ada di model 'file' Prisma Anda,
                                    // tambahkan 'name: true' ke 'select' di atas,
                                    // tambahkan 'name: string | null;' ke PrismaFileResult,
                                    // dan ubah baris ini menjadi 'name: file.name'.
    }));


    return NextResponse.json({ potential_files: filesToReturn }, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching potential files for workspace ${workspaceId}:`, error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil daftar file.", details: error.message }, { status: 500 });
  }
}
