// app/api/approvals/active-approvers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json({ error: "Parameter fileId dibutuhkan." }, { status: 400 });
        }

        // Cari approval yang statusnya masih aktif (belum 'Sah' atau 'Ditolak' final)
        // Sesuaikan status ini dengan definisi "aktif" di sistem Anda
        const activeApprovalStatuses = ["Belum Ditinjau", "Perlu Revisi", "Menunggu Persetujuan"]; // Contoh status aktif

        const activeApprovals = await prisma.approval.findMany({
            where: {
                file_id_ref: fileId,
                status: {
                    in: activeApprovalStatuses,
                },
                // Anda mungkin juga ingin memfilter berdasarkan sharedApprovalProcessCuid jika perlu
                // untuk memastikan hanya proses yang relevan. Namun, jika fileId unik, ini mungkin cukup.
            },
            select: {
                approver_user_id: true,
            },
            distinct: ['approver_user_id'] // Hanya ambil ID approver yang unik
        });

        const activeApproverIds = activeApprovals.map(appr => appr.approver_user_id);

        return NextResponse.json(activeApproverIds, { status: 200 });

    } catch (error: any) {
        console.error("[API active-approvers] Error:", error);
        return NextResponse.json({ error: error.message || "Gagal mengambil data approver aktif." }, { status: 500 });
    }
}