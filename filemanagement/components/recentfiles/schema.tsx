// src/components/recentfiles/schema.ts
import { z } from "zod";

// Skema data untuk setiap baris di tabel file/folder
export const dataSchema = z.object({
  // --- Properti Inti ---
  id: z.string().min(1, { message: "ID tidak boleh kosong" }),
  filename: z.string().min(1, { message: "Nama file tidak boleh kosong" }),
  isFolder: z.boolean(),
  mimeType: z.string(),

  // --- Properti Opsional/Tambahan ---
  pathname: z.string().optional().nullable(),
  foldername: z.string().nullable().optional(),
  description: z.string().optional().nullable(),
  webViewLink: z.string().url().optional().nullable(),
  iconLink: z.string().url().optional().nullable(),

  // --- Properti Waktu ---
  createdat: z.string().datetime({ message: "Format tanggal dibuat tidak valid" }).optional().nullable(),
  lastmodified: z.string().datetime({ message: "Format tanggal diubah tidak valid" }).optional().nullable(),
  pengesahan_pada: z.string().datetime({ message: "Format tanggal pengesahan tidak valid" }).optional().nullable(), // <-- Tambahkan ini

  // --- Properti Kepemilikan/Tambahan (jika perlu) ---
  // owner: z.string().optional().nullable(),
  // size: z.number().optional().nullable(),
});

// Ekspor tipe TypeScript yang dihasilkan dari skema Zod
export type Schema = z.infer<typeof dataSchema>;