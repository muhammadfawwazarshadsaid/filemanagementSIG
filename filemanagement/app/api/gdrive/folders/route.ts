// app/api/gdrive/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';

export async function GET(request: NextRequest) {
    const accessToken = request.headers.get('Authorization')?.substring(7);
    if (!accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId'); // Ini adalah GDrive Folder ID dari self-workspace (root)

    if (!workspaceId) {
        return NextResponse.json({ error: "Parameter workspaceId dibutuhkan." }, { status: 400 });
    }

    try {
        // Ambil folder yang ada di dalam workspaceId (root dari self-workspace)
        const query = `'${workspaceId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed=false`;
        const fields = "files(id, name)"; // Hanya ambil ID dan nama folder
        const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name`;

        const gdriveResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!gdriveResponse.ok) {
            const errorData = await gdriveResponse.json().catch(() => ({}));
            console.error("GDrive API Error (fetching folders):", errorData);
            throw new Error(`GDrive API Error (${gdriveResponse.status}): ${errorData?.error?.message || gdriveResponse.statusText}`);
        }

        const data = await gdriveResponse.json();
        // data.files akan berisi array [{id: "folderId1", name: "Nama Folder 1"}, ...]
        return NextResponse.json(data.files || [], { status: 200 });

    } catch (error: any) {
        console.error("Error fetching GDrive folders:", error);
        return NextResponse.json({ error: error.message || "Gagal mengambil daftar folder." }, { status: 500 });
    }
}