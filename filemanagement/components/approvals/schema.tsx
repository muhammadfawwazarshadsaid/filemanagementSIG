// app/components/approvals/schema.ts
import { PrismaClient, approval as ApprovalModel, user as UserModel, file as FileModel } from '@/lib/generated/prisma/client'; // Assuming this path is correct

// You can extend this with the full ApprovalModel if needed, or pick specific fields
// This is the raw data structure from your API
export interface ApprovalApiResponse extends ApprovalModel {
  approver: Pick<UserModel, 'id' | 'displayname' | 'primaryemail'> | null;
  assigner: Pick<UserModel, 'id' | 'displayname'> | null;
  file: Pick<FileModel, 'id' | 'description' | 'workspace_id' | 'user_id'> | null;
}

// This is the schema for the DataTable row
export interface ApprovalSchema {
  id: string; // approval.id
  fileIdRef: string; // approval.file_id_ref
  fileName: string; // approval.file.description or placeholder
  fileWorkspaceId: string; // approval.file_workspace_id_ref (from API: approval.file_workspace_id_ref)
  
  approverDisplayName: string;
  approverEmail: string;
  approverUserId: string;
  
  assignerDisplayName: string;
  assignerUserId: string;
  
  status: string;
  remarks: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  actionedAt: string | null; // ISO string
  
  // To hold the original data if needed for actions
  originalApproval?: ApprovalApiResponse;
}

// Define a specific TableMeta for approvals if needed, or adapt existing
// For now, we'll assume it's similar to MyTableMeta in your datatable.tsx
// and can be passed or adapted.
export interface ApprovalTableMeta<TData> {
  viewApprovalDetails?: (approval: TData) => void;
  // Add other approval-specific actions or context if necessary
  [key: string]: any; // Allow other properties from MyTableMeta
}