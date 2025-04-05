// app/lib/dummy-data.ts

// --- Tipe Data ---
export interface AssessmentComponent { id: string; name: string; weight: number; }
export interface Student { id: string; name: string; class: string; }
export type GradesState = Record<string, Record<string, number | null>>;
export interface TaughtClass {
  id: string; subjectId: string; subjectName: string; academicYear: string;
  studentIds: string[]; components: AssessmentComponent[]; grades: GradesState;
  // teacherId?: string; // Opsional: Bisa ditambahkan jika perlu link ke guru spesifik
}
// !! Tipe Baru: Teacher !!
export interface Teacher {
    id: string;
    name: string;
    nip: string; // Nomor Induk Pegawai
}
// --- Akhir Tipe Data ---

// --- Data Guru Dummy (Hanya 1 untuk user login) ---
export const currentTeacher: Teacher = {
    id: 'guru-01',
    name: 'Budi Setiawan, S.Pd.', // Nama Guru
    nip: '198501012010121001' // NIP Guru (contoh)
};

// --- Daftar Semua Siswa (Master Data) ---
export const allStudentsDb: Student[] = [
    { id: 'siswa-001', name: 'Ahmad Budi', class: 'Kelas 10A' },
    { id: 'siswa-002', name: 'Citra Lestari', class: 'Kelas 10A' },
    { id: 'siswa-003', name: 'Dedi Prasetyo', class: 'Kelas 10B' },
    { id: 'siswa-004', name: 'Eka Putri', class: 'Kelas 10B' },
    { id: 'siswa-005', name: 'Fajar Nugraha', class: 'Kelas 11A' },
    { id: 'siswa-006', name: 'Gita Savitri', class: 'Kelas 10A' },
];

// --- Data Kelas yang Diajar ---
export let taughtClassesDb: TaughtClass[] = [
    {
        id: "mtk-2425", subjectId: "matematika", subjectName: "Matematika 10",
        academicYear: "2024/2025", // <-- Tahun Ajaran
        studentIds: ["siswa-001", "siswa-002", "siswa-003", "siswa-006"],
        components: [ { id: 'mtk-uh1-2425', name: 'UH 1', weight: 25 }, { id: 'mtk-uts-2425', name: 'UTS', weight: 35 }, { id: 'mtk-uas-2425', name: 'UAS', weight: 40 } ],
        grades: { 'siswa-001': { 'mtk-uh1-2425': 85, 'mtk-uts-2425': 78, 'mtk-uas-2425': null }, 'siswa-002': { 'mtk-uh1-2425': 90, 'mtk-uts-2425': 88, 'mtk-uas-2425': 92 }, 'siswa-003': { 'mtk-uh1-2425': 75, 'mtk-uts-2425': 80, 'mtk-uas-2425': 78 }, 'siswa-006': { 'mtk-uh1-2425': 92, 'mtk-uts-2425': null, 'mtk-uas-2425': null }, }
    },
    {
        id: "fsk-2425", subjectId: "fisika", subjectName: "Fisika 10",
        academicYear: "2024/2025", // <-- Tahun Ajaran
        studentIds: ["siswa-001", "siswa-004"],
        components: [ { id: 'fsk-prak1-2425', name: 'Praktikum 1', weight: 40 }, { id: 'fsk-uts-2425', name: 'UTS', weight: 60 } ],
        grades: { 'siswa-001': { 'fsk-prak1-2425': 90, 'fsk-uts-2425': null }, 'siswa-004': { 'fsk-prak1-2425': 88, 'fsk-uts-2425': 85 }, }
    },
    {
        id: "mtk-lintas-2526", subjectId: "matematika-lanjut", subjectName: "Matematika Lintas Minat",
        academicYear: "2025/2026", // <-- Tahun Ajaran
        studentIds: ["siswa-003", "siswa-004", "siswa-001", "siswa-005"],
        components: [ { id: 'mtk-proyek-2526', name: 'Proyek', weight: 50 }, { id: 'mtk-final-2526', name: 'Ujian Final', weight: 50 } ],
        grades: { 'siswa-001': { 'mtk-proyek-2526': 95, 'mtk-final-2526': 88 }, 'siswa-003': { 'mtk-proyek-2526': 80, 'mtk-final-2526': null }, 'siswa-004': { 'mtk-proyek-2526': null, 'mtk-final-2526': null }, 'siswa-005': { 'mtk-proyek-2526': 91, 'mtk-final-2526': 90 }, }
    },
];