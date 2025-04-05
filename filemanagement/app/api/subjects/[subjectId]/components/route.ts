// app/api/subjects/[subjectId]/components/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
// !! Impor state dummy in-memory dari gradedata/route !!
import { dummySubjectComponents } from '../gradedata/route'; // Sesuaikan path jika beda

// --- Tipe Data ---
interface AssessmentComponent { id: string; name: string; weight: number; }
interface NewComponentData { name: string; weight?: number | string | null; }

// --- Handler POST (Tambah Komponen ke In-Memory) ---
export async function POST(
    request: NextRequest,
    context: { params: { subjectId: string } }
) {
    let subjectId = 'unknown';
    try {
        // Ambil subjectId dari URL
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
        // Struktur URL: /api/subjects/[subjectId]/components
        if (segments.length > 3 && segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'components') {
            subjectId = segments[3];
        } else { throw new Error("Struktur URL tidak valid untuk component POST"); }

        console.log(`[API POST /api/subjects/${subjectId}/components] Menambah komponen ke in-memory...`);
        if (subjectId === 'unknown') { return NextResponse.json({ message: 'Subject ID tidak valid' }, { status: 400 }); }

        const body: NewComponentData = await request.json();
        const { name, weight } = body;

        // Validasi input body
        if (!name || typeof name !== 'string' || name.trim() === '') { return NextResponse.json({ message: 'Nama komponen wajib' }, { status: 400 }); }
        if (weight === undefined || weight === null || weight === '') { return NextResponse.json({ message: 'Bobot (%) wajib' }, { status: 400 }); }
        const numWeight = Number(weight);
        if (isNaN(numWeight) || numWeight <= 0) { return NextResponse.json({ message: 'Bobot (%) > 0' }, { status: 400 }); }

        // Buat objek komponen baru
        const newComponent: AssessmentComponent = {
            id: `comp-${uuidv4().substring(0, 8)}`,
            name: name.trim(),
            weight: numWeight,
        };

        // Tambahkan ke variabel in-memory
        if (!dummySubjectComponents[subjectId]) {
            dummySubjectComponents[subjectId] = [];
        }
        dummySubjectComponents[subjectId].push(newComponent);
        console.log(`[API POST /api/subjects/${subjectId}/components] Komponen in-memory ditambah:`, newComponent);

        return NextResponse.json(newComponent, { status: 201 });

    } catch (error: any) {
        const subjectIdForError = context.params?.subjectId || subjectId;
        if (error instanceof SyntaxError) { console.error(`[API POST /api/subjects/${subjectIdForError}/components] Invalid JSON:`, error); return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 }); }
        console.error(`[API POST /api/subjects/${subjectIdForError}/components] Error:`, error);
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Kesalahan Server Internal' }, { status: 500 });
    }
}