"use client";

import { Cross2Icon, ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "@/components/recentfiles/filters-clear";
import { useState } from "react";
import { DataTableViewOptions } from "@/components/recentfiles/actions-menu";
import { TrashIcon, Check } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Toaster } from "../ui/sooner";
import { toast } from "sonner";
import { CalendarDatePicker } from "../calendar-date-picker";

interface RowData {
  foldername: string;
}

interface DataTableToolbarProps {
  table: Table<RowData>;
}

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const allRows = table.getCoreRowModel().rows;

  const uniqueFolder = [
    ...new Set(allRows.map((row) => row.original.foldername))
  ].map((foldername) => ({
    value: foldername,
    label: String(foldername),
  }));

  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);

    // Munculkan toast setelah submit
    toast("", {
      description: (
        <div className="flex items-start gap-3">
          {/* Icon di kiri */}
          <div className="w-7 h-7 flex items-center justify-center rounded-md border border-primary bg-primary">
            <Check className="text-background w-4 h-4" />
          </div>
          <div>
            {/* Judul toast */}
            <p className="text-lg font-semibold text-foreground font-sans">Akun Dinonaktifkan!</p>
            {/* Deskripsi toast */}
            <p className="text-sm text-muted-foreground font-sans">
              Akun berhasil dinonaktifkan
            </p>
          </div>
        </div>
      ),
      action: {
        label: (
          <span className="font-sans px-3 py-1 text-sm font-medium border rounded-md border-border text-foreground">
            Tutup
          </span>
        ),
        onClick: () => console.log("Tutup"),
      },
    });
  };

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  });

  const handleCreatedAt = ({ from, to }: { from: Date; to: Date }) => {
    setDateRange({ from, to });
    // Filter table data based on selected date range
    table.getColumn("createdat")?.setFilterValue([from, to]);
  };


  const handleLastModified = ({ from, to }: { from: Date; to: Date }) => {
    setDateRange({ from, to });
    // Filter table data based on selected date range
    table.getColumn("lastmodified")?.setFilterValue([from, to]);
  };

  return (
    <div className="flex flex-wrap items-end justify-between">
      <Toaster />
      <div className="flex flex-1 flex-wrap items-end gap-2">
        <Input
          placeholder="Cari nama file, deskripsi, folder..."
          value={table.getState().globalFilter ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <div>
          <p className="text-xs">Dibuat pada:</p>
          <CalendarDatePicker
            date={dateRange}
            onDateSelect={handleCreatedAt}
            className="w-[250px] h-8"
            variant="outline"
          />
        </div>
        <div>
          <p className="text-xs">Diperbarui terakhir:</p>
          <CalendarDatePicker
            date={dateRange}
            onDateSelect={handleLastModified}
            className="w-[250px] h-8"
            variant="outline"
          />
        </div>
        <div>
          <p className="text-xs">Dari folder:</p>
          {table.getColumn("foldername") && (
            <DataTableFacetedFilter
              column={table.getColumn("foldername")}
              title="Folder"
              options={uniqueFolder}
            />
          )}
        </div>
        


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

      <div className="flex items-center gap-2">
        {selectedRowsCount > 0 && (
          <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrashIcon className="mr-2 size-4" aria-hidden="true" />
                Delete ({selectedRowsCount})
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Hapus Akun?</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus {selectedRowsCount} akun ini?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-end">
                <div className="flex gap-4">
                  
                  <DialogClose asChild>
                    <Button type="button" variant={"outline"}>Batal</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleDeleteConfirm} variant="default">
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