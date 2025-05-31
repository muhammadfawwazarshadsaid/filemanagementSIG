// app/api/approvals/create-for-existing-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import cuid from 'cuid';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const existingFileId = formData.get('existingFileId') as string;
        const assignerUserId = formData.get('assignerUserId') as string;
        const targetWorkspaceId = formData.get('targetWorkspaceId') as string;
        const approverUserIdsString = formData.get('approverUserIds') as string;
        
        // fileRealDescription dari form diabaikan untuk file existing, karena deskripsi file tidak diubah di sini
        const approvalInitialRemarks = formData.get('approvalInitialRemarks') as string | null; // Komentar/catatan untuk approval

        if (!existingFileId || !assignerUserId || !targetWorkspaceId || !approverUserIdsString) {
            return NextResponse.json({ error: "Data permintaan tidak lengkap." }, { status: 400 });
        }
        const approverUserIds: string[] = JSON.parse(approverUserIdsString);
        if (approverUserIds.length === 0) {
            return NextResponse.json({ error: "Minimal satu approver harus dipilih." }, { status: 400 });
        }

        const fileRecord = await prisma.file.findUnique({
            where: {
                id_workspace_id_user_id: {
                    id: existingFileId,
                    workspace_id: targetWorkspaceId,
                    user_id: assignerUserId,
                }
            },
            select: {
                id: true,
                workspace_id: true,
                user_id: true,
                description: true, // Deskripsi file yang sudah ada
                // filename: true, // Jika Anda punya field ini dan ingin menggunakannya untuk fallback remarks
            }
        });

        if (!fileRecord) {
            return NextResponse.json({ error: "File tidak ditemukan dalam database untuk workspace Anda." }, { status: 404 });
        }

        const sharedApprovalProcessId = cuid();
        // Tentukan remarks untuk approval
        // Gunakan nama file dari GDrive (jika Anda menyimpannya) atau ID sebagai fallback yang lebih baik
        // Daripada menggunakan fileRecord.description sebagai fallback untuk approval remark.
        const fileNameForRemark = (fileRecord as any).filename || `ID ${fileRecord.id.substring(0,6)}`; // Ganti (fileRecord as any).filename jika Anda punya field filename di Prisma
        const finalApprovalRemarks = (approvalInitialRemarks && approvalInitialRemarks.trim() !== "")
            ? approvalInitialRemarks.trim()
            : `Permintaan persetujuan untuk file: ${fileNameForRemark}`; // Fallback jika komentar kosong

        const approvalCreations = approverUserIds.map(approverId => ({
            id: sharedApprovalProcessId,
            file_id_ref: fileRecord.id,
            file_workspace_id_ref: fileRecord.workspace_id,
            file_user_id_ref: fileRecord.user_id,
            approver_user_id: approverId,
            assigned_by_user_id: assignerUserId,
            status: "Belum Ditinjau",
            remarks: null, // Gunakan komentar permintaan yang sudah diproses
        }));

        await prisma.approval.createMany({ data: approvalCreations });

        // TODO: Kirim notifikasi
        return NextResponse.json({ success: true, message: `Approval untuk file yang sudah ada berhasil dibuat.`, fileId: fileRecord.id, approvalProcessId: sharedApprovalProcessId }, { status: 201 });

    } catch (error: any) {
        console.error("[API create-for-existing] Error:", error);
        return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server." }, { status: 500 });
    }
}