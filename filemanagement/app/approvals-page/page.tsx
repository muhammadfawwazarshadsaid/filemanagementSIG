// app/approvals/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { columns } from "@/components/approvals/columns";
import { ApprovalsDataTable } from "@/components/approvals/datatable";
import { ApprovalSchema, ApprovalApiResponse, ApprovalTableMeta } from "@/components/approvals/schema";
import { toast } from "sonner"; // Assuming you use sonner for toasts
import { useSearchParams, useRouter, usePathname } from 'next/navigation';


// Helper to transform API data to Schema
function transformApprovalData(apiData: ApprovalApiResponse[]): ApprovalSchema[] {
  return apiData.map((item) => ({
    id: item.id,
    fileIdRef: item.file_id_ref,
    fileName: item.file?.description || item.file?.id || "N/A",
    fileWorkspaceId: item.file_workspace_id_ref, // This is directly on approval model
    approverDisplayName: item.approver?.displayname || "N/A",
    approverEmail: item.approver?.primaryemail || "N/A",
    approverUserId: item.approver_user_id,
    assignerDisplayName: item.assigner?.displayname || "N/A",
    assignerUserId: item.assigned_by_user_id,
    status: item.status,
    remarks: item.remarks || "",
    createdAt: item.created_at.toString(), // Ensure it's string
    updatedAt: item.updated_at.toString(), // Ensure it's string
    actionedAt: item.actioned_at ? item.actioned_at.toString() : null,
    originalApproval: item,
  }));
}

export default function ApprovalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [approvals, setApprovals] = useState<ApprovalSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get('limit')) || 10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state examples (you'll need to implement UI for these in toolbar)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(searchParams.get('status') || undefined);
  const [workspaceIdFilter, setWorkspaceIdFilter] = useState<string | undefined>(searchParams.get('workspaceId') || undefined); // Example if you have a workspace context

  const fetchApprovals = useCallback(async (page: number, limit: number, status?: string, workspaceId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) queryParams.append('status', status);
      if (workspaceId) queryParams.append('workspaceId', workspaceId);
      // Add other filters: approverUserId, assignedByUserId, fileIdRef as needed

      const response = await fetch(`/api/approvals/getall?${queryParams.toString()}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch approvals: ${response.statusText}`);
      }
      const result = await response.json();
      setApprovals(transformApprovalData(result.data as ApprovalApiResponse[]));
      setTotalItems(result.pagination.totalItems);
      setCurrentPage(result.pagination.currentPage); // Ensure local state matches API response
      setItemsPerPage(result.pagination.itemsPerPage);

      // Update URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('page', page.toString());
      newParams.set('limit', limit.toString());
      if (status) newParams.set('status', status); else newParams.delete('status');
      if (workspaceId) newParams.set('workspaceId', workspaceId); else newParams.delete('workspaceId');
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });

    } catch (err: any) {
      setError(err.message);
      toast.error("Could not load approvals", { description: err.message });
      setApprovals([]); // Clear data on error
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, router, pathname]);

  useEffect(() => {
    fetchApprovals(currentPage, itemsPerPage, statusFilter, workspaceIdFilter);
  }, [fetchApprovals, currentPage, itemsPerPage, statusFilter, workspaceIdFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const handleLimitChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  };

  // Meta object for table actions
  const tableMeta: ApprovalTableMeta<ApprovalSchema> = {
    viewApprovalDetails: (approval) => {
      console.log("View details for approval:", approval);
      // Example: open a modal or navigate to a detail page
      toast.info(`Viewing details for ${approval.fileName}`);
      // router.push(`/approvals/details/${approval.id}`);
    },
    // You can add other functions to meta if needed by your actions column
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Approvals</h1>
      {/* Add UI for setting filters (statusFilter, workspaceIdFilter) here, potentially in the Toolbar */}
      <ApprovalsDataTable
        columns={columns}
        data={approvals}
        meta={tableMeta}
        isLoading={isLoading}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
      {error && <p className="text-red-500 mt-4">Error: {error}</p>}
    </div>
  );
}