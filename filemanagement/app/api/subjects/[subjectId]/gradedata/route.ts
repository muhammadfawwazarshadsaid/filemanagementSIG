// File: app/api/subjects/[subjectId]/gradedata/route.ts
// Catatan: '[subjectId]' di path ini SEKARANG merujuk pada ID unik kelas (e.g., 'mtk-2425')

import { NextRequest, NextResponse } from 'next/server';
import { allStudentsDb, GradesState, Student, taughtClassesDb } from '../../dummy';
// --- Handler GET ---
// Mengambil data siswa, komponen, dan nilai untuk kelas SPESIFIK
// berdasarkan ID unik kelas (dari URL path) sebagai 'subjectId'.
export async function GET(
    request: NextRequest,
    context: { params: { subjectId: string } } // Mengambil parameter dari path URL
) {
    let uniqueClassId: string | undefined; // Ganti nama variabel agar lebih jelas

    try {
        // Ambil ID unik kelas dari context.params
        uniqueClassId = context.params.subjectId; // 'subjectId' di sini adalah nama parameter dari folder '[subjectId]'

        console.log(`[API GET /api/subjects/${uniqueClassId}/gradedata] Mencari kelas dengan ID unik...`);

        // Validasi apakah ID unik kelas berhasil didapatkan
        if (!uniqueClassId) {
            // Jika ID tidak ada (misal: URL salah panggil)
            return NextResponse.json({ message: 'ID unik kelas (dari URL path) diperlukan' }, { status: 400 });
        }

        // Cari kelas yang cocok di array taughtClassesDb berdasarkan ID uniknya (tc.id)
        const taughtClass = taughtClassesDb.find(tc => tc.id === uniqueClassId);

        if (!taughtClass) {
            console.log(`Kelas dengan ID unik ${uniqueClassId} tidak ditemukan.`);
            return NextResponse.json({
                students: [],
                assessmentComponents: [],
                subjectName: `Data Kelas (ID: ${uniqueClassId}) Tidak Ditemukan`,
                initialGrades: {}
            }, { status: 404 }); // 404 Not Found
        }

        // --- Logika Sisa Sama Seperti Sebelumnya ---

        // Ambil detail siswa
        const studentsInClass: Student[] = allStudentsDb.filter(student =>
            taughtClass.studentIds.includes(student.id)
        );

        // Siapkan nilai awal
        const relevantInitialGrades: GradesState = {};
        studentsInClass.forEach(student => {
            const studentGrades = taughtClass.grades[student.id] || {};
            relevantInitialGrades[student.id] = {};
            taughtClass.components.forEach(comp => {
                relevantInitialGrades[student.id][comp.id] = studentGrades[comp.id] !== undefined ? studentGrades[comp.id] : null;
            });
        });

        // Siapkan data respons
        const responseData = {
            students: studentsInClass,
            assessmentComponents: taughtClass.components,
            subjectName: taughtClass.subjectName,
            initialGrades: relevantInitialGrades
        };

        console.log(`[API GET /api/subjects/${uniqueClassId}/gradedata] Data kelas ditemukan dan dikirim.`);
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`[API GET /api/subjects/${uniqueClassId}/gradedata] Error:`, error);
        const message = error instanceof Error ? error.message : 'Terjadi Kesalahan Internal Server';
        return NextResponse.json({ message: message }, { status: 500 });
    }
}

// --- Handler POST ---
// Menyimpan/memperbarui nilai siswa untuk kelas SPESIFIK
// berdasarkan ID unik kelas (dari URL path) sebagai 'subjectId'.
export async function POST(
    request: NextRequest,
    context: { params: { subjectId: string } } // Mengambil parameter dari path URL
) {
    let uniqueClassId: string | undefined; // Ganti nama variabel agar lebih jelas

    try {
        // Ambil ID unik kelas dari context.params
        uniqueClassId = context.params.subjectId;

        console.log(`[API POST /api/subjects/${uniqueClassId}/gradedata] Menerima permintaan simpan nilai...`);

        if (!uniqueClassId) {
            return NextResponse.json({ message: 'ID unik kelas (dari URL path) diperlukan' }, { status: 400 });
        }

        // Cari INDEX kelas yang cocok di array taughtClassesDb berdasarkan ID uniknya (tc.id)
        const taughtClassIndex = taughtClassesDb.findIndex(tc => tc.id === uniqueClassId);

        if (taughtClassIndex === -1) {
            console.log(`Kelas dengan ID unik ${uniqueClassId} tidak ditemukan untuk menyimpan nilai.`);
            return NextResponse.json({ message: `Kelas dengan ID unik ${uniqueClassId} tidak ditemukan.` }, { status: 404 });
        }

        // --- Logika Sisa Sama Seperti Sebelumnya ---

        // Parsing body request
        const body = await request.json();
        const { studentId, componentId, score } = body;

        // Validasi input dasar dari body
        if (studentId === undefined || componentId === undefined || score === undefined) {
            return NextResponse.json({ message: 'Data nilai tidak lengkap (membutuhkan studentId, componentId, score)' }, { status: 400 });
        }

        // Konversi dan validasi nilai (score)
        let finalScore: number | null;
        if (score === null || score === '') {
            finalScore = null;
        } else {
            const numericScore = Number(score);
            if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
                return NextResponse.json({ message: 'Nilai tidak valid. Harus angka antara 0-100 atau kosong/null.' }, { status: 400 });
            }
            finalScore = numericScore;
        }

        // Akses kelas target
        const targetClass = taughtClassesDb[taughtClassIndex];

        // Validasi Tambahan: Cek siswa dan komponen
        if (!targetClass.studentIds.includes(studentId)) {
             console.warn(`[API POST] Percobaan menyimpan nilai untuk siswa ${studentId} yang tidak terdaftar di kelas ${uniqueClassId}.`);
             return NextResponse.json({ message: `Siswa dengan ID ${studentId} tidak terdaftar di kelas (ID: ${uniqueClassId}).` }, { status: 400 });
        }
        if (!targetClass.components.some(c => c.id === componentId)) {
            console.warn(`[API POST] Percobaan menyimpan nilai untuk komponen ${componentId} yang tidak ada di kelas ${uniqueClassId}.`);
            return NextResponse.json({ message: `Komponen penilaian dengan ID ${componentId} tidak valid untuk kelas (ID: ${uniqueClassId}).` }, { status: 400 });
        }

        // Simpan/Update Nilai
        if (!targetClass.grades[studentId]) {
            targetClass.grades[studentId] = {};
        }
        targetClass.grades[studentId][componentId] = finalScore;

        console.log(`[API POST /api/subjects/${uniqueClassId}/gradedata] Nilai in-memory berhasil disimpan: Siswa=${studentId}, Komponen=${componentId}, Nilai=${finalScore}`);

        return NextResponse.json({ message: `Nilai berhasil disimpan (in-memory) untuk kelas ${uniqueClassId}.` }, { status: 200 });

    } catch (error: any) {
         if (error instanceof SyntaxError) {
             console.error(`[API POST /api/subjects/${uniqueClassId}/gradedata] Invalid JSON received:`, error);
             return NextResponse.json({ message: 'Format JSON pada body request tidak valid.' }, { status: 400 });
         }
         console.error(`[API POST /api/subjects/${uniqueClassId}/gradedata] Error:`, error);
         const message = error instanceof Error ? error.message : 'Terjadi Kesalahan Internal Server saat menyimpan nilai.';
         return NextResponse.json({ message: message }, { status: 500 });
    }
}