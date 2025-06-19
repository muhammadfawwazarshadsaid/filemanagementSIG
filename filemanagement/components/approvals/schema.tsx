// components/approvals/schema.ts
// (Pastikan semua tipe seperti IndividualApprovalStatusKey dan OverallApprovalStatusKey diekspor dengan benar)

export interface User {
  id: string;
  displayname: string | null;
  primaryemail: string | null;
  is_admin?: boolean | null;
}

export interface FileRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  description: string | null;
  filename?: string | null;
  mimeType?: string | null;
  iconLink?: string | null;
  webViewLink?: string | null;
  pengesahan_pada?: string | Date | null;
  is_self_file?: boolean | null;
}

export interface ApprovalFromPrisma {
  id: string;
  file_id_ref: string;
  file_workspace_id_ref: string;
  file_user_id_ref: string;
  approver_user_id: string;
  assigned_by_user_id: string;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  actioned_at: string | null;
  approver?: User | null;
  assigner?: User | null;
  file?: FileRecord | null;
}

export interface ApprovalFile extends FileRecord {}

export interface ApprovalUser extends User {}

export type IndividualApprovalStatusKey = 'approved' | 'rejected' | 'revised' | 'pending' | 'unknown'; // Pastikan ini diekspor
export type OverallApprovalStatusKey = 'Sah' | 'Ditolak' | 'Perlu Revisi' | 'Menunggu Persetujuan' | 'Belum Ada Tindakan'; // Pastikan ini diekspor

export interface IndividualApproverAction {
  individualApprovalId: string;
  approverId: string;
  approverName: string | null;
  approverEmail?: string;
  statusKey: IndividualApprovalStatusKey; // Menggunakan tipe yang didefinisikan
  statusDisplay: string;
  actioned_at: string | null;
  remarks: string | null;
}

export interface ProcessedApprovalRequest {
  id: string;
  sharedApprovalProcessCuid: string;
  fileIdRef: string;
  fileWorkspaceIdRef: string;
  fileUserIdRef: string;
  file: ApprovalFile | null;
  assigner: ApprovalUser | null;
  createdAt: string;
  approverActions: IndividualApproverAction[];
  overallStatus: OverallApprovalStatusKey; // Menggunakan tipe yang didefinisikan
}

export type Approval = ApprovalFromPrisma;

export interface WorkspaceFolder {
  id: string;
  name: string;
}

export interface SelectableUser extends User {
  selected?: boolean;
}

export interface ExistingFileInWorkspace {
    id: string;
    filename: string;
    mimeType?: string | null;
    iconLink?: string | null;
    description?: string | null;
    pathname?: string;
    webViewLink?: string | null; // Tambahkan jika perlu untuk preview
}

