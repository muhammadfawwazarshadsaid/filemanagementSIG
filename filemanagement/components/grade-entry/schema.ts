// app/components/grade-entry-schema.ts
import React from 'react';

// Tipe dasar
export interface Student {
    id: string;
    name: string;
    class: string; // <-- Kelas ditambahkan
}
export interface AssessmentComponent { id: string; name: string; weight: number; }
export type GradesState = Record<string, Record<string, number | null>>;

// Tipe data untuk baris tabel Tanstack
export type GradeTableRowData = {
    id: string; // Student ID
    name: string; // Student Name
    class: string; // <-- Kelas ditambahkan
    finalScore?: number | null; // Nilai akhir
} & Record<string, number | null | string>; // Skor komponen dinamis

// Tipe opsi filter
export interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}