// components/approvals/schema.ts

// Definisikan tipe dasar dari Prisma jika belum ada (sesuaikan dengan output Prisma Anda)
// Ini hanya contoh, Anda mungkin sudah memiliki ini dari @prisma/client
export interface User {
  id: string;
  displayname: string | null;
  primaryemail: string | null;
  is_admin?: boolean | null; // Opsional
}

export interface FileRecord { // Merepresentasikan 'file' dari Prisma
  id: string; // GDrive File ID
  workspace_id: string;
  user_id: string; // User yang terkait dengan record file ini di DB kita
  description: string | null;
  filename?: string | null; // Pastikan ini ada di model Prisma Anda jika digunakan
  mimeType?: string | null; // Diambil dari GDrive, mungkin tidak di DB
  iconLink?: string | null; // Diambil dari GDrive, mungkin tidak di DB
  pengesahan_pada?: string | Date | null;
  is_self_file?: boolean | null;
  webViewLink?: string | null;
}

export interface ApprovalFromPrisma { // Merepresentasikan 'approval' dari Prisma
  id: string; // CUID dari proses approval
  file_id_ref: string;
  file_workspace_id_ref: string;
  file_user_id_ref: string;
  approver_user_id: string;
  assigned_by_user_id: string;
  status: string;
  remarks: string | null;
  created_at: string; // atau Date
  updated_at: string; // atau Date
  actioned_at: string | null; // atau Date | null
  approver?: User | null;
  assigner?: User | null;
  file?: FileRecord | null; // Relasi ke file
}
// Akhir definisi tipe dasar Prisma (contoh)


export interface ApprovalFile extends Omit<FileRecord, 'pengesahan_pada' | 'is_self_file' | 'webViewLink' > {
  // id: string; // Sudah ada di FileRecord
  // filename: string | null; // Sudah ada di FileRecord
  // description?: string | null; // Sudah ada di FileRecord
  // workspace_id?: string; // Sudah ada di FileRecord
  // user_id?: string; // Sudah ada di FileRecord
  // mimeType?: string | null; // Sudah ada di FileRecord
  // iconLink?: string | null; // Sudah ada di FileRecord
  pengesahan_pada?: string | Date | null;
  is_self_file?: boolean | null;
  webViewLink?: string | null;
}

export interface ApprovalUser {
  id: string;
  displayname: string | null;
  primaryemail?: string | null;
}

export type IndividualApprovalStatusKey = 'approved' | 'rejected' | 'revised' | 'pending' | 'unknown';
export type OverallApprovalStatusKey = 'Sah' | 'Ditolak' | 'Perlu Revisi' | 'Menunggu Persetujuan' | 'Belum Ada Tindakan';

export interface IndividualApproverAction {
  individualApprovalId: string; // CUID dari approval.id (shared process CUID)
  approverId: string;
  approverName: string | null;
  approverEmail?: string;
  statusKey: IndividualApprovalStatusKey;
  statusDisplay: string;
  actioned_at: string | null; // atau Date
  remarks: string | null;
}

export interface ProcessedApprovalRequest {
  id: string; // ID unik untuk baris di tabel UI (ini adalah file_id_ref)
  // --- MODIFIED SECTION START ---
  sharedApprovalProcessCuid: string; // CUID dari approval.id, untuk identifikasi proses approval di backend
  // --- MODIFIED SECTION END ---
  fileIdRef: string;
  fileWorkspaceIdRef: string;
  fileUserIdRef: string;
  file: ApprovalFile | null;
  assigner: ApprovalUser | null;
  createdAt: string; // atau Date
  approverActions: IndividualApproverAction[];
  overallStatus: OverallApprovalStatusKey;
}

// Re-export tipe Approval dari Prisma jika Anda menamakannya Approval di file page.tsx
export type Approval = ApprovalFromPrisma;