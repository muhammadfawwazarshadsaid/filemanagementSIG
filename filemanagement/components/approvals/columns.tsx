// app/components/approvals/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/approvals/sort"; // Reusing
import { DataTableRowActions } from "./actions"; // Approval-specific actions
import { ApprovalSchema, ApprovalTableMeta } from "./schema";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper function to format dates (can be moved to a utils file)
function formatDateDisplay(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return format(parseISO(dateString), "dd MMM yyyy, HH:mm", { locale: localeID });
  } catch (e) {
    return "Invalid date";
  }
}

// Helper for user display with fallback
const UserDisplay = ({ displayName, email }: { displayName?: string | null, email?: string | null }) => {
  const name = displayName || email || "N/A";
  const fallback = (displayName?.charAt(0) || email?.charAt(0) || "U").toUpperCase();
  return (
    <div className="flex items-center space-x-2">
      <Avatar className="h-6 w-6 text-xs">
        {/* <AvatarImage src={undefined} /> Placeholder for actual image */}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <span className="truncate text-xs" title={name}>{name}</span>
    </div>
  );
};

export const columns: ColumnDef<ApprovalSchema>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "fileName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="File" />
    ),
    cell: ({ row }) => (
      <div className="truncate w-[200px] text-xs" title={row.original.fileName}>
        {row.original.fileName || row.original.fileIdRef}
      </div>
    ),
    size: 220,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      if (status?.toLowerCase() === "approved") variant = "default"; // Greenish in some themes
      if (status?.toLowerCase() === "rejected") variant = "destructive";
      if (status?.toLowerCase() === "pending") variant = "outline";
      return <Badge variant={variant} className="text-xs">{status}</Badge>;
    },
    size: 100,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    }
  },
  {
    accessorKey: "approverDisplayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Approver" />
    ),
    cell: ({ row }) => (
      <UserDisplay 
        displayName={row.original.approverDisplayName} 
        email={row.original.approverEmail} 
      />
    ),
    size: 150,
  },
  {
    accessorKey: "assignerDisplayName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned By" />
    ),
    cell: ({ row }) => (
       <UserDisplay 
        displayName={row.original.assignerDisplayName} 
        email={undefined} // Assigner from API only has displayname
      />
    ),
    size: 150,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created On" />
    ),
    cell: ({ row }) => <div className="text-xs w-[130px]">{formatDateDisplay(row.original.createdAt)}</div>,
    sortingFn: 'datetime',
    size: 150,
  },
  {
    accessorKey: "actionedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Actioned On" />
    ),
    cell: ({ row }) => <div className="text-xs w-[130px]">{formatDateDisplay(row.original.actionedAt)}</div>,
    sortingFn: 'datetime',
    size: 150,
  },
   {
    accessorKey: "remarks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remarks" />
    ),
    cell: ({ row }) => (
      <div className="truncate w-[150px] text-xs" title={row.original.remarks || "-"}>
        {row.original.remarks || "-"}
      </div>
    ),
    size: 170,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      // Ensure meta is correctly typed or assert type if necessary
      const meta = table.options.meta as ApprovalTableMeta<ApprovalSchema> | undefined;
      return (
        <DataTableRowActions
          row={row}
          // Pass any necessary props from meta or table for actions
          // e.g., functions to handle approve/reject, view details
          viewApprovalDetails={meta?.viewApprovalDetails}
        />
      );
    },
    size: 80,
  },
];