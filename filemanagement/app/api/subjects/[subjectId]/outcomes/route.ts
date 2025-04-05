// app/api/subjects/[subjectId]/outcomes/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface UpdateOutcomePayload {
    type: 'pengetahuan' | 'keterampilan';
    description: string;
}
// !! BARU: State untuk Capaian Kompetensi
let dummySubjectOutcomes: Record<string, { pengetahuan: string; keterampilan: string; }> = {
    'matematika': {
        pengetahuan: "Memahami konsep dasar aljabar, geometri, dan statistika serta mampu menerapkannya dalam pemecahan masalah sederhana.",
        keterampilan: "Mampu melakukan perhitungan matematis dasar, menganalisis data sederhana, dan mengkomunikasikan penalaran matematis."
    },
    'fisika': {
        pengetahuan: "Memahami hukum-hukum dasar mekanika, termodinamika, dan optik serta fenomena fisis terkait.",
        keterampilan: "Mampu melakukan eksperimen fisika sederhana, menganalisis data hasil percobaan, dan menerapkan konsep fisika dalam konteks teknologi."
    },
    'default': {
        pengetahuan: "Deskripsi capaian pengetahuan default.",
        keterampilan: "Deskripsi capaian keterampilan default."
    }
};
// Ekspor semua state dummy yang relevan
export { dummySubjectOutcomes };
    
export async function PUT(
    request: NextRequest,
    { params }: { params: { subjectId: string } }
) {
    // !! Ambil subjectId dari URL, BUKAN dari context.params !!
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const subjectId = segments[3];
    console.log(`[API PUT /api/subjects/${subjectId}/outcomes]`);
    if (!subjectId) {
        return NextResponse.json({ message: 'Subject ID diperlukan' }, { status: 400 });
    }

    try {
        const body: UpdateOutcomePayload = await request.json();
        const { type, description } = body;

        if (!type || (type !== 'pengetahuan' && type !== 'keterampilan')) {
            return NextResponse.json({ message: 'Tipe capaian (pengetahuan/keterampilan) tidak valid' }, { status: 400 });
        }
        if (description === undefined || typeof description !== 'string') {
             return NextResponse.json({ message: 'Deskripsi diperlukan dan harus berupa teks' }, { status: 400 });
        }

        // Pastikan entri subject ada
        if (!dummySubjectOutcomes[subjectId] && subjectId !== 'default') {
            // Inisialisasi jika belum ada (opsional, tergantung logika Anda)
            dummySubjectOutcomes[subjectId] = {
                pengetahuan: dummySubjectOutcomes['default'].pengetahuan,
                keterampilan: dummySubjectOutcomes['default'].keterampilan
            };
            console.log(`[API PUT /api/subjects/${subjectId}/outcomes] Initialized default outcomes.`);
        }

        // Update state dummy
        const target = dummySubjectOutcomes[subjectId] || dummySubjectOutcomes['default'];
        target[type] = description.trim(); // Update deskripsi

        console.log(`[API PUT /api/subjects/${subjectId}/outcomes] Updated '${type}' outcome.`);
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate delay

        // Kembalikan data outcomes yang sudah diupdate
        return NextResponse.json(target, { status: 200 });

    } catch (error: any) {
        if (error instanceof SyntaxError) {
            return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 });
        }
        console.error(`[API PUT /api/subjects/${subjectId}/outcomes] Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal' }, { status: 500 });
    }
}