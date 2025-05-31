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
  iconLink: z.string().optional().nullable(),
  // 👇 TAMBAHKAN FIELD BERIKUT 👇
  pengesahan_pada: z.string().datetime({ message: "Format tanggal pengesahan tidak valid" }).nullable().optional(),
  is_self_file: z.boolean().nullable().optional(),
  webViewLink: z.string().url({ message: "Format URL webViewLink tidak valid" }).nullable().optional(), // Link untuk membuka file di GDrive viewer
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
  id: z.string(),
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
  file: approvalFileSchema.nullable(), // Tipe ini sekarang akan mencakup field baru
  gdrive_fetch_error: z.string().nullable().optional(),
});
export type Approval = z.infer<typeof approvalSchema>;


// --- TIPE BARU UNTUK DATA YANG DIPROSES DI FRONTEND ---

export type IndividualApprovalStatusKey = 'approved' | 'rejected' | 'revised' | 'pending' | 'unknown';
export type OverallApprovalStatusKey = 'Sah' | 'Perlu Revisi' | 'Ditolak' | 'Menunggu Persetujuan' | 'Belum Ada Tindakan';

export interface IndividualApproverAction {
  individualApprovalId: string;
  approverId: string;
  approverName: string | null;
  approverEmail?: string | null;
  statusKey: IndividualApprovalStatusKey;
  statusDisplay: string;
  actioned_at: string | null;
  remarks: string | null;
}

export interface ProcessedApprovalRequest {
  id: string;
  fileIdRef: string;
  fileWorkspaceIdRef: string;
  fileUserIdRef: string;
  file: ApprovalFile | null; // Pastikan ini menggunakan ApprovalFile yang sudah diupdate
  assigner: ApprovalUser | null;
  overallStatus: OverallApprovalStatusKey;
  approverActions: IndividualApproverAction[];
  createdAt: string;
}