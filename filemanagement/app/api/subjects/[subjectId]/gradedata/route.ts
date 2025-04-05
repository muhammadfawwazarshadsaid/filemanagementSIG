// app/api/grade-data/[subjectId]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Tipe Data (Konsistenkan)
interface AssessmentComponent { id: string; name: string; weight: number; } // Menggunakan weight
interface Student { id: string; name: string; }
type GradesState = Record<string, Record<string, number | null>>;

// --- Dummy Data ---
const dummyStudents: Student[] = [
    { id: 'siswa-001', name: 'Ahmad Budi' },
    { id: 'siswa-002', name: 'Citra Lestari' },
    { id: 'siswa-003', name: 'Dedi Prasetyo' },
    { id: 'siswa-004', name: 'Eka Putri' },
];

let dummySubjectComponents: Record<string, AssessmentComponent[]> = {
    'matematika': [
        { id: 'uh-1', name: 'Ulangan Harian 1', weight: 20 }, { id: 'uh-2', name: 'Ulangan Harian 2', weight: 20 },
        { id: 'uts', name: 'UTS', weight: 25 }, { id: 'uas', name: 'UAS', weight: 35 },
    ],
    'fisika': [
        { id: 'prak-1', name: 'Praktikum 1', weight: 25 }, { id: 'prak-2', name: 'Praktikum 2', weight: 25 },
        { id: 'uts-fsk', name: 'UTS Fisika', weight: 20 }, { id: 'uas-fsk', name: 'UAS Fisika', weight: 30 },
    ],
    'default': [
        { id: 'tgs-1', name: 'Tugas 1', weight: 30 }, { id: 'tgs-2', name: 'Tugas 2', weight: 30 },
        { id: 'kuis', name: 'Kuis', weight: 40 },
    ]
};

let dummyInitialGrades: GradesState = {
    'siswa-001': { 'uh-1': 85, 'uh-2': 90, 'uts': 78, 'uas': 80, 'prak-1': 95 }, // Contoh nilai awal
    'siswa-002': { 'uh-1': 92, 'uts': 88, 'uas': null, 'prak-1': 85, 'prak-2': 90 },
    'siswa-003': { 'uh-1': 70, 'uts': 65 },
    // siswa-004 belum punya nilai
};

// Fungsi nama subject tetap sama
const getDummySubjectName = (subjectId: string) => {
    const capitalizedId = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
    return `Mata Pelajaran ${capitalizedId}`;
};



// --- Handler GET ---
export async function GET(
    request: NextRequest,
    { params }: { params: { subjectId: string } }
) {
    const subjectId = params.subjectId;
    console.log(`[API GET /api/grade-data/${subjectId}]`);
    if (!subjectId) return NextResponse.json({ message: 'Subject ID diperlukan' }, { status: 400 });

    try {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay

        const students = dummyStudents;
        const assessmentComponents = dummySubjectComponents[subjectId] || dummySubjectComponents['default'] || []; // Ambil komponen
        const subjectName = getDummySubjectName(subjectId);

        // Siapkan state nilai awal yang relevan
        const relevantInitialGrades: GradesState = {};
         students.forEach(student => {
            relevantInitialGrades[student.id] = {};
             assessmentComponents.forEach(comp => {
                // Ambil nilai dari dummy jika ada, jika tidak default null
                relevantInitialGrades[student.id][comp.id] = dummyInitialGrades[student.id]?.[comp.id] ?? null;
            });
        });

        const responseData = { students, assessmentComponents, subjectName, initialGrades: relevantInitialGrades };
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`[API GET /api/grade-data/${subjectId}] Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal' }, { status: 500 });
    }
}

// --- Handler POST (Simpan Nilai) ---
export async function POST(
    request: NextRequest,
    { params }: { params: { subjectId: string } }
) {
    const subjectId = params.subjectId;
    console.log(`[API POST /api/subjects/${subjectId}] Save Grade`);
    if (!subjectId) return NextResponse.json({ message: 'Subject ID diperlukan' }, { status: 400 });

    try {
        const body = await request.json();
        const { studentId, componentId, score } = body;

        if (studentId === undefined || componentId === undefined || score === undefined) {
            return NextResponse.json({ message: 'Data nilai tidak lengkap' }, { status: 400 });
        }

        const finalScore = score === null || score === '' ? null : Number(score);
        // Validasi skor 0-100 di API juga (opsional, sudah ada di client)
        if (finalScore !== null && (isNaN(finalScore) || finalScore < 0 || finalScore > 100)) {
            return NextResponse.json({ message: 'Nilai harus antara 0 dan 100 atau kosong' }, { status: 400 });
        }

        // Simpan ke dummy state
        if (!dummyInitialGrades[studentId]) { dummyInitialGrades[studentId] = {}; }
        dummyInitialGrades[studentId][componentId] = finalScore;

        console.log(`[API POST /api/grade-data/${subjectId}] Grade saved:`, { studentId, componentId, finalScore });
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

        return NextResponse.json({ message: `Nilai disimpan.` }, { status: 200 });

    } catch (error: any) {
        if (error instanceof SyntaxError) return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 });
        console.error(`[API POST /api/grade-data/${subjectId}] Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal' }, { status: 500 });
    }
}
// !! EKSPOR variabel agar bisa diakses API lain (HATI-HATI di aplikasi nyata)
// Di aplikasi nyata, ini akan diakses via database/service, bukan ekspor langsung.
export { dummySubjectComponents, dummyInitialGrades };