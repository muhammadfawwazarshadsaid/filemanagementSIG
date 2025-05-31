// app/api/approvals/getall/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10); // Anda bisa sesuaikan default limit
    const skip = (page - 1) * limit;
    const searchTerm = searchParams.get('search'); // Ambil parameter search

    const googleAccessToken = request.headers.get('Authorization')?.substring(7);
    if (!googleAccessToken) {
      return NextResponse.json({ error: "Google Access Token tidak tersedia." }, { status: 401 });
    }

    let whereClause: any = {
      // --- MODIFIED SECTION START ---
      // Filter untuk tidak mengambil approval yang sudah secara eksplisit dibatalkan dan digantikan
      NOT: {
        status: {
          in: ["Dibatalkan (Digantikan)", "Dibatalkan"] // Sesuaikan dengan string status yang Anda gunakan
        }
      }
      // --- MODIFIED SECTION END ---
    };

    if (workspaceId) {
      whereClause.file_workspace_id_ref = workspaceId;
    }

    // Implementasi pencarian (contoh sederhana, bisa dikembangkan)
    if (searchTerm && searchTerm.trim() !== "") {
        // Cari berdasarkan deskripsi file atau ID file, atau nama approver/assigner
        // Ini memerlukan join atau query yang lebih kompleks jika ingin search nama dari relasi.
        // Untuk contoh ini, kita akan search di remarks atau status (jika relevan).
        // Atau, jika Anda sudah menyimpan nama file di tabel approval atau file, bisa search di sana.
        // Misal, jika Anda ingin search file berdasarkan deskripsi di tabel 'file':
        whereClause.file = {
            description: {
                contains: searchTerm,
                mode: 'insensitive',
            },
        };
        // Jika ingin juga mencari berdasarkan status approval:
        // whereClause.OR = [
        //     { file: { description: { contains: searchTerm, mode: 'insensitive' } } },
        //     { status: { contains: searchTerm, mode: 'insensitive' } }
        // ];
    }


    const totalApprovals = await prisma.approval.count({ where: whereClause });
    const approvalsFromDb = await prisma.approval.findMany({
      where: whereClause,
      include: {
        approver: { select: { id: true, displayname: true, primaryemail: true } },
        assigner: { select: { id: true, displayname: true, primaryemail: true } }, // Ambil primaryemail assigner juga
        file: { // Ini adalah relasi ke tabel 'file' berdasarkan foreign key di 'approval'
          select: {
            id: true, // GDrive File ID
            description: true,
            // filename: true, // HANYA JIKA ADA FIELD 'filename' di model Prisma 'file' Anda
            workspace_id: true,
            user_id: true,
            // mimeType dan iconLink biasanya dari GDrive, bukan DB 'file' kita
            // Jika Anda menyimpannya di DB, select di sini.
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: skip,
      take: limit,
    });

    const approvalsWithGDriveInfo = await Promise.all(
      approvalsFromDb.map(async (approval) => {
        let gDriveFileName = "N/A";
        let gDriveMimeType: string | null = null;
        let gDriveIconLink: string | null = null;
        let gDriveWebViewLink: string | null = null;
        let gDriveFetchError = null;

        if (approval.file?.id) {
          try {
            const gDriveApiUrl = `https://www.googleapis.com/drive/v3/files/${approval.file.id}?fields=name,mimeType,iconLink,webViewLink`;
            const response = await fetch(gDriveApiUrl, {
              headers: { 'Authorization': `Bearer ${googleAccessToken}` },
            });
            if (response.ok) {
              const fileData = await response.json();
              gDriveFileName = fileData.name || "Nama tidak ditemukan";
              gDriveMimeType = fileData.mimeType;
              gDriveIconLink = fileData.iconLink;
              gDriveWebViewLink = fileData.webViewLink;
            } else {
              const errorData = await response.json().catch(() => ({}));
              gDriveFetchError = `GDrive API Error ${response.status}: ${errorData?.error?.message || response.statusText}`;
            }
          } catch (e: any) {
            gDriveFetchError = `Exception GDrive fetch: ${e.message}`;
          }
        } else {
          gDriveFetchError = "ID File GDrive tidak ada pada record approval.";
        }
        
        // Gabungkan data file dari DB dengan info dari GDrive
        const finalFileObject = approval.file ? {
            ...approval.file, // data dari DB (id, description, workspace_id, user_id)
            filename: gDriveFileName, // dari GDrive
            mimeType: gDriveMimeType, // dari GDrive
            iconLink: gDriveIconLink, // dari GDrive
            webViewLink: gDriveWebViewLink, // dari GDrive
        } : { // Fallback jika approval.file null tapi ada referensi ID
            id: approval.file_id_ref,
            filename: gDriveFileName,
            mimeType: gDriveMimeType,
            iconLink: gDriveIconLink,
            webViewLink: gDriveWebViewLink,
            description: null,
            workspace_id: approval.file_workspace_id_ref,
            user_id: approval.file_user_id_ref,
        };

        return {
          ...approval,
          file: finalFileObject, // Timpa relasi file dengan objek yang sudah digabung
          gdrive_fetch_error: gDriveFetchError,
        };
      })
    );

    return NextResponse.json({
      message: "Berhasil mengambil daftar approval.",
      data: approvalsWithGDriveInfo,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalApprovals / limit),
        totalItems: totalApprovals,
        itemsPerPage: limit,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error mengambil daftar approval:", error.message, error.stack);
    return NextResponse.json({ error: "Terjadi kesalahan internal.", details: error.message }, { status: 500 });
  }
}