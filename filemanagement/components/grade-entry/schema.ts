// app/components/grade-entry-schema.ts

// Tipe dasar (bisa impor dari lokasi lain jika ada)
export interface Student { id: string; name: string; }
export interface AssessmentComponent { id: string; name: string; weight: number; }
export type GradesState = Record<string, Record<string, number | null>>;

// Tipe data untuk baris tabel Tanstack
export type GradeTableRowData = {
    id: string; // Student ID
    name: string; // Student Name
    finalScore?: number | null; // Nilai akhir bisa dihitung & dimasukkan di sini
    // Skor komponen akan ditambahkan secara dinamis, contoh:
    // 'uh-1': 85,
} & Record<string, number | null | string>; // Izinkan string untuk nama/id

// Tipe opsi filter (untuk toolbar)
export interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}