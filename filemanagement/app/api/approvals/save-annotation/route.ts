// File: app/api/approvals/save-annotation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const dynamic = 'force-dynamic';

// --- Helper Functions (Sama seperti sebelumnya, tidak perlu diubah) ---
function getAccessToken(req: NextRequest): string | null {
const authHeader = req.headers.get('authorization');
if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
}
return null;
}

async function downloadFromGoogleDrive(fileId: string, accessToken: string): Promise<ArrayBuffer> {
console.log(`[ANNOTATION] Mengunduh file GDrive: ${fileId}`);
const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
});
if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`[ANNOTATION] Gagal mengunduh dari GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
}
console.log(`[ANNOTATION] Berhasil mengunduh file GDrive: ${fileId}`);
return response.arrayBuffer();
}

async function updateGoogleDriveFile(fileId: string, accessToken: string, newContent: Uint8Array): Promise<any> {
    console.log(`[ANNOTATION] Memulai update file GDrive: ${fileId}`);
    const metadata = { mimeType: 'application/pdf' };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([newContent], { type: 'application/pdf' }));

    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`[ANNOTATION] Gagal update file di GDrive (${response.status}): ${errorData?.error?.message || response.statusText}`);
    }
    console.log(`[ANNOTATION] Berhasil update file GDrive: ${fileId}`);
    return response.json();
}

// Tipe data anotasi yang diharapkan dari frontend
type Annotation = {
id: string; pageIndex: number; type: 'draw' | 'text' | 'image';
x: number; y: number; width: number; height: number; color: string;
path?: { x: number; y: number }[]; strokeWidth?: number; // Draw
text?: string; fontSize?: number; // Text
imageUrl?: string; // Image
};

// --- Fungsi Utama Handler POST ---
export async function POST(request: NextRequest) {
console.log("\n--- [ANNOTATION] API /api/approvals/save-annotation dipanggil ---");
const accessToken = getAccessToken(request);
if (!accessToken) {
    console.error("[ANNOTATION] Gagal: Access token tidak ditemukan.");
    return NextResponse.json({ error: "Unauthorized: Access token tidak ditemukan." }, { status: 401 });
}

try {
    const body = await request.json();
    // Kita hanya butuh fileId dan annotations, yang lain diabaikan
    const { fileId, annotations } = body as { fileId: string; annotations: Annotation[] };
    
    console.log(`[ANNOTATION] Body diterima untuk file ID: ${fileId}`);
    console.log(`[ANNOTATION] Jumlah anotasi: ${annotations?.length || 0}`);

    if (!fileId || !annotations || !Array.isArray(annotations)) {
    console.error("[ANNOTATION] Gagal: Data tidak lengkap.", body);
    return NextResponse.json({ error: "Data tidak lengkap: fileId dan annotations diperlukan." }, { status: 400 });
    }

    // 1. Unduh PDF asli dari Google Drive
    const pdfBytes = await downloadFromGoogleDrive(fileId, accessToken);

    // 2. Muat PDF dan siapkan font
    console.log("[ANNOTATION] Memuat dokumen PDF ke pdf-lib...");
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    console.log("[ANNOTATION] PDF berhasil dimuat.");

    // 3. Terapkan setiap anotasi ke PDF
    console.log("[ANNOTATION] Memulai loop untuk menerapkan anotasi...");
    for (const [index, ann] of annotations.entries()) {
    console.log(`[ANNOTATION] Memproses anotasi #${index + 1} (ID: ${ann.id}, Tipe: ${ann.type})`);
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) {
        console.warn(`[ANNOTATION] Melewatkan anotasi ${ann.id} karena pageIndex (${ann.pageIndex}) di luar rentang.`);
        continue;
    }
    const page = pages[ann.pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    const annX = ann.x * pageWidth;
    const annY = pageHeight - (ann.y * pageHeight);
    const annWidth = ann.width * pageWidth;
    const annHeight = ann.height * pageHeight;

    const annColor = ann.color.startsWith('#') ? ann.color : '#000000';
    const colorComps = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(annColor);
    const color = colorComps ? rgb(parseInt(colorComps[1], 16) / 255, parseInt(colorComps[2], 16) / 255, parseInt(colorComps[3], 16) / 255) : rgb(0, 0, 0);

    switch (ann.type) {
        case 'draw':
        if (ann.path && ann.path.length > 1 && ann.strokeWidth) {
            // **PERBAIKAN: Gunakan page.drawLine dalam loop, lebih stabil daripada drawSvgPath**
            for (let i = 0; i < ann.path.length - 1; i++) {
            const p1 = ann.path[i];
            const p2 = ann.path[i+1];
            page.drawLine({
                start: { x: annX + p1.x * annWidth, y: annY - p1.y * annHeight },
                end:   { x: annX + p2.x * annWidth, y: annY - p2.y * annHeight },
                thickness: ann.strokeWidth,
                color: color,
            });
            }
        }
        break;

        case 'text':
        if (ann.text && ann.fontSize) {
            const textY = annY - annHeight;
            page.drawText(ann.text, {
                x: annX, y: textY, font: helveticaFont,
                size: ann.fontSize, color: color,
                lineHeight: ann.fontSize * 1.2, maxWidth: annWidth,
            });
        }
        break;

        case 'image':
            if (ann.imageUrl && ann.imageUrl.startsWith('data:image/')) {
                const imageBytes = Buffer.from(ann.imageUrl.split(',')[1], 'base64');
                let embeddedImage;
                if(ann.imageUrl.startsWith('data:image/png')){
                    embeddedImage = await pdfDoc.embedPng(imageBytes);
                } else if(ann.imageUrl.startsWith('data:image/jpeg')){
                    embeddedImage = await pdfDoc.embedJpg(imageBytes);
                } else {
                    console.warn(`[ANNOTATION] Melewatkan gambar ${ann.id} karena format tidak didukung.`);
                    continue;
                }
                const imageY = annY - annHeight;
                page.drawImage(embeddedImage, {
                    x: annX, y: imageY,
                    width: annWidth, height: annHeight,
                });
            }
            break;
    }
    console.log(`[ANNOTATION] Selesai memproses anotasi #${index + 1}`);
    }
    console.log("[ANNOTATION] Selesai menerapkan semua anotasi.");

    // 4. Simpan PDF yang telah dimodifikasi
    console.log("[ANNOTATION] Menyimpan byte PDF yang dimodifikasi...");
    const modifiedPdfBytes = await pdfDoc.save();
    console.log(`[ANNOTATION] Ukuran PDF baru: ${modifiedPdfBytes.length} bytes.`);
    
    // 5. Unggah kembali ke Google Drive
    await updateGoogleDriveFile(fileId, accessToken, modifiedPdfBytes);
    
    console.log("[ANNOTATION] --- Proses berhasil, mengirim respons sukses. ---");
    return NextResponse.json({ message: "Anotasi berhasil disimpan dan PDF telah diperbarui." }, { status: 200 });

} catch (error: any) {
    console.error("[ANNOTATION] !!! Terjadi Error di blok catch utama:", error.message, error.stack);
    const clientErrorMessage = error.message.includes("GDrive") ? error.message : "Terjadi kesalahan internal saat memproses PDF.";
    return NextResponse.json({ error: "Gagal menyimpan anotasi.", details: clientErrorMessage }, { status: 500 });
}
}