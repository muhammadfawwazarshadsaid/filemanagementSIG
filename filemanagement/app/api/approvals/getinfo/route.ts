// Contoh path: app/api/approvals/detail/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { type file as PrismaFileType } from '@/lib/generated/prisma/client'; // Import tipe file dari Prisma

// Definisikan tipe untuk objek 'file' dalam respons yang menyertakan filename dari GDrive
// Ini mengambil semua properti dari PrismaFileType (jika file ada) dan menambahkan/memastikan ada 'filename'
type FileInResponse = Partial<PrismaFileType> & { // Partial karena file dari DB bisa null
  id: string; // ID GDrive wajib ada
  filename: string; // Filename dari GDrive wajib ada
  // Tambahkan properti lain yang WAJIB ada di respons jika tidak ada di PrismaFileType
  workspace_id?: string;
  user_id?: string;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const approvalId = searchParams.get('approvalId');         // Variabel ini didefinisikan di sini
    const approverUserId = searchParams.get('approverUserId'); // Dan ini juga

    // --- 1. Ambil Google Access Token dari header Authorization ---
    const authHeader = request.headers.get('Authorization');
    let googleAccessToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      googleAccessToken = authHeader.substring(7);
    }

    if (!googleAccessToken) {
      return NextResponse.json({ error: "Google Access Token tidak disertakan dalam header Authorization." }, { status: 401 });
    }
    // --- Selesai pengambilan token ---

    if (!approvalId) {
      return NextResponse.json({ error: "Parameter approvalId wajib diisi." }, { status: 400 });
    }
    if (!approverUserId) {
      return NextResponse.json({ error: "Parameter approverUserId wajib diisi." }, { status: 400 });
    }

    const approvalFromDb = await prisma.approval.findUnique({
      where: {
        id_approver_user_id: {
          id: approvalId,
          approver_user_id: approverUserId,
        }
      },
      include: {
        approver: {
          select: { id: true, displayname: true, primaryemail: true, is_admin: true },
        },
        assigner: {
          select: { id: true, displayname: true, primaryemail: true, is_admin: true },
        },
        file: { // Relasi ke tabel 'file' (tipe PrismaFileType | null)
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
            // JANGAN sertakan 'filename' di sini jika tidak ada di model/tabel 'file' Prisma Anda
          }
        }
      },
    });

    if (!approvalFromDb) {
      return NextResponse.json({ error: `Approval dengan ID '${approvalId}' (approver: ${approverUserId}) tidak ditemukan.` }, { status: 404 });
    }

    // --- 2. Ambil Filename dari Google Drive ---
    let gDriveFileName = "N/A (File tidak ditemukan/error)";
    let gDriveFetchError = null;
    let finalFileObject: FileInResponse | null = null; // Tipe yang menyertakan filename

    const gDriveFileIdToFetch = approvalFromDb.file?.id || approvalFromDb.file_id_ref;

    if (gDriveFileIdToFetch) {
      try {
        const gDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${gDriveFileIdToFetch}?fields=name`;
        const response = await fetch(gDriveApiUrl, {
          headers: { 'Authorization': `Bearer ${googleAccessToken}` },
        });

        if (response.ok) {
          const fileData = await response.json();
          gDriveFileName = fileData.name || "Nama tidak ditemukan di GDrive";
        } else {
          const errorData = await response.json().catch(() => ({}));
          gDriveFetchError = `GDrive API Error ${response.status}: ${errorData?.error?.message || response.statusText}`;
          console.warn(`Gagal ambil nama GDrive untuk file ID ${gDriveFileIdToFetch}: ${gDriveFetchError}`);
        }
      } catch (e: any) {
        gDriveFetchError = `Exception saat mengambil nama GDrive: ${e.message}`;
        console.error(`Exception untuk GDrive file ID ${gDriveFileIdToFetch}:`, e);
      }

      // Membuat objek file untuk respons
      if (approvalFromDb.file) { // Jika ada data file dari DB
        finalFileObject = {
          ...approvalFromDb.file, // Spread properti dari DB
          filename: gDriveFileName, // Timpa/tambahkan filename dari GDrive
        };
      } else { // Jika tidak ada data file dari DB (misal relasi null), buat struktur minimal
        finalFileObject = {
          id: approvalFromDb.file_id_ref, // Harus ada karena ini ID GDrive
          filename: gDriveFileName,
          workspace_id: approvalFromDb.file_workspace_id_ref,
          user_id: approvalFromDb.file_user_id_ref,
          // Isi properti lain dengan null atau default jika diperlukan oleh tipe FileInResponse
          description: null,
          color: null,
          labels: [],
          created_at: new Date(0), // Atau null jika tipe Anda mengizinkan
          updated_at: new Date(0), // Atau null
          pengesahan_pada: null,
        };
      }
    } else {
      gDriveFetchError = "ID File Google Drive tidak ada pada record approval ini.";
      // finalFileObject tetap null jika tidak ada ID sama sekali
    }
    // --- Selesai pengambilan Filename ---

    const responseApproval = {
      ...approvalFromDb,
      file: finalFileObject, // Gunakan objek file yang sudah sesuai tipe FileInResponse | null
      gdrive_fetch_error: gDriveFetchError,
    };

    return NextResponse.json({
      message: `Berhasil mengambil detail approval ID: ${approvalId}.`, // approvalId dari searchParams
      data: responseApproval,
    }, { status: 200 });

  } catch (error: any) {
    // approvalId dari searchParams tersedia di sini
    const approvalIdFromParams = request.nextUrl.searchParams.get('approvalId'); // Ambil lagi untuk logging jika perlu
    console.error(`Error mengambil detail approval untuk ID '${approvalIdFromParams || 'UNKNOWN'}':`, error);
    if (error.code === 'P2025') {
        return NextResponse.json({ error: `Approval dengan ID '${approvalIdFromParams}' tidak ditemukan.` }, { status: 404 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan saat mengambil detail approval.", details: error.message }, { status: 500 });
  }
}