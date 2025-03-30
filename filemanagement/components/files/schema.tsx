import { z } from "zod";

// Definisi schema data yang diperbarui
export const dataSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  nisn: z.string(),
  angkatan: z.string(),
  status: z.string(),
  filename: z.string(),
  description: z.string(),
  foldername: z.string(),
  createdat: z.string(), 
  lastmodified: z.string(), 
});

export type Schema = z.infer<typeof dataSchema>;