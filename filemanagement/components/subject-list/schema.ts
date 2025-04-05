// app/components/schema.ts
import { z } from 'zod';

// Interface ComponentSummary (tetap sama)
export interface ComponentSummary {
    id: string;
    name: string;
    weight?: number; // Bobot dibuat optional di interface agar cocok dgn Zod di bawah? Atau sebaliknya?
}

// Skema Zod ComponentSummary (weight dibuat optional agar cocok dgn interface?)
// Sesuaikan ini mana yg benar-benar sumber kebenaran (Source of Truth)
export const componentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().optional(), // <-- Dibuat optional agar cocok dgn interface?
});


// ---- TAMBAHKAN academicYear DI SINI ----
export interface SubjectSummary {
    id: string; // ID unik (misal komposit: MTK01-10A-2024-2025)
    kodeMataPelajaran: string; // ID mapel asli
    name: string;
    // className: string; // Dihapus sebelumnya
    academicYear: string; // <-- Tambahkan properti ini
    totalWeight: number;
    componentCount: number;
    status: 'Terisi Penuh' | 'Dalam Proses' | 'Belum Dimulai';
    components: ComponentSummary[]; // Asumsi API mengirimkan ini juga, jika tidak, buat opsional '?'
}
// ---- END PENAMBAHAN ----


// ---- TAMBAHKAN academicYear DI SKEMA ZOD JUGA ----
 export const subjectSummarySchema = z.object({
   id: z.string(),
   kodeMataPelajaran: z.string(), // <-- Tambahkan jika API mengirim ini
   name: z.string(),
   // className: z.string().optional(), // Dihapus sebelumnya
   academicYear: z.string(), // <-- Tambahkan properti ini
   totalWeight: z.number(),
   componentCount: z.number(),
   status: z.enum(['Terisi Penuh', 'Dalam Proses', 'Belum Dimulai']),
   components: z.array(componentSummarySchema), // Pastikan API mengirim ini jika tidak optional
 });
 // ---- END PENAMBAHAN ----


// ---- Definisi Tipe untuk Grade Entry (Pastikan sudah benar) ----
export interface Student { id: string; name: string; }
export interface AssessmentComponent { id: string; name: string; weight: number; }
export type GradesState = Record<string, Record<string, number | null>>;
export interface GradeTableRowData { id: string; name: string; finalScore?: number | null; [key: string]: any; }
export const gradeTableRowSchema = z.object({ id: z.string(), name: z.string(), finalScore: z.number().nullable().optional() }).passthrough();
// ---- End Definisi Grade Entry ----