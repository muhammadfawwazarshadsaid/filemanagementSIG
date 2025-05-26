// File: app/api/approvals/getall/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
async function fetchApprovals() {
  const clientSideGoogleToken = localStorage.getItem("accessToken"); // Ambil token di client

  if (!clientSideGoogleToken) {
    console.error("Client: Google token not found in localStorage.");
    // Handle error, mungkin minta user login lagi
    return;
  }

  try {
    const response = await fetch('/api/approvals/getall?workspaceId=YOUR_WORKSPACE_ID&page=1', { // Ganti dengan parameter yang sesuai
      headers: {
        'Authorization': `Bearer ${clientSideGoogleToken}` // Kirim token ke backend API Anda
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Approvals fetched:", data);
    // Proses data approval di sini
  } catch (error) {
    console.error("Failed to fetch approvals:", error);
  }
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (workspaceId) whereClause.file_workspace_id_ref = workspaceId;
    const authHeader = request.headers.get('Authorization');
    let googleAccessToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      googleAccessToken = authHeader.substring(7); // Hapus prefix "Bearer "
    }

    if (!googleAccessToken) {
      return NextResponse.json({ error: "Google Access Token tidak tersedia." }, { status: 500 });
    }

    const totalApprovals = await prisma.approval.count({ where: whereClause });
    const approvalsFromDb = await prisma.approval.findMany({
      where: whereClause,
      include: {
        approver: { select: { id: true, displayname: true, primaryemail: true } },
        assigner: { select: { id: true, displayname: true } },
        file: {
          select: {
            id: true, // Google Drive File ID
            description: true,
            workspace_id: true, // Ini adalah workspace_id dari tabel 'file'
            user_id: true,      // Ini adalah user_id dari tabel 'file'
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: skip,
      take: limit,
    });

    const approvalsWithGDriveFilenames = await Promise.all(
      approvalsFromDb.map(async (approval) => {
        let gDriveFileName = "N/A (ID File tidak ada atau error)"; // Default filename
        let gDriveFetchError = null;

        if (approval.file?.id) { // approval.file.id adalah Google Drive File ID
          try {
            const gDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${approval.file.id}?fields=name`;
            const response = await fetch(gDriveApiUrl, {
              headers: { 'Authorization': `Bearer ${googleAccessToken}` },
            });

            if (response.ok) {
              const fileData = await response.json();
              gDriveFileName = fileData.name || "Nama tidak ditemukan di GDrive";
            } else {
              const errorData = await response.json().catch(() => ({}));
              gDriveFetchError = `GDrive API Error ${response.status}: ${errorData?.error?.message || response.statusText}`;
              console.warn(`Gagal ambil nama dari GDrive untuk file ID ${approval.file.id}: ${gDriveFetchError}`);
            }
          } catch (e: any) {
            gDriveFetchError = `Exception saat mengambil nama GDrive: ${e.message}`;
            console.error(`Exception untuk GDrive file ID ${approval.file.id}:`, e);
          }
        } else {
          gDriveFetchError = "ID File Google Drive tidak ditemukan pada record approval.";
        }

        // Membuat objek file baru untuk respons, termasuk gDriveFileName
        // Jika approval.file adalah null (seharusnya tidak jika relasi ada), kita tetap bentuk struktur dasar
        const responseFileObject = approval.file ?
            { ...approval.file, filename: gDriveFileName } : // Menambahkan/mengganti filename
            { // Struktur fallback jika approval.file null tapi ada ID referensi
                id: approval.file_id_ref, // ID GDrive asli
                filename: gDriveFileName,
                description: null,
                workspace_id: approval.file_workspace_id_ref,
                user_id: approval.file_user_id_ref
            };

        return {
          ...approval,
          file: responseFileObject, // Ganti objek file dengan yang sudah ada filename dari GDrive
          gdrive_fetch_error: gDriveFetchError, // Opsional: sertakan info error
        };
      })
    );

    let message = "Berhasil mengambil daftar approval.";
    // ... (logika pesan respons Anda) ...

    return NextResponse.json({
      message: message,
      data: approvalsWithGDriveFilenames,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalApprovals / limit),
        totalItems: totalApprovals,
        itemsPerPage: limit,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error mengambil daftar approval:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal.", details: error.message }, { status: 500 });
  }
}