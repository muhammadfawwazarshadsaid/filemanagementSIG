// app/api/subjects/[subjectId]/gradedata/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { taughtClassesDb, allStudentsDb } from './dummy';
// Impor struktur data utama dari file terpusat

// --- Tipe Data (Impor dari schema atau definisikan jika perlu) ---
interface AssessmentComponent { id: string; name: string; weight: number; }
interface Student { id: string; name: string; }
type GradesState = Record<string, Record<string, number | null>>;

// --- Helper Function (jika tidak diimpor) ---
const getSubjectNameFromData = (subjectId: string, academicYear: string): string => {
    const taughtClass = taughtClassesDb.find(tc => tc.subjectId === subjectId && tc.academicYear === academicYear);
    const defaultName = `Mata Pelajaran ${subjectId.charAt(0).toUpperCase() + subjectId.slice(1)}`;
    return taughtClass?.subjectName || defaultName;
};

// --- Handler GET ---
export async function GET(
    request: NextRequest,
    context: { params: { subjectId: string } } // Context tetap diterima
) {
    let subjectId = 'unknown';
    let tahunAjaran = 'unknown';
    try {
        // Ambil ID & Tahun Ajaran dari URL
        const pathname = request.nextUrl.pathname; // e.g., /api/subjects/matematika/gradedata
        const segments = pathname.split('/');
        if (segments.length > 3 && segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'gradedata') {
            subjectId = segments[3];
        } else {
            throw new Error("Struktur URL tidak valid untuk subjectId");
        }
        tahunAjaran = request.nextUrl.searchParams.get('tahun') || 'unknown';

        console.log(`[API GET /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Mencari kelas...`);
        if (subjectId === 'unknown' || tahunAjaran === 'unknown') {
            return NextResponse.json({ message: 'Subject ID dan Tahun Ajaran (?tahun=...) diperlukan' }, { status: 400 });
        }

        // Cari kelas yang cocok di database dummy
        const taughtClass = taughtClassesDb.find(tc => tc.subjectId === subjectId && tc.academicYear === tahunAjaran);

        if (!taughtClass) {
            console.log(`Kelas ${subjectId} tahun ${tahunAjaran} tidak ditemukan.`);
            return NextResponse.json({
                students: [],
                assessmentComponents: [],
                subjectName: getSubjectNameFromData(subjectId, tahunAjaran),
                initialGrades: {}
            }, { status: 404 }); // Kirim 404 jika kelas tidak ada
        }

        // Ambil detail siswa dari master list
        const studentsInClass = allStudentsDb.filter(student => taughtClass.studentIds.includes(student.id));

        // Siapkan nilai awal
        const relevantInitialGrades: GradesState = {};
        studentsInClass.forEach(student => {
            relevantInitialGrades[student.id] = taughtClass.grades[student.id] || {};
            taughtClass.components.forEach(comp => {
                if (relevantInitialGrades[student.id][comp.id] === undefined) {
                    relevantInitialGrades[student.id][comp.id] = null;
                }
            });
        });

        const responseData = {
            students: studentsInClass,
            assessmentComponents: taughtClass.components,
            subjectName: taughtClass.subjectName,
            initialGrades: relevantInitialGrades
        };

        console.log(`[API GET /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Data kelas dikirim.`);
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`[API GET /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Error:`, error);
        return NextResponse.json({ message: error instanceof Error ? error.message : 'Kesalahan Server Internal' }, { status: 500 });
    }
}

// --- Handler POST (Simpan Nilai) ---
export async function POST(
    request: NextRequest,
    context: { params: { subjectId: string } }
) {
    let subjectId = 'unknown';
    let tahunAjaran = 'unknown';
    try {
        // Ambil ID & Tahun Ajaran
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
        if (segments.length > 3 && segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'gradedata') {
           subjectId = segments[3];
        } else { throw new Error("Struktur URL tidak valid untuk gradedata POST"); }
        tahunAjaran = request.nextUrl.searchParams.get('tahun') || 'unknown';

        console.log(`[API POST /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Menyimpan nilai ke in-memory...`);
        if (subjectId === 'unknown' || tahunAjaran === 'unknown') {
            return NextResponse.json({ message: 'Subject ID dan Tahun Ajaran (?tahun=...) diperlukan' }, { status: 400 });
        }

        // Cari indeks kelas yang cocok
        const taughtClassIndex = taughtClassesDb.findIndex(tc => tc.subjectId === subjectId && tc.academicYear === tahunAjaran);

        if (taughtClassIndex === -1) {
            return NextResponse.json({ message: `Kelas mapel ${subjectId} tahun ${tahunAjaran} tidak ditemukan.` }, { status: 404 });
        }

        const body = await request.json();
        const { studentId, componentId, score } = body;

        // Validasi input
        if (studentId === undefined || componentId === undefined || score === undefined) { return NextResponse.json({ message: 'Data nilai tidak lengkap' }, { status: 400 }); }
        const finalScore = score === null || score === '' ? null : Number(score);
        if (finalScore !== null && (isNaN(finalScore) || finalScore < 0 || finalScore > 100)) { return NextResponse.json({ message: 'Nilai harus 0-100 atau kosong' }, { status: 400 }); }

        // Validasi siswa & komponen terhadap kelas (opsional)
        if (!taughtClassesDb[taughtClassIndex].studentIds.includes(studentId)) { return NextResponse.json({ message: `Siswa tidak terdaftar di kelas ini.` }, { status: 400 }); }
        if (!taughtClassesDb[taughtClassIndex].components.some(c => c.id === componentId)) { return NextResponse.json({ message: `Komponen penilaian tidak valid.` }, { status: 400 }); }

        // Simpan ke struktur data in-memory
        const subjectGrades = taughtClassesDb[taughtClassIndex].grades;
        if (!subjectGrades[studentId]) {
            subjectGrades[studentId] = {};
        }
        subjectGrades[studentId][componentId] = finalScore; // Update nilai
        console.log(`[API POST /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Nilai in-memory disimpan:`, { studentId, componentId, finalScore });

        // Beritahu klien bahwa penyimpanan (sementara) berhasil
        return NextResponse.json({ message: `Nilai (in-memory) disimpan.` }, { status: 200 });

    } catch (error: any) {
         if (error instanceof SyntaxError) { console.error(`[API POST /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Invalid JSON:`, error); return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 });}
         console.error(`[API POST /api/subjects/${subjectId}/gradedata?tahun=${tahunAjaran}] Error:`, error);
         return NextResponse.json({ message: error instanceof Error ? error.message : 'Kesalahan Server Internal' }, { status: 500 });
    }
}

// Tidak perlu ekspor variabel dummy dari sini lagi