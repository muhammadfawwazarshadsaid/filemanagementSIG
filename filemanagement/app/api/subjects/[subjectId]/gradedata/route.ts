// app/api/subjects/[subjectId]/gradedata/route.ts

import { NextRequest, NextResponse } from 'next/server';

// --- Tipe Data ---
interface AssessmentComponent { id: string; name: string; weight: number; }
interface Student { id: string; name: string; }
type GradesState = Record<string, Record<string, number | null>>;

// --- Dummy Data In-Memory (Akan Reset Saat Server Restart) ---
let dummyStudents: Student[] = [
    { id: 'siswa-001', name: 'Ahmad Budi' }, { id: 'siswa-002', name: 'Citra Lestari' },
    { id: 'siswa-003', name: 'Dedi Prasetyo' }, { id: 'siswa-004', name: 'Eka Putri' },
];
let dummySubjectComponents: Record<string, AssessmentComponent[]> = {
    'matematika': [ { id: 'uh-1', name: 'UH 1', weight: 20 }, { id: 'uh-2', name: 'UH 2', weight: 20 }, { id: 'uts', name: 'UTS', weight: 25 }, { id: 'uas', name: 'UAS', weight: 35 }, ],
    'fisika': [ { id: 'prak-1', name: 'Prak 1', weight: 25 }, { id: 'prak-2', name: 'Prak 2', weight: 25 }, { id: 'uts-fsk', name: 'UTS Fis', weight: 20 }, { id: 'uas-fsk', name: 'UAS Fis', weight: 30 }, ],
    'default': [ { id: 'tgs-1', name: 'Tugas 1', weight: 30 }, { id: 'tgs-2', name: 'Tugas 2', weight: 30 }, { id: 'kuis', name: 'Kuis', weight: 40 }, ]
};
let dummyInitialGrades: GradesState = {
    'siswa-001': { 'uh-1': 85, 'uh-2': 90, 'uts': 78, 'uas': 80, 'prak-1': 95 },
    'siswa-002': { 'uh-1': 92, 'uts': 88, 'uas': null, 'prak-1': 85, 'prak-2': 90 },
    'siswa-003': { 'uh-1': 70, 'uts': 65 },
};
const getDummySubjectName = (subjectId: string) => `Mata Pelajaran ${subjectId.charAt(0).toUpperCase() + subjectId.slice(1)}`;
// --- Akhir Dummy Data ---

// --- Handler GET ---
export async function GET(
    request: NextRequest,
    context: { params: { subjectId: string } }
) {
    let subjectId = 'unknown';
    try {
        // Ambil subjectId dari URL
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
        if (segments.length > 3 && segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'gradedata') {
             subjectId = segments[3];
         } else { throw new Error("Struktur URL tidak valid untuk gradedata GET"); }

        console.log(`[API GET /api/subjects/${subjectId}/gradedata] Mengambil data in-memory...`);
        if (subjectId === 'unknown') { return NextResponse.json({ message: 'Subject ID tidak valid di URL' }, { status: 400 }); }

        // Simulasi delay (opsional)
        // await new Promise(resolve => setTimeout(resolve, 50));

        const students = dummyStudents;
        const assessmentComponents = dummySubjectComponents[subjectId] || dummySubjectComponents['default'] || [];
        const subjectName = getDummySubjectName(subjectId);

        // Siapkan nilai awal dari variabel in-memory
        const relevantInitialGrades: GradesState = {};
        students.forEach(student => {
            relevantInitialGrades[student.id] = {};
            assessmentComponents.forEach(comp => {
                relevantInitialGrades[student.id][comp.id] = dummyInitialGrades[student.id]?.[comp.id] ?? null;
            });
        });

        const responseData = { students, assessmentComponents, subjectName, initialGrades: relevantInitialGrades };
        console.log(`[API GET /api/subjects/${subjectId}/gradedata] Data in-memory dikirim.`);
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`[API GET /api/subjects/${subjectId}/gradedata] Error:`, error);
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Kesalahan Server Internal' }, { status: 500 });
    }
}

// --- Handler POST (Simpan Nilai ke In-Memory) ---
export async function POST(
    request: NextRequest,
    context: { params: { subjectId: string } }
) {
    let subjectId = 'unknown';
    try {
        // Ambil subjectId dari URL
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
         if (segments.length > 3 && segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'gradedata') {
            subjectId = segments[3];
        } else { throw new Error("Struktur URL tidak valid untuk gradedata POST"); }

        console.log(`[API POST /api/subjects/${subjectId}/gradedata] Menyimpan nilai ke in-memory...`);
        if (subjectId === 'unknown') { return NextResponse.json({ message: 'Subject ID tidak valid di URL' }, { status: 400 }); }

        const body = await request.json();
        const { studentId, componentId, score } = body;

        if (studentId === undefined || componentId === undefined || score === undefined) { return NextResponse.json({ message: 'Data nilai tidak lengkap' }, { status: 400 }); }
        const finalScore = score === null || score === '' ? null : Number(score);
        if (finalScore !== null && (isNaN(finalScore) || finalScore < 0 || finalScore > 100)) { return NextResponse.json({ message: 'Nilai harus 0-100 atau kosong' }, { status: 400 }); }

        // Simpan ke variabel in-memory
        if (!dummyInitialGrades[studentId]) { dummyInitialGrades[studentId] = {}; }
        dummyInitialGrades[studentId][componentId] = finalScore;
        console.log(`[API POST /api/subjects/${subjectId}/gradedata] Nilai in-memory disimpan:`, { studentId, componentId, finalScore });

        return NextResponse.json({ message: `Nilai (in-memory) disimpan.` }, { status: 200 });

    } catch (error: any) {
        if (error instanceof SyntaxError) { console.error(`[API POST /api/subjects/${subjectId}/gradedata] Invalid JSON:`, error); return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 });}
        console.error(`[API POST /api/subjects/${subjectId}/gradedata] Error:`, error);
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Kesalahan Server Internal' }, { status: 500 });
    }
}

// !! Ekspor KEMBALI state dummy agar bisa diimpor API lain !!
export { dummyStudents, dummySubjectComponents, dummyInitialGrades };