// File: app/api/approvals/sign-and-approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument } from 'pdf-lib';
// import { notifyAssignerOnApprovalAction } from '@/lib/notifications'; // Sesuaikan path jika digunakan

export const dynamic = 'force-dynamic';

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function downloadFromGoogleDrive(fileId: string, accessToken: string): Promise<ArrayBuffer> {
  console.log(`GDrive Download: Requesting file ${fileId}`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  console.log(`GDrive Download: Status ${response.status} for file ${fileId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    console.error(`GDrive Download Error:`, errorData);
    throw new Error(`Gagal download dari GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  return response.arrayBuffer();
}

async function updateGoogleDriveFile(fileId: string, accessToken: string, newContent: Uint8Array, mimeType: string = 'application/pdf'): Promise<any> {
  console.log(`GDrive Update: Requesting to update file ${fileId}`);
  const metadata = { mimeType: mimeType }; 
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([newContent], { type: mimeType }));

  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: form,
  });
  console.log(`GDrive Update: Status ${response.status} for file ${fileId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
    console.error(`GDrive Update Error:`, errorData);
    throw new Error(`Gagal update file di GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
  }
  return response.json();
}

export async function POST(request: NextRequest) {
  console.log("API /api/approvals/sign-and-approve dipanggil");
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    console.warn("API sign-and-approve: Access token tidak ditemukan.");
    return NextResponse.json({ error: "Unauthorized: Access token tidak ditemukan." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      originalFileId,
      originalFileWorkspaceIdRef, 
      originalFileUserIdRef,    
      signatureImageBase64,
      signaturePlacement,
      // --- PERUBAHAN NAMA FIELD ---
      sharedApprovalProcessCuid, // Sebelumnya 'individualApprovalId'
      actioned_by_user_id,     // Ini adalah approver_user_id
    } = body;

    console.log("API sign-and-approve: Request body diterima:", { originalFileId, signaturePlacement, sharedApprovalProcessCuid, actioned_by_user_id });

    // --- PENGECEKAN KELENGKAPAN DATA YANG DIPERBARUI ---
    if (!originalFileId || !originalFileWorkspaceIdRef || !originalFileUserIdRef || !signatureImageBase64 || !signaturePlacement || !sharedApprovalProcessCuid || !actioned_by_user_id) {
      console.error("API sign-and-approve: Data tidak lengkap.", body);
      return NextResponse.json({ error: "Data tidak lengkap untuk proses penandatanganan." }, { status: 400 });
    }
    if (typeof signaturePlacement.pageIndex !== 'number' || typeof signaturePlacement.xPercent !== 'number' || typeof signaturePlacement.yPercent !== 'number') {
        return NextResponse.json({ error: "Data penempatan tanda tangan tidak valid." }, { status: 400 });
    }
    const scaleFactor = typeof signaturePlacement.scaleFactor === 'number' && signaturePlacement.scaleFactor > 0 ? signaturePlacement.scaleFactor : 1.0;

    // --- QUERY PRISMA DIPERBARUI ---
    const existingApproval = await prisma.approval.findUnique({
        where: { 
            id_approver_user_id: { // Menggunakan compound key
                id: sharedApprovalProcessCuid, // Menggunakan CUID proses approval
                approver_user_id: actioned_by_user_id 
            }
        },
        include: { file: true, assigner: true } // Include assigner untuk notifikasi
    });

    if (!existingApproval) {
        console.warn(`API sign-and-approve: Approval tidak ditemukan atau user ${actioned_by_user_id} tidak berhak untuk proses approval ID ${sharedApprovalProcessCuid}`);
        return NextResponse.json({ error: "Approval tidak ditemukan atau Anda tidak berhak." }, { status: 404 });
    }
    if (existingApproval.status === "Sah") {
        return NextResponse.json({ error: "Approval sudah disahkan sebelumnya." }, { status: 400 });
    }
    if (existingApproval.file_id_ref !== originalFileId) {
        return NextResponse.json({ error: "File ID pada approval tidak cocok dengan file yang akan ditandatangani." }, { status: 400 });
    }
    
    console.log(`API sign-and-approve: Mengunduh GDrive file ID ${originalFileId}`);
    const pdfBytes = await downloadFromGoogleDrive(originalFileId, accessToken);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    if (!signatureImageBase64.startsWith('data:image/png;base64,')) {
        return NextResponse.json({ error: "Format data gambar tanda tangan tidak valid (harus PNG base64)." }, { status: 400 });
    }
    const signaturePngBytes = Buffer.from(signatureImageBase64.replace('data:image/png;base64,', ''), 'base64');
    const signatureImage = await pdfDoc.embedPng(signaturePngBytes);
    
    const pages = pdfDoc.getPages();
    const targetPageNumber = signaturePlacement.pageIndex;
    if (targetPageNumber < 0 || targetPageNumber >= pages.length) {
      return NextResponse.json({ error: `Nomor halaman (${targetPageNumber + 1}) tidak valid. Dokumen ini memiliki ${pages.length} halaman.` }, { status: 400 });
    }
    const page = pages[targetPageNumber];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const defaultSigEmbedWidth = 100; 
    const defaultSigEmbedHeight = (signatureImage.height / signatureImage.width) * defaultSigEmbedWidth;
    const sigEmbedWidth = defaultSigEmbedWidth * scaleFactor;
    const sigEmbedHeight = defaultSigEmbedHeight * scaleFactor;
    const x = (signaturePlacement.xPercent / 100) * pageWidth - (sigEmbedWidth / 2);
    const y = pageHeight - ((signaturePlacement.yPercent / 100) * pageHeight) - (sigEmbedHeight / 2); 

    page.drawImage(signatureImage, { x, y, width: sigEmbedWidth, height: sigEmbedHeight });
    console.log(`API sign-and-approve: Tanda tangan disematkan di halaman ${targetPageNumber + 1} dengan skala ${scaleFactor}`);
    const modifiedPdfBytes = await pdfDoc.save();

    console.log(`API sign-and-approve: Mengupdate file GDrive ID ${originalFileId}`);
    await updateGoogleDriveFile(originalFileId, accessToken, modifiedPdfBytes, 'application/pdf');
    console.log(`API sign-and-approve: File GDrive ID ${originalFileId} berhasil diupdate.`);

    const updatedApproval = await prisma.approval.update({
      where: { 
        id_approver_user_id: {
            id: sharedApprovalProcessCuid,
            approver_user_id: actioned_by_user_id
        }
       },
      data: {
        status: "Sah",
        remarks: existingApproval.remarks || "Dokumen telah ditandatangani dan disahkan.",
        actioned_at: new Date(),
      },
      include: { file: true, approver: true, assigner: true }
    });

    if (updatedApproval.assigner && updatedApproval.file && updatedApproval.approver) {
      const fileIdentifier = (updatedApproval.file as any).filename || updatedApproval.file.description || `File ID: ${updatedApproval.file_id_ref}`;
      // await notifyAssignerOnApprovalAction(updatedApproval, fileIdentifier); // Implementasikan jika perlu
    }

    if (updatedApproval.status === "Sah") {
        const allApprovalsForThisProcess = await prisma.approval.findMany({
            where: { id: sharedApprovalProcessCuid } // Cek semua entri untuk PROSES yang sama
        });
        const allApproved = allApprovalsForThisProcess.every(appr => appr.status === "Sah");

        if (allApproved) {
            await prisma.file.update({
                where: { 
                    id_workspace_id_user_id: {
                        id: originalFileId, 
                        workspace_id: originalFileWorkspaceIdRef, 
                        user_id: originalFileUserIdRef 
                    }
                },
                data: { pengesahan_pada: new Date() }
            });
            console.log(`API sign-and-approve: File ${originalFileId} (proses ${sharedApprovalProcessCuid}) telah disahkan sepenuhnya.`);
        }
    }

    return NextResponse.json({ message: "Dokumen berhasil ditandatangani dan disahkan.", data: updatedApproval }, { status: 200 });

  } catch (error: any) {
    console.error("API Error /api/approvals/sign-and-approve:", error.message, error.stack);
    const clientErrorMessage = error.message.includes("GDrive") || error.message.includes("PDF") || error.message.includes("Format data") ? error.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: "Gagal memproses penandatanganan.", details: clientErrorMessage }, { status: 500 });
  }
}
