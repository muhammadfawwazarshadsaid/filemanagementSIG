// File: app/api/approvals/resubmit-with-new-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import formidable from 'formidable'; // Tidak lagi diperlukan dengan request.formData()
import fs from 'fs'; // Mungkin tidak lagi diperlukan jika arrayBuffer langsung dari File object
// import { notifyApproverForReview } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// --- Fungsi Helper (letakkan di sini atau di file utilitas terpisah) ---
function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function uploadToGoogleDrive(
  accessToken: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  // parentFolderId?: string 
): Promise<string> { // Mengembalikan GDrive File ID BARU
  console.log(`GDrive Upload New: Uploading "${fileName}"`);
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: fileName, mimeType /*, parents: parentFolderId ? [parentFolderId] : []*/ })], { type: 'application/json' }));
  form.append('file', new Blob([fileBuffer], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: form,
  });
  console.log(`GDrive Upload New: Status ${response.status} for "${fileName}"`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({error: {message: response.statusText}}));
    console.error(`GDrive Upload New Error:`, errorData);
    throw new Error(`Gagal upload file baru ke GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  const gDriveFile = await response.json();
  if (!gDriveFile.id) {
    throw new Error("Upload ke GDrive berhasil tetapi tidak mendapatkan ID file baru.");
  }
  return gDriveFile.id;
}

async function deleteFromGoogleDrive(fileId: string, accessToken: string): Promise<void> {
  console.log(`GDrive Delete: Requesting to delete file ${fileId}`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  console.log(`GDrive Delete: Status ${response.status} for file ${fileId}`);
  if (!response.ok && response.status !== 204) { 
    const errorData = await response.json().catch(() => ({error: {message: response.statusText}}));
    console.warn(`Gagal hapus file lama dari GDrive (${response.status}): ${errorData?.error?.message || response.statusText}. File ID: ${fileId}`);
    // Pertimbangkan apakah ini error fatal atau hanya warning
  }
}
// --- Akhir Fungsi Helper ---

export async function POST(request: NextRequest) {
  console.log("API /api/approvals/resubmit-with-new-file dipanggil");
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized: Access token tidak ditemukan." }, { status: 401 });
  }

  let new_gdrive_file_id: string | null = null;
  let old_file_id_ref_for_deletion: string | null = null; // Untuk GDrive delete di luar transaksi

  try {
    const formData = await request.formData();

    const old_file_id_ref = formData.get('old_file_id_ref') as string | null;
    const old_file_workspace_id_ref = formData.get('old_file_workspace_id_ref') as string | null;
    const old_file_user_id_ref = formData.get('old_file_user_id_ref') as string | null;
    const approval_process_id = formData.get('approval_process_id') as string | null; // Ini adalah approval.id
    const requested_by_user_id = formData.get('requested_by_user_id') as string | null;
    const new_revision_notes = formData.get('new_revision_notes') as string | "";
    const new_file_from_form = formData.get('new_file') as File | null;

    console.log("API resubmit: FormData parsed", { old_file_id_ref, approval_process_id, new_file: new_file_from_form?.name });


    if (!old_file_id_ref || !old_file_workspace_id_ref || !old_file_user_id_ref || !requested_by_user_id || !approval_process_id) {
      return NextResponse.json({ error: "Data referensi file lama, ID proses approval, dan user peminta wajib diisi." }, { status: 400 });
    }
     if (!new_file_from_form && !new_revision_notes.trim()) {
        return NextResponse.json({ error: "Tidak ada file baru atau catatan revisi yang diberikan untuk resubmit." }, { status: 400 });
    }

    const requester = await prisma.user.findUnique({ where: { id: requested_by_user_id } });
    if (!requester || !requester.is_admin) { // Sesuaikan dengan logika otorisasi Anda
        return NextResponse.json({ error: "Hanya pengguna yang berwenang yang dapat melakukan submit ulang." }, { status: 403 });
    }
    
    let new_file_description: string | null = null;
    // mimeType bisa diambil dari new_file_from_form.type jika perlu

    if (new_file_from_form) {
      console.log(`API resubmit: Memproses file baru "${new_file_from_form.name}"`);
      const fileBuffer = Buffer.from(await new_file_from_form.arrayBuffer());
      new_gdrive_file_id = await uploadToGoogleDrive(
        accessToken,
        fileBuffer,
        new_file_from_form.name || 'untitled_revision',
        new_file_from_form.type || 'application/octet-stream'
      );
      console.log(`API resubmit: File baru diunggah ke GDrive. ID Baru: ${new_gdrive_file_id}`);
      new_file_description = new_file_from_form.name || `Revisi untuk file ${old_file_id_ref}`;
      old_file_id_ref_for_deletion = old_file_id_ref; // Simpan untuk dihapus nanti
    } else {
      // Tidak ada file baru, berarti hanya update catatan.
      // ID GDrive tidak berubah.
      new_gdrive_file_id = old_file_id_ref; // Gunakan ID lama jika tidak ada file baru
      // Deskripsi file lama bisa diambil jika diperlukan
      const oldFileRecord = await prisma.file.findUnique({
          where: {id_workspace_id_user_id: { id: old_file_id_ref, workspace_id: old_file_workspace_id_ref, user_id: old_file_user_id_ref}}
      });
      new_file_description = oldFileRecord?.description || old_file_id_ref;
    }

    await prisma.$transaction(async (tx) => {
      console.log(`API resubmit: Memulai transaksi Prisma untuk approval process ID: ${approval_process_id}`);
      
      if (new_gdrive_file_id && new_gdrive_file_id !== old_file_id_ref) { // Jika file GDrive benar-benar baru/berbeda
        console.log(`API resubmit: File GDrive diganti. ID Lama: ${old_file_id_ref}, ID Baru: ${new_gdrive_file_id}`);
        
        // A. Ambil semua user_id dan is_self_workspace dari tabel workspace
        const workspaceUsers = await tx.workspace.findMany({
            where: { id: old_file_workspace_id_ref }, // 'id' di tabel workspace adalah workspaceId
            select: { user_id: true, is_self_workspace: true }
        });

        if (workspaceUsers.length === 0) {
            throw new Error(`Tidak ada user ditemukan di workspace ${old_file_workspace_id_ref}.`);
        }

        // B. Buat entri baru di tabel 'file' untuk GDrive ID BARU bagi setiap user
        const newFileRecordsData = workspaceUsers.map(wu => ({
            id: new_gdrive_file_id!,
            workspace_id: old_file_workspace_id_ref,
            user_id: wu.user_id,
            description: new_file_description, // Deskripsi dari file baru atau file lama
            is_self_file: Boolean(wu.is_self_workspace),
            // Salin properti lain dari record file lama jika relevan dan diperlukan
            // seperti 'color', 'labels' (jika ada di skema Anda)
        }));
        await tx.file.createMany({
            data: newFileRecordsData,
            skipDuplicates: true, 
        });
        console.log(`API resubmit: Entri tabel 'file' baru dibuat untuk GDrive ID ${new_gdrive_file_id}.`);

        // C. Update SEMUA record 'approval' yang terkait dengan approval_process_id
        //    untuk merujuk ke file_id_ref yang BARU.
        //    file_user_id_ref (konteks user dari file asli) tetap sama.
        await tx.approval.updateMany({
            where: { id: approval_process_id },
            data: {
                file_id_ref: new_gdrive_file_id,
                // file_workspace_id_ref: tetap sama
                // file_user_id_ref: tetap sama (old_file_user_id_ref)
                status: "Belum Ditinjau",
                remarks: new_revision_notes,
                actioned_at: null,
                updated_at: new Date(),
            }
        });
        console.log(`API resubmit: Record approval untuk process ID ${approval_process_id} diupdate ke GDrive ID baru.`);

        // D. Hapus entri LAMA dari tabel 'file' untuk old_file_id_ref
        //    Ini menghapus semua record file terkait GDrive ID lama di workspace tersebut
        const { count } = await tx.file.deleteMany({
            where: {
                id: old_file_id_ref,
                workspace_id: old_file_workspace_id_ref,
            }
        });
        console.log(`API resubmit: ${count} record file lama (ID: ${old_file_id_ref}) telah dihapus.`);
      } else {
        // Tidak ada file GDrive baru, hanya update status dan remarks
        console.log(`API resubmit: Tidak ada file GDrive baru diunggah. Hanya mereset status dan remarks.`);
        await tx.approval.updateMany({
            where: { id: approval_process_id },
            data: {
                status: "Belum Ditinjau",
                remarks: new_revision_notes,
                actioned_at: null,
                updated_at: new Date(),
            }
        });
      }
      
      // E. Kirim Notifikasi
      const updatedApprovalsForNotif = await tx.approval.findMany({
          where: { id: approval_process_id },
          include: { assigner: true, approver: true, file: true }
      });

      for (const approval of updatedApprovalsForNotif) {
          if (approval.file) {
              const fileIdentifier = approval.file.description || `File ID: ${approval.file_id_ref}`;
              // await notifyApproverForReview(approval, fileIdentifier, true); // isRevision = true
              console.log(`API resubmit: Placeholder untuk notifikasi ke approver ${approval.approver_user_id} untuk file ${fileIdentifier}`);
          }
      }
    }); // Akhir Prisma Transaction

    // F. Jika file GDrive diganti dan transaksi DB sukses, HAPUS file LAMA dari Google Drive
    if (new_gdrive_file_id && old_file_id_ref_for_deletion && new_gdrive_file_id !== old_file_id_ref_for_deletion) {
      console.log(`API resubmit: Menghapus file GDrive lama: ${old_file_id_ref_for_deletion}`);
      await deleteFromGoogleDrive(old_file_id_ref_for_deletion, accessToken);
      console.log(`API resubmit: File GDrive lama ${old_file_id_ref_for_deletion} berhasil dihapus (atau tidak ditemukan).`);
    }

    return NextResponse.json({ message: "Approval berhasil disubmit ulang.", newFileId: new_gdrive_file_id }, { status: 200 });

  } catch (error: any) {
    console.error("API Error /api/approvals/resubmit-with-new-file:", error.message, error.stack);
    const clientErrorMessage = error.message.includes("GDrive") ? error.message : "Terjadi kesalahan internal server saat submit ulang.";
    return NextResponse.json({ error: "Gagal submit ulang approval.", details: clientErrorMessage }, { status: 500 });
  }
}