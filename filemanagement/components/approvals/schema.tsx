// File: components/approvals/schema.ts
import { z } from "zod";

// Skema untuk file yang terkait dengan approval
export const approvalFileSchema = z.object({
  id: z.string().nullable(),
  filename: z.string().nullable(),
  description: z.string().nullable().optional(),
  workspace_id: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  mimeType: z.string().optional().nullable(),
  iconLink: z.string().optional().nullable(), // Ditambahkan agar konsisten
});
export type ApprovalFile = z.infer<typeof approvalFileSchema>;

// Skema untuk pengguna (approver/assigner)
export const approvalUserSchema = z.object({
  id: z.string(),
  displayname: z.string().nullable(),
  primaryemail: z.string().nullable().optional(),
});
export type ApprovalUser = z.infer<typeof approvalUserSchema>;

// Skema utama untuk data approval dari API
export const approvalSchema = z.object({
  id: z.string(), // ID unik untuk setiap baris approval (misalnya: cuid dari tabel approval)
  file_id_ref: z.string(),
  file_workspace_id_ref: z.string(),
  file_user_id_ref: z.string(),
  approver_user_id: z.string(),
  assigned_by_user_id: z.string(),
  status: z.string(),
  remarks: z.string().nullable().optional(),
  created_at: z.string().datetime({ message: "Format tanggal dibuat tidak valid" }),
  updated_at: z.string().datetime({ message: "Format tanggal diubah tidak valid" }),
  actioned_at: z.string().datetime({ message: "Format tanggal aksi tidak valid" }).nullable().optional(),
  approver: approvalUserSchema,
  assigner: approvalUserSchema,
  file: approvalFileSchema.nullable(),
  gdrive_fetch_error: z.string().nullable().optional(),
});
export type Approval = z.infer<typeof approvalSchema>;


// --- TIPE BARU UNTUK DATA YANG DIPROSES DI FRONTEND ---

export type IndividualApprovalStatusKey = 'approved' | 'rejected' | 'revised' | 'pending' | 'unknown';
export type OverallApprovalStatusKey = 'Sah' | 'Perlu Revisi' | 'Ditolak' | 'Menunggu Persetujuan' | 'Belum Ada Tindakan';

export interface IndividualApproverAction {
  individualApprovalId: string; // ID unik dari tabel 'approval' untuk kombinasi file-approver ini
  approverId: string;
  approverName: string | null;
  approverEmail?: string | null;
  statusKey: IndividualApprovalStatusKey;
  statusDisplay: string;
  actioned_at: string | null;
  remarks: string | null;
}

export interface ProcessedApprovalRequest {
  id: string; // Kunci unik untuk baris tabel (file_id_ref)
  fileIdRef: string;
  fileWorkspaceIdRef: string; // Ditambahkan
  fileUserIdRef: string;    // Ditambahkan
  file: ApprovalFile | null;
  assigner: ApprovalUser | null;
  overallStatus: OverallApprovalStatusKey;
  approverActions: IndividualApproverAction[];
  createdAt: string;
}