// File: app/api/workspaces/[workspaceId]/potential-approvers/route.ts

import { PrismaClient } from '@/lib/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PotentialApprover {
  id: string;
  displayname: string | null;
  primaryemail: string | null;
  is_admin?: boolean | null; // Opsional: jika Anda ingin menampilkan status admin
}

/**
 * Handler untuk metode GET
 * Mengembalikan daftar pengguna yang menjadi anggota dari workspace tertentu,
 * yang bisa menjadi calon approver.
 * VERSI INI TIDAK MENGGUNAKAN AUTENTIKASI.
 */
export async function GET(
  request: NextRequest, // Meskipun tidak digunakan secara aktif untuk auth di versi ini, tetap ada
) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID wajib diisi." }, { status: 400 });
  }
  try {
    // Langkah 1 (Sebelumnya Langkah 3): Dapatkan semua user_id yang merupakan anggota dari workspace tersebut.
    const workspaceMembers = await prisma.workspace.findMany({
      where: {
        id: workspaceId, 
      },
      select: {
        user_id: true, 
      },
    });

    if (!workspaceMembers || workspaceMembers.length === 0) {
      return NextResponse.json({ error: `Workspace dengan ID '${workspaceId}' tidak ditemukan atau tidak memiliki anggota.` }, { status: 404 });
    }

    // Menambahkan tipe eksplisit untuk parameter 'member'
    const memberUserIds = workspaceMembers.map((member: { user_id: string }) => member.user_id);
    if (memberUserIds.length === 0) {
        // Seharusnya tidak terjadi jika workspaceMembers tidak kosong, tapi sebagai pengaman
        return NextResponse.json({ potential_approvers: [] }, { status: 200 });
    }

    // Langkah 2 (Sebelumnya Langkah 4): Dapatkan detail pengguna (calon approver) dari tabel user.
    const potentialApprovers: PotentialApprover[] = await prisma.user.findMany({
      where: {
        id: {
          in: memberUserIds,
        },
        is_admin: false
      },
      select: {
        id: true,
        displayname: true,
        primaryemail: true,
        is_admin: true, // Sertakan status admin jika ingin ditampilkan di UI
      },
      orderBy: {
        displayname: 'asc' // Urutkan berdasarkan nama
      }
    });

    return NextResponse.json({ potential_approvers: potentialApprovers }, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching potential approvers for workspace ${workspaceId}:`, error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil daftar calon approver.", details: error.message }, { status: 500 });
  }
}
