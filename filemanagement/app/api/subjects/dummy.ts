// app/lib/dummy-data.ts

// --- Tipe Data --- (Definisikan di sini atau impor dari schema)
export interface AssessmentComponent { id: string; name: string; weight: number; }
export interface Student { id: string; name: string; }
export type GradesState = Record<string, Record<string, number | null>>;
export interface SubjectData {
    name: string;
    components: AssessmentComponent[];
    grades: GradesState;
}
export interface TaughtClass {
    id: string; subjectId: string; subjectName: string; academicYear: string;
    studentIds: string[]; components: AssessmentComponent[]; grades: GradesState;
}
// --- Akhir Tipe Data ---


// --- Daftar Semua Siswa ---
export let allStudentsDb: Student[] = [
    { id: 'siswa-001', name: 'Ahmad Budi' },
    { id: 'siswa-002', name: 'Citra Lestari' },
    { id: 'siswa-003', name: 'Dedi Prasetyo' },
    { id: 'siswa-004', name: 'Eka Putri' },
];

// --- Data Kelas yang Diajar (In-Memory) ---
export let taughtClassesDb: TaughtClass[] = [
    {
        id: "mtk-2425", subjectId: "matematika", subjectName: "Matematika",
        academicYear: "2024/2025", studentIds: ["siswa-001", "siswa-002"],
        components: [ { id: 'mtk-uh1-2425', name: 'UH 1', weight: 25 }, { id: 'mtk-uts-2425', name: 'UTS', weight: 35 }, { id: 'mtk-uas-2425', name: 'UAS', weight: 40 } ],
        grades: { 'siswa-001': { 'mtk-uh1-2425': 85, 'mtk-uts-2425': 78 }, 'siswa-002': { 'mtk-uh1-2425': 90, 'mtk-uts-2425': 88, 'mtk-uas-2425': 92 } }
    },
    {
        id: "fsk-2425", subjectId: "fisika", subjectName: "Fisika",
        academicYear: "2024/2025", studentIds: ["siswa-001"],
        components: [ { id: 'fsk-prak1-2425', name: 'Praktikum 1', weight: 40 }, { id: 'fsk-uts-2425', name: 'UTS', weight: 60 } ],
        grades: { 'siswa-001': { 'fsk-prak1-2425': 90 } }
    },
    {
        id: "mtk-2526", subjectId: "matematika", subjectName: "Matematika Lanjut",
        academicYear: "2025/2026", studentIds: ["siswa-003", "siswa-004", "siswa-001"],
        components: [ { id: 'mtk-proyek-2526', name: 'Proyek', weight: 50 }, { id: 'mtk-final-2526', name: 'Ujian Final', weight: 50 } ],
        grades: { 'siswa-003': { 'mtk-proyek-2526': 80 }, 'siswa-001': { 'mtk-proyek-2526': 95, 'mtk-final-2526': 88 } }
    },
];