// app/api/approvals/create-with-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import cuid from 'cuid';

interface GDriveFileUploadResponse {
    id: string; name: string; mimeType: string; webViewLink?: string; iconLink?: string;
}

async function uploadFileToGoogleDrive(
    accessToken: string, file: File, folderId: string, filename?: string, description?: string
): Promise<GDriveFileUploadResponse | null> {
    const metadata: { name: string; mimeType: string; parents: string[]; description?: string } = {
        name: filename || file.name,
        mimeType: file.type || 'application/octet-stream',
        parents: [folderId],
    };
    if (description && description.trim() !== "") { // Hanya tambahkan deskripsi jika ada dan tidak kosong
        metadata.description = description;
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,iconLink', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: form,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("GDrive Upload Error Data:", errorData);
            throw new Error(`Gagal unggah ke GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
        }
        return await response.json() as GDriveFileUploadResponse;
    } catch (error) {
        console.error("Exception during GDrive upload:", error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    const accessToken = request.headers.get('Authorization')?.substring(7);
    if (!accessToken) {
        return NextResponse.json({ error: "Unauthorized: Akses token tidak ditemukan." }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const fileToUpload = formData.get('file') as File | null;
        const assignerUserId = formData.get('assignerUserId') as string;
        const targetWorkspaceId = formData.get('targetWorkspaceId') as string;
        const targetFolderIdInput = formData.get('targetFolderId') as string | null;
        const approverUserIdsString = formData.get('approverUserIds') as string;
        
        const fileRealDescription = formData.get('fileRealDescription') as string | null; // Deskripsi aktual file
        const approvalInitialRemarks = formData.get('approvalInitialRemarks') as string | null; // Komentar/catatan untuk approval

        const actualTargetFolderId = targetFolderIdInput || targetWorkspaceId;

        if (!fileToUpload || !assignerUserId || !targetWorkspaceId || !actualTargetFolderId || !approverUserIdsString) {
            return NextResponse.json({ error: "Data permintaan tidak lengkap." }, { status: 400 });
        }
        const approverUserIds: string[] = JSON.parse(approverUserIdsString);
        if (approverUserIds.length === 0) {
            return NextResponse.json({ error: "Minimal satu approver harus dipilih." }, { status: 400 });
        }

        // Gunakan fileRealDescription (deskripsi dokumen) saat mengunggah ke GDrive
        const gdriveFile = await uploadFileToGoogleDrive(accessToken, fileToUpload, actualTargetFolderId, fileToUpload.name, fileRealDescription || undefined);
        if (!gdriveFile || !gdriveFile.id) {
            return NextResponse.json({ error: "Gagal mengunggah file ke Google Drive." }, { status: 500 });
        }

        const newFileRecord = await prisma.file.create({
            data: {
                id: gdriveFile.id,
                workspace_id: targetWorkspaceId,
                user_id: assignerUserId,
                description: fileRealDescription, // Simpan deskripsi aktual file di DB
                is_self_file: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        const sharedApprovalProcessId = cuid();
        // Tentukan remarks untuk approval
        const finalApprovalRemarks = (approvalInitialRemarks && approvalInitialRemarks.trim() !== "")
            ? approvalInitialRemarks.trim()
            : `Permintaan persetujuan untuk file baru: ${gdriveFile.name}`; // Fallback jika komentar kosong

        const approvalCreations = approverUserIds.map(approverId => ({
            id: sharedApprovalProcessId,
            file_id_ref: newFileRecord.id,
            file_workspace_id_ref: newFileRecord.workspace_id,
            file_user_id_ref: newFileRecord.user_id,
            approver_user_id: approverId,
            assigned_by_user_id: assignerUserId,
            status: "Belum Ditinjau",
            remarks: null, // Gunakan komentar permintaan yang sudah diproses
        }));

        await prisma.approval.createMany({ data: approvalCreations });

        // TODO: Kirim notifikasi
        return NextResponse.json({ success: true, message: `Approval untuk file "${gdriveFile.name}" berhasil dibuat.`, fileId: newFileRecord.id, approvalProcessId: sharedApprovalProcessId }, { status: 201 });

    } catch (error: any) {
        console.error("[API create-with-upload] Error:", error);
        return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server." }, { status: 500 });
    }
}