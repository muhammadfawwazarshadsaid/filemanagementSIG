// File: app/api/approvals/getall/route.ts
// Endpoint untuk mengambil daftar semua approval, dengan filter opsional (termasuk workspaceId) dan paginasi.

import { NextRequest, NextResponse } from 'next/server';
import { type approval as ApprovalModel, type user as UserModel, type file as FileModel, PrismaClient } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Filter opsional untuk workspaceId dari query parameter
    const workspaceId = searchParams.get('workspaceId');

    // Paginasi
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Filter lainnya (opsional)
    const status = searchParams.get('status');
    const approverUserId = searchParams.get('approverUserId');
    const assignedByUserId = searchParams.get('assignedByUserId');
    const fileIdRef = searchParams.get('fileIdRef');

    // Inisialisasi objek klausa where
    let whereClause: any = {};

    if (workspaceId) {
      whereClause.file_workspace_id_ref = workspaceId; // Filter berdasarkan workspaceId jika ada
    }
    if (status) {
      whereClause.status = status;
    }
    if (approverUserId) {
      whereClause.approver_user_id = approverUserId;
    }
    if (assignedByUserId) {
      whereClause.assigned_by_user_id = assignedByUserId;
    }
    if (fileIdRef) {
      whereClause.file_id_ref = fileIdRef;
    }

    const totalApprovals = await prisma.approval.count({ where: whereClause });
    const approvals = await prisma.approval.findMany({
      where: whereClause,
      include: {
        approver: {
          select: {
            id: true,
            displayname: true,
            primaryemail: true,
          },
        },
        assigner: {
          select: {
            id: true,
            displayname: true,
          },
        },
        file: {
          select: {
            id: true,
            description: true, // Sesuaikan dengan field nama/deskripsi file Anda
            workspace_id: true, // Sertakan workspace_id dari file untuk konteks
            user_id: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc', // Approval terbaru dulu
      },
      skip: skip,
      take: limit,
    });

    let message = "Berhasil mengambil daftar approval.";
    if (workspaceId && approvals.length > 0) { // Pesan lebih spesifik jika filter workspaceId ada dan ada hasil
        message = `Berhasil mengambil daftar approval untuk workspace ID: ${workspaceId}.`;
    } else if (workspaceId && approvals.length === 0 && page === 1) { // Pesan jika tidak ada hasil untuk workspaceId
        message = `Tidak ada data approval yang ditemukan untuk workspace ID: ${workspaceId}.`;
    } else if (approvals.length === 0 && page === 1) { // Pesan jika tidak ada hasil sama sekali (tanpa filter workspaceId)
        message = "Tidak ada data approval yang ditemukan.";
    }

     if (approvals.length === 0 && page === 1) {
        return NextResponse.json({
            message: message,
            data: [],
            pagination: {
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit,
            }
        }, { status: 200 });
    }


    return NextResponse.json({
      message: message,
      data: approvals,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalApprovals / limit),
        totalItems: totalApprovals,
        itemsPerPage: limit,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error mengambil daftar approval:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil daftar approval.", details: error.message }, { status: 500 });
  }
}
