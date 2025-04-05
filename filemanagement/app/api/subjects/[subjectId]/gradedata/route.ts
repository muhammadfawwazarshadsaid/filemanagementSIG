// File: app/api/subjects/[subjectId]/gradedata/route.ts
// Catatan: '[subjectId]' di path ini merujuk pada ID unik kelas (e.g., 'mtk-2425')

import { NextRequest, NextResponse } from 'next/server';
import { allStudentsDb, GradesState, Student, taughtClassesDb } from '../../dummy';
// --- Handler GET ---
export async function GET(
    request: NextRequest,
    context: { params: { subjectId: string } }
) {
    let uniqueClassId: string | undefined;

    try {
        
        // Ambil subjectId dari path URL (sesuai kode asli Anda)
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
        // Contoh path: /api/subjects/matematika/gradedata
        if (segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'gradedata') {
            uniqueClassId = segments[3]; // Ambil bagian ketiga (index 3)
        } else {
            console.error("Struktur URL tidak valid untuk gradedata GET:", pathname);
            // Jika struktur URL salah, lebih baik kembalikan error 400 Bad Request
            return NextResponse.json({ message: 'Struktur URL tidak valid. Harusnya /api/subjects/[subjectId]/gradedata' }, { status: 400 });
        }

        console.log(`[API GET /api/subjects/${uniqueClassId}/gradedata] Mencari kelas...`);

        if (!uniqueClassId) {
            return NextResponse.json({ message: 'ID unik kelas (dari URL path) diperlukan' }, { status: 400 });
        }

        const taughtClass = taughtClassesDb.find(tc => tc.id === uniqueClassId);

        if (!taughtClass) {
            console.log(`Kelas dgn ID ${uniqueClassId} tidak ditemukan.`);
            return NextResponse.json({
                students: [], assessmentComponents: [],
                subjectName: `Data Kelas (ID: ${uniqueClassId}) Tidak Ditemukan`,
                initialGrades: {},
                academicYear: '' // Beri nilai default jika tidak ditemukan
            }, { status: 404 });
        }

        const studentsInClass: Student[] = allStudentsDb.filter(student =>
            taughtClass.studentIds.includes(student.id)
        );

        const relevantInitialGrades: GradesState = {};
        studentsInClass.forEach(student => {
            const studentGrades = taughtClass.grades[student.id] || {};
            relevantInitialGrades[student.id] = {};
            taughtClass.components.forEach(comp => {
                relevantInitialGrades[student.id][comp.id] = studentGrades[comp.id] !== undefined ? studentGrades[comp.id] : null;
            });
        });

        // !! TAMBAHKAN academicYear ke responseData !!
        const responseData = {
            students: studentsInClass,
            assessmentComponents: taughtClass.components,
            subjectName: taughtClass.subjectName,
            initialGrades: relevantInitialGrades,
            academicYear: taughtClass.academicYear // <-- Tambahkan ini
        };

        console.log(`[API GET /api/subjects/${uniqueClassId}/gradedata] Data kelas ditemukan.`);
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`[API GET /api/subjects/${uniqueClassId}/gradedata] Error:`, error);
        const message = error instanceof Error ? error.message : 'Kesalahan Internal Server';
        return NextResponse.json({ message: message }, { status: 500 });
    }
}

// --- Handler POST (Tidak Berubah) ---
export async function POST(
    request: NextRequest,
    context: { params: { subjectId: string } }
) {
    let uniqueClassId: string | undefined;
    try {
        // Ambil subjectId dari path URL (sesuai kode asli Anda)
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
        // Contoh path: /api/subjects/matematika/gradedata
        if (segments[1] === 'api' && segments[2] === 'subjects' && segments[4] === 'gradedata') {
            uniqueClassId = segments[3]; // Ambil bagian ketiga (index 3)
        } else {
            console.error("Struktur URL tidak valid untuk gradedata GET:", pathname);
            // Jika struktur URL salah, lebih baik kembalikan error 400 Bad Request
            return NextResponse.json({ message: 'Struktur URL tidak valid. Harusnya /api/subjects/[subjectId]/gradedata' }, { status: 400 });
        }
        console.log(`[API POST /api/subjects/${uniqueClassId}/gradedata] Menerima simpan nilai...`);
        if (!uniqueClassId) { return NextResponse.json({ message: 'ID unik kelas diperlukan' }, { status: 400 }); }

        const taughtClassIndex = taughtClassesDb.findIndex(tc => tc.id === uniqueClassId);
        if (taughtClassIndex === -1) { return NextResponse.json({ message: `Kelas dgn ID ${uniqueClassId} tidak ditemukan.` }, { status: 404 }); }

        const body = await request.json();
        const { studentId, componentId, score } = body;
        if (studentId === undefined || componentId === undefined || score === undefined) { return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 }); }

        let finalScore: number | null;
        if (score === null || score === '') { finalScore = null; }
        else { const numericScore = Number(score); if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) { return NextResponse.json({ message: 'Nilai 0-100 atau kosong' }, { status: 400 }); } finalScore = numericScore; }

        const targetClass = taughtClassesDb[taughtClassIndex];
        if (!targetClass.studentIds.includes(studentId)) { return NextResponse.json({ message: `Siswa ${studentId} tidak terdaftar.` }, { status: 400 }); }
        if (!targetClass.components.some(c => c.id === componentId)) { return NextResponse.json({ message: `Komponen ${componentId} tidak valid.` }, { status: 400 }); }

        if (!targetClass.grades[studentId]) { targetClass.grades[studentId] = {}; }
        targetClass.grades[studentId][componentId] = finalScore;

        console.log(`[API POST /api/subjects/${uniqueClassId}/gradedata] Nilai disimpan: ${studentId}, ${componentId}, ${finalScore}`);
        return NextResponse.json({ message: `Nilai disimpan (in-memory) untuk kelas ${uniqueClassId}.` }, { status: 200 });

    } catch (error: any) {
         if (error instanceof SyntaxError) { console.error(`[API POST /api/subjects/${uniqueClassId}/gradedata] Invalid JSON:`, error); return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 });}
         console.error(`[API POST /api/subjects/${uniqueClassId}/gradedata] Error:`, error);
         return NextResponse.json({ message: error instanceof Error ? error.message : 'Kesalahan Internal Server' }, { status: 500 });
    }
}

// Endpoint untuk komponen (PUT, POST, DELETE) bisa ditambahkan di sini
// atau di file terpisah seperti /api/subjects/[subjectId]/components/[componentId]/route.ts
// Contoh:
// export async function PUT(...) {}
// export async function DELETE(...) {}
// export async function POST(...) {} // Untuk menambah komponen baru ke subjectId