// app/components/subject-list-toolbar.tsx
'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
// Pastikan tipe SubjectSummary di schema sudah punya academicYear
import { SubjectSummary } from './schema';
import { statusOptions } from './subject-list-columns';
import { DataTableFacetedFilter } from './filters-clear';
import { DataTableViewOptions } from './actions-menu';

// Tipe opsi filter
interface FilterOption { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; }

// Props toolbar
interface SubjectListToolbarProps {
  table: Table<SubjectSummary>;
  uniqueComponentOptions: FilterOption[];
  uniqueAcademicYearOptions: FilterOption[]; // <-- Prop baru ditambahkan
}

export function SubjectListToolbar({
    table,
    uniqueComponentOptions,
    uniqueAcademicYearOptions // <-- Terima prop baru
}: SubjectListToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Dapatkan kolom
  const nameColumn = table.getColumn('name');
  const statusColumn = table.getColumn('status');
  const componentsColumn = table.getColumn('components');
  const academicYearColumn = table.getColumn('academicYear'); // <-- Dapatkan kolom tahun ajaran

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      {/* Filter */}
      <div className="flex flex-1 items-center space-x-2 flex-wrap">
        {/* Filter Nama Mapel */}
        {nameColumn && (
          <Input
            placeholder="Cari mata pelajaran..."
            value={(nameColumn.getFilterValue() as string) ?? ''}
            onChange={(event) => nameColumn.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
            aria-label="Filter mata pelajaran"
          />
        )}

        {/* Filter Tahun Ajaran */}
        {academicYearColumn && uniqueAcademicYearOptions && uniqueAcademicYearOptions.length > 0 && (
            <DataTableFacetedFilter
                column={academicYearColumn}
                title="Thn. Ajaran"
                options={uniqueAcademicYearOptions}
            />
        )}

        {/* Filter Status */}
        {statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn}
            title="Status"
            options={statusOptions}
          />
        )}

         {/* Filter Komponen Mapel */}
         {componentsColumn && uniqueComponentOptions.length > 0 && (
             <DataTableFacetedFilter
                column={componentsColumn}
                title="Komponen"
                options={uniqueComponentOptions}
            />
         )}

        {/* Tombol Reset Filter */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
            aria-label="Reset semua filter"
          >
            Reset Filter <XCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* View Options */}
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}