"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon, DropdownMenuIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/recentfiles/filters-clear";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/recentfiles/actions-menu";
import { TrashIcon, Check, ChevronDown, FilterX, FilterXIcon, LucideFilter, LucideListFilter, LucideFilterX, ChevronUp, Filter } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Toaster } from "../ui/sooner";
import { toast } from "sonner";
import { CalendarDatePicker } from "../calendar-date-picker";
import { DataTableApplyFilter } from "./apply-filter";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@radix-ui/react-accordion";
import { Dropdown } from "react-day-picker";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import React from "react";

interface RowData {
  pathname: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const allRows = table.getCoreRowModel().rows;

  const uniqueFolder = [
    ...new Set(allRows.map((row) => row.original.pathname))
  ].map((pathname) => ({
    value: pathname,
    label: String(pathname),
  }));

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);

    // Munculkan toast setelah submit
    toast("", {
      className:"bg-white",
      description: (
        <div className="flex items-start gap-3">
          {/* Icon di kiri */}
          <div className="w-5 h-5 flex items-center justify-center rounded-md border border-primary bg-primary">
            <Check className="text-background w-4 h-4" />
          </div>
          <div>
            {/* Judul toast */}
            <p className="text-md font-semibold text-black font-sans">Akun Dinonaktifkan!</p>
            {/* Deskripsi toast */}
            {/* <p className="text-sm text-muted-foreground font-sans">
              Akun berhasil dinonaktifkan
            </p> */}
          </div>
        </div>
      ),
    });
  };

  const [dateRangeCreatedAt, setDateRangeCreatedAt] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });
  const [dateRangeLastModified, setDateRangeLastModified] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });

  const handleCreatedAt = ({ from, to }: { from: Date; to: Date }) => {
    setDateRangeCreatedAt({ from, to });
    // Filter table data based on selected date range
    table.getColumn("createdat")?.setFilterValue([from, to]);
  };


  const handleLastModified = ({ from, to }: { from: Date; to: Date }) => {
    setDateRangeLastModified({ from, to });
    // Filter table data based on selected date range
    table.getColumn("lastmodified")?.setFilterValue([from, to]);
  };

  const [isFilter, setIsFilter] = React.useState(false)
  const toggleisFilter = () => {
    setIsFilter(!isFilter)
  }

  return (
    <div className="flex flex-wrap items-start justify-between">
{/* 
      <Input
        placeholder="Cari nama file, deskripsi, folder..."
        value={table.getState().globalFilter ?? ""}
        onChange={(event) => table.setGlobalFilter(event.target.value)}
        className="h-8 w-[250px]"
      /> */}
      <div className={`h-auto rounded-lg items-start justify-start outline} border-black/2`}>
        <Accordion onClick={toggleisFilter} type="single" collapsible>
            <AccordionItem value="item-1">
            <AccordionTrigger>

              {isFilter ? 
                <div className="flex font-medium items-center h-4 gap-2 text-sm outline outline-black/10 h-8 w-auto px-2 rounded-full">
                  <LucideFilter size={14}></LucideFilter> Filter
                </div>
                  :
                <div className="flex font-medium items-center h-4 gap-2 text-sm outline outline-black/10 h-8 w-auto px-2 rounded-full">
                  <LucideFilter size={14}></LucideFilter> Filter
                </div>
              }

          </AccordionTrigger>
            <AccordionContent className="mt-4">
                <DataTableApplyFilter isFilter={isFilter} table={table} isFiltered={isFiltered} uniqueFolder={uniqueFolder} dateRangeLastModified={dateRangeLastModified} dateRangeCreatedAt={dateRangeCreatedAt} handleCreatedAt={handleCreatedAt} handleLastModified={handleLastModified} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
      <Toaster/>

      <div className="flex items-end gap-2">
        {selectedRowsCount > 0 && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 h-8" variant="outline">
                <TrashIcon className="mr-2 size-4" aria-hidden="true" />
                Delete ({selectedRowsCount})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl">
              <DialogHeader>
                <DialogTitle>Hapus Akun?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedRowsCount} akun ini?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="justify-center">
                <div className="flex gap-2 justify-center">
                  
                  <DialogClose asChild>
                    <Button type="button" className="h-10" variant={"outline"}>Batal</Button>
                  </DialogClose>
                  <Button type="button" className="h-10" onClick={handleDeleteConfirm} variant="default">
                    Ya, Hapus
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}