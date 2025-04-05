// app/lib/dummy-data.ts

// --- Tipe Data ---
// Definisikan tipe data yang konsisten dengan penggunaan di API

/** Komponen Penilaian dalam satu kelas spesifik */
export interface AssessmentComponent {
  id: string; // ID unik komponen (e.g., 'mtk-uh1-2425')
  name: string; // Nama komponen (e.g., 'UH 1')
  weight: number; // Bobot komponen (e.g., 25 for 25%)
}

/** Informasi dasar siswa */
export interface Student {
  id: string; // ID unik siswa (e.g., 'siswa-001')
  name: string; // Nama lengkap siswa
}

/** Struktur untuk menyimpan nilai: { studentId: { componentId: score | null } } */
export type GradesState = Record<string, Record<string, number | null>>;

/** Struktur data untuk satu instance kelas yang diajar pada tahun ajaran tertentu */
export interface TaughtClass {
  id: string; // ID unik untuk instance kelas ini (misal: mtk-2425)
  subjectId: string; // ID mapel generik (misal: matematika)
  subjectName: string; // Nama mapel spesifik tahun itu (misal: Matematika)
  academicYear: string; // Tahun Ajaran (misal: 2024/2025)
  studentIds: string[]; // Daftar ID siswa yang terdaftar di kelas ini
  components: AssessmentComponent[]; // Komponen penilaian khusus untuk kelas ini
  grades: GradesState; // Nilai siswa *di kelas ini*
}
// --- Akhir Tipe Data ---


// --- Daftar Semua Siswa (Master Data) ---
// Sumber data utama untuk informasi siswa. API akan mengambil nama dari sini.
export const allStudentsDb: Student[] = [
    { id: 'siswa-001', name: 'Ahmad Budi' },
    { id: 'siswa-002', name: 'Citra Lestari' },
    { id: 'siswa-003', name: 'Dedi Prasetyo' },
    { id: 'siswa-004', name: 'Eka Putri' },
    // Tambahkan siswa lain jika perlu
];

// --- Data Kelas yang Diajar (In-Memory Database) ---
// Array ini merepresentasikan semua kelas yang diajar oleh sistem/guru.
// Setiap elemen adalah satu instance kelas pada tahun ajaran tertentu.
// API akan mencari data dalam array ini berdasarkan subjectId dan academicYear,
// dan akan memodifikasi properti `grades` di dalamnya saat menyimpan nilai.
export let taughtClassesDb: TaughtClass[] = [
    {
        id: "mtk-2425", // ID unik: mapel-tahunAjaranSingkat
        subjectId: "matematika", // ID mapel generik
        subjectName: "Matematika", // Nama spesifik kelas/mapel tahun itu
        academicYear: "2024/2025", // Tahun ajaran lengkap
        studentIds: ["siswa-001", "siswa-002"], // Siswa di kelas ini
        components: [ // Komponen penilaian *untuk kelas ini*
            { id: 'mtk-uh1-2425', name: 'UH 1', weight: 25 },
            { id: 'mtk-uts-2425', name: 'UTS', weight: 35 },
            { id: 'mtk-uas-2425', name: 'UAS', weight: 40 }
        ],
        grades: { // Nilai siswa di kelas ini
            'siswa-001': { 'mtk-uh1-2425': 85, 'mtk-uts-2425': 78, 'mtk-uas-2425': null }, // UAS Ahmad Budi belum diisi
            'siswa-002': { 'mtk-uh1-2425': 90, 'mtk-uts-2425': 88, 'mtk-uas-2425': 92 }
        }
    },
    {
        id: "fsk-2425",
        subjectId: "fisika",
        subjectName: "Fisika",
        academicYear: "2024/2025",
        studentIds: ["siswa-001"], // Hanya 1 siswa
        components: [
            { id: 'fsk-prak1-2425', name: 'Praktikum 1', weight: 40 },
            { id: 'fsk-uts-2425', name: 'UTS', weight: 60 }
        ],
        grades: {
            'siswa-001': { 'fsk-prak1-2425': 90, 'fsk-uts-2425': null } // UTS Fisika Ahmad Budi belum diisi
        }
    },
    {
        id: "mtk-2526",
        subjectId: "matematika", // Mapel sama, tahun ajaran beda
        subjectName: "Matematika Lanjut", // Nama bisa beda
        academicYear: "2025/2026",
        studentIds: ["siswa-003", "siswa-004", "siswa-001"], // Siswa bisa lintas tahun
        components: [
            { id: 'mtk-proyek-2526', name: 'Proyek', weight: 50 },
            { id: 'mtk-final-2526', name: 'Ujian Final', weight: 50 }
        ],
        grades: { // Pastikan semua siswa terdaftar punya entri, dan semua komponen ada key-nya
            'siswa-001': { 'mtk-proyek-2526': 95, 'mtk-final-2526': 88 },
            'siswa-003': { 'mtk-proyek-2526': 80, 'mtk-final-2526': null }, // Final Dedi belum diisi
            'siswa-004': { 'mtk-proyek-2526': null, 'mtk-final-2526': null } // Eka belum ada nilai sama sekali
        }
    },
    // Tambahkan data kelas lain jika perlu (misal: Kimia 2024/2025, dll.)
];

// --- Contoh Penggunaan (Tidak diekspor, hanya untuk ilustrasi) ---
/*
// Mencari kelas Matematika tahun 2024/2025
const math2425 = taughtClassesDb.find(tc => tc.subjectId === 'matematika' && tc.academicYear === '2024/2025');

// Mendapatkan daftar siswa di kelas itu
if (math2425) {
    const studentDetails = allStudentsDb.filter(s => math2425.studentIds.includes(s.id));
    console.log("Siswa di kelas Matematika 2024/2025:", studentDetails);
    console.log("Komponen penilaian:", math2425.components);
    console.log("Nilai awal:", math2425.grades);

    // Contoh simulasi update nilai via API (akan memodifikasi math2425.grades['siswa-001']['mtk-uas-2425'])
    // POST /api/subjects/matematika/gradedata?tahun=2024/2025
    // Body: { studentId: 'siswa-001', componentId: 'mtk-uas-2425', score: 80 }
}
*/