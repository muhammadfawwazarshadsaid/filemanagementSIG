
import { PrismaClient } from '@/lib/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest){
  const searchParams = request.nextUrl.searchParams;
  const approvalId = searchParams.get('approvalId');
  const approverUserId = searchParams.get('approverUserId');
  try {

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
    console.error(`Error mengambil detail approval untuk ID ${approvalId}:`, error);
    if (error.code === 'P2025') {
        return NextResponse.json({ error: `Approval dengan ID '${approvalId}' tidak ditemukan.` }, { status: 404 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil detail approval.", details: error.message }, { status: 500 });
  }
}
