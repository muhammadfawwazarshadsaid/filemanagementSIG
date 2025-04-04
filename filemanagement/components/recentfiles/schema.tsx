// Contoh di src/components/recentfiles/schema.ts (PERBAIKAN)
import { z } from "zod";

export const dataSchema = z.object({
  id: z.string(),
  filename: z.string(),
  webViewLink: z.string().nullable().optional(),
  isFolder: z.boolean(),
  mimeType: z.string(),
  description: z.string().nullable().optional(),
  foldername: z.string().nullable().optional(), // Mungkin ini juga bisa null/opsional?
  pathname: z.string(),
  // **** PERBAIKAN DI SINI ****
  createdat: z.string().nullable().optional(),    // Izinkan string, null, atau undefined
  lastmodified: z.string().nullable().optional(), // Izinkan string, null, atau undefined
  // ***************************
  other: z.array(z.object({ key: z.string(), value: z.any() })).optional(),
});


export type Schema = z.infer<typeof dataSchema>;