// app/components/approvals/actions.tsx
"use client";

import { Row } from "@tanstack/react-table";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApprovalSchema } from "./schema";
import { EyeOpenIcon, CheckIcon, Cross1Icon } from "@radix-ui/react-icons" // Or Lucide icons
import { toast } from "sonner";

interface DataTableRowActionsProps<TData extends ApprovalSchema> {
  row: Row<TData>;
  viewApprovalDetails?: (approval: TData) => void;
  // approveAction?: (approvalId: string) => Promise<void>; // Example
  // rejectAction?: (approvalId: string, remarks: string) => Promise<void>; // Example
}

export function DataTableRowActions<TData extends ApprovalSchema>({
  row,
  viewApprovalDetails,
}: DataTableRowActionsProps<TData>) {
  const approval = row.original;

  const handleViewDetails = () => {
    if (viewApprovalDetails) {
      viewApprovalDetails(approval);
    } else {
      // Fallback or direct navigation if needed
      console.log("View details for:", approval.id);
      toast.info(`Viewing details for approval ID: ${approval.id}`);
      // Example: router.push(`/approvals/${approval.id}`);
    }
  };

  const handleApprove = async () => {
    console.log("Approve action for:", approval.id);
    toast.success(`Approval ${approval.id} marked as approved (simulated).`);
    // Placeholder for actual API call
    // if (approveAction) await approveAction(approval.id);
  };

  const handleReject = async () => {
    console.log("Reject action for:", approval.id);
    // Potentially open a dialog for remarks
    toast.error(`Approval ${approval.id} marked as rejected (simulated).`);
    // Placeholder for actual API call
    // if (rejectAction) await rejectAction(approval.id, "Some remarks");
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleViewDetails}>
          <EyeOpenIcon className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {approval.status?.toLowerCase() === 'pending' && ( // Only show if pending
            <>
                <DropdownMenuItem onClick={handleApprove} className="text-green-600 focus:text-green-700 focus:bg-green-50">
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReject} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                  <Cross1Icon className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
            </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}