// File: app/api/approvals/[approvalId]/getinfo/route.ts
// Endpoint untuk mengambil detail informasi dari satu record approval spesifik berdasarkan ID-nya.

import { PrismaClient } from '@/lib/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
// Import tipe jika diperlukan, misalnya:
// import type { approval as ApprovalModel, user as UserModel, file as FileModel } from '@/lib/generated/prisma/client';

// 1. Interface untuk mendefinisikan tipe parameter dinamis
interface GetInfoParams {
  approvalId: string;
  approverUserId: string;
}

const prisma = new PrismaClient(); // Pastikan PrismaClient diimport dengan benar
export async function GET(
  request: NextRequest,
  { params }: { params: GetInfoParams } // 2. 'params' diterima di sini, dan tipenya adalah objek yang memiliki properti 'approvalId'
) {
  try {
    // 3. 'approvalId' dideklarasikan dan diinisialisasi dengan destructuring dari 'params'
    // PASTIKAN BARIS INI ADA DAN TIDAK DIKOMENTARI ATAU SALAH KETIK
    const { approvalId, approverUserId } = await params;

    // 4. Validasi setelah 'approvalId' dideklarasikan
    if (!approvalId) {
      return NextResponse.json({ error: "Parameter approvalId wajib diisi." }, { status: 400 });
    }
    if (!approverUserId) {
      return NextResponse.json({ error: "Parameter approver_user_id wajib diisi." }, { status: 400 });
    }

    // 5. 'approvalId' digunakan dalam query Prisma
    const approval = await prisma.approval.findUnique({
      where: {
        id_approver_user_id: {
          id: approvalId,
          approver_user_id: approverUserId,
        }
      },
      include: {
        approver: {
          select: {
            id: true,
            displayname: true,
            primaryemail: true,
            is_admin: true,
          },
        },
        assigner: {
          select: {
            id: true,
            displayname: true,
            primaryemail: true,
            is_admin: true,
          },
        },
        file: {
          select: {
            id: true,
            workspace_id: true,
            user_id: true,
            description: true,
            color: true,
            labels: true,
            created_at: true,
            updated_at: true,
            pengesahan_pada: true,
          }
        }
      },
    });

    if (!approval) {
      return NextResponse.json({ error: `Approval dengan ID '${approvalId}' tidak ditemukan.` }, { status: 404 });
    }

    return NextResponse.json({
      message: `Berhasil mengambil detail approval ID: ${approvalId}.`,
      data: approval,
    }, { status: 200 });

  } catch (error: any) {
    // 'params.approvalId' juga bisa digunakan di sini karena 'params' ada dalam scope
    console.error(`Error mengambil detail approval untuk ID ${params.approvalId}:`, error);
    if (error.code === 'P2025') {
        return NextResponse.json({ error: `Approval dengan ID '${params.approvalId}' tidak ditemukan.` }, { status: 404 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil detail approval.", details: error.message }, { status: 500 });
  }
}
