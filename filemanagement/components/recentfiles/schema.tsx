// src/components/recentfiles/schema.ts
import { z } from "zod";

// Skema data untuk setiap baris di tabel file/folder
export const dataSchema = z.object({
  // --- Properti Inti ---
  id: z.string().min(1, { message: "ID tidak boleh kosong" }), // ID unik dari Google Drive atau sistem Anda
  filename: z.string().min(1, { message: "Nama file tidak boleh kosong" }), // Nama file atau folder
  isFolder: z.boolean(), // Menandakan apakah item ini folder atau bukan
  mimeType: z.string(), // MIME type file (e.g., "application/pdf", "image/jpeg", "application/vnd.google-apps.folder")

  // --- Properti Opsional/Tambahan ---
  pathname: z.string().optional().nullable(), // Path lengkap folder tempat file berada (jika relevan)
  foldername: z.string().nullable().optional(), // Mungkin ini juga bisa null/opsional?
  description: z.string().optional().nullable(), // Deskripsi file
  webViewLink: z.string().url().optional().nullable(), // Link untuk membuka file di web (misal: Google Drive)
  iconLink: z.string().url().optional().nullable(), // Link ke ikon file (jika disediakan API)

  // --- Properti Waktu (pastikan format string bisa diparsing oleh new Date()) ---
  createdat: z.string().datetime({ message: "Format tanggal dibuat tidak valid" }).optional().nullable(), // Waktu pembuatan (ISO string)
  lastmodified: z.string().datetime({ message: "Format tanggal diubah tidak valid" }).optional().nullable(), // Waktu modifikasi terakhir (ISO string)

  // --- Properti Kepemilikan/Tambahan (jika perlu) ---
  // owner: z.string().optional().nullable(),
  // size: z.number().optional().nullable(), // Ukuran file dalam bytes

  // Anda bisa menambahkan properti lain sesuai data dari API Anda
  // other: z.array(z.object({ key: z.string(), value: z.any() })).optional(),
});

// Ekspor tipe TypeScript yang dihasilkan dari skema Zod
export type Schema = z.infer<typeof dataSchema>;