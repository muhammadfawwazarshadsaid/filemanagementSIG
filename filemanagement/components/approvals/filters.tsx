// app/components/approvals/toolbar.tsx
"use client";

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "@/components/approvals/actions-menu"; // Reusing
import { DataTableFacetedFilter } from "@/components/approvals/filters-clear"; // Reusing
import { Cross2Icon, TrashIcon } from "@radix-ui/react-icons"; // Or Lucide icons
import { ApprovalSchema } from "./schema";

interface DataTableToolbarProps<TData extends ApprovalSchema> {
  table: Table<TData>;
  // Add props for filter setters if they are managed in the parent page component
  // For example: setStatusFilter: (value: string | undefined) => void;
}

export function ApprovalsToolbar<TData extends ApprovalSchema>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const statusOptions = [ // Example, can be dynamic
    { label: "Pending", value: "PENDING" }, // Match your API's status values
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  // Example for bulk delete - requires API and logic
  const handleDeleteSelected = () => {
    const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
    alert(`Simulating delete for ${selectedRowCount} selected approvals.`);
    // Actual implementation would call an API
    table.resetRowSelection();
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search by file name or remarks..."
          value={(table.getColumn("fileName")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            // This is a simple global filter example, you might want more specific filtering
            table.setGlobalFilter(event.target.value);
          }}
          className="h-8 w-[250px] lg:w-[350px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statusOptions}
          />
        )}
        {/* Add more filters for approver, assigner etc. as needed */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-red-600 hover:text-red-700"
            onClick={handleDeleteSelected}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete ({table.getFilteredSelectedRowModel().rows.length})
          </Button>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}