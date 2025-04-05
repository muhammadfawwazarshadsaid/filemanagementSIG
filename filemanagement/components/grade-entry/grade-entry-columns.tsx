// app/components/grade-entry-columns.tsx
'use client';

import { ColumnDef, CellContext, SortingFn } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Save, XCircle, Loader2, Check, Ban } from "lucide-react";
import { cn } from "@/lib/utils"; // Sesuaikan path
import { GradeTableRowData, GradesState, AssessmentComponent } from "./schema";
import { DataTableColumnHeader } from "./sort";

// Komponen Cell Nilai
const GradeCell = ({ getValue, row, column, table }: CellContext<GradeTableRowData, unknown>) => {
    const meta = table.options.meta as {
        editingRowId: string | null;
        isEditingAll: boolean;
        grades: GradesState;
        handleGradeChange: (studentId: string, componentId: string, value: string) => void;
        isSavingRow: string | null;
        isSavingAll: boolean;
    };
    const isEditable = meta.isEditingAll || meta.editingRowId === row.original.id;
    const studentId = row.original.id; const componentId = column.id;
    const currentValue = meta.grades?.[studentId]?.[componentId];
    const displayValue = currentValue === null || currentValue === undefined ? '' : currentValue.toString();

    return (
        <div className="text-center min-w-[70px]">
            {isEditable ? (
                <Input
                    type="number" step="any" min="0" max="100" placeholder="0-100"
                    value={displayValue}
                    onChange={(e) => meta.handleGradeChange(studentId, componentId, e.target.value)}
                    className="max-w-[70px] mx-auto text-center h-8 text-sm p-1"
                    disabled={meta.isSavingRow === studentId || meta.isSavingAll}
                    aria-label={`Nilai ${column.id} untuk ${row.original.name}`}
                />
            ) : (
                <span className="text-sm px-2">{displayValue === '' ? '-' : displayValue}</span>
            )}
        </div>
    );
};

// Fungsi Generate Kolom
export const generateGradeColumns = (
    assessmentComponents: AssessmentComponent[],
    grades: GradesState, // Terima state grades untuk sorting
    onEditHeader: (component: AssessmentComponent) => void,
    onDeleteComponent: (componentId: string, componentName: string) => void,
    isAnyValueEditing: boolean, // true jika isEditingAll atau ada editingRowId
    editingHeaderId: string | null,
    editingHeaderValues: { name: string; weight: string },
    handleHeaderEditChange: (field: 'name' | 'weight', value: string) => void,
    saveHeaderEdit: () => Promise<void>,
    cancelHeaderEdit: () => void,
    isHeaderEditingLoading: boolean
): ColumnDef<GradeTableRowData>[] => {

    // Fungsi sorting kustom untuk kolom komponen
    const componentColumnSortingFn: SortingFn<GradeTableRowData> = (rowA, rowB, columnId) => {
        const gradeA = grades[rowA.original.id]?.[columnId]; const gradeB = grades[rowB.original.id]?.[columnId];
        const valA = gradeA === null || gradeA === undefined ? -1 : Number(gradeA); // Treat null as -1 for sorting
        const valB = gradeB === null || gradeB === undefined ? -1 : Number(gradeB);
        return valA - valB;
    };

    const columns: ColumnDef<GradeTableRowData>[] = [
        { id: 'select', header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Pilih semua baris" disabled={isAnyValueEditing}/> ), cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Pilih baris" disabled={isAnyValueEditing}/> ), enableSorting: false, enableHiding: false, size: 40 },
        { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />, cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>, enableSorting: true, size: 180, enableColumnFilter: true },
        ...assessmentComponents.map<ColumnDef<GradeTableRowData>>(component => ({
            accessorKey: component.id,
            header: () => {
                 const isEditingThisHeader = editingHeaderId === component.id;
                return isEditingThisHeader ? (
                     <div className='space-y-1 py-1'> <Input value={editingHeaderValues.name} onChange={(e) => handleHeaderEditChange('name', e.target.value)} className="h-7 text-xs" placeholder='Nama' disabled={isHeaderEditingLoading}/> <div className='flex items-center justify-center gap-1'> <span className="text-xs">Bobot:</span> <Input type="number" min="0.01" step="any" value={editingHeaderValues.weight} onChange={(e) => handleHeaderEditChange('weight', e.target.value)} className="h-6 w-14 text-right text-xs" placeholder='%' disabled={isHeaderEditingLoading}/> <span className="text-xs">%</span> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={saveHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Simpan Header"><Save className="h-3 w-3" /></Button> <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Batal Edit Header"><XCircle className="h-3 w-3" /></Button> </div> </div>
                 ) : (
                     <div className="flex flex-col items-center space-y-1"> <div className="flex items-center justify-center gap-1 flex-wrap"> <span className='font-semibold'>{component.name}</span> <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onEditHeader(component)} aria-label={`Edit ${component.name}`} disabled={isAnyValueEditing}><Pencil className="h-3 w-3" /></Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => onDeleteComponent(component.id, component.name)} aria-label={`Hapus ${component.name}`} disabled={isAnyValueEditing}><Trash2 className="h-3 w-3" /></Button> </div> <span className="block text-xs text-muted-foreground font-normal">(Bobot: {component.weight}%)</span> </div>
                 );
            },
            cell: GradeCell,
            enableSorting: true, // Aktifkan sorting per komponen
            sortingFn: componentColumnSortingFn, // Gunakan fungsi sorting kustom
            size: 110,
        })),
        // Nilai Akhir (dihitung di `tableData` agar bisa disort/filter)
        {
            accessorKey: 'finalScore', // Akses data yg sudah dihitung
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Akhir" />,
            cell: ({ row }) => { const finalScore = row.getValue('finalScore') as number | null | undefined; const displayScore = (finalScore === null || finalScore === undefined || isNaN(finalScore)) ? '-' : finalScore.toFixed(1); return <div className="text-center font-bold">{displayScore}</div>; },
            enableSorting: true,
            size: 100,
            // filterFn: finalGradeRangeFilter // Aktifkan jika filter nilai akhir dibuat
        },
        // Kolom Aksi Baris
        {
            id: 'actions', header: () => <div className="text-center">Aksi</div>,
            cell: ({ row, table }) => {
                const meta = table.options.meta as { editingRowId: string | null; isSavingRow: string | null; handleEditRowTrigger: (rowId: string) => void; handleCancelRow: (rowId: string) => void; handleSaveRow: (rowId: string) => Promise<void>; isEditingAll: boolean; };
                const isEditingThisRow = meta.editingRowId === row.original.id; const isSavingThisRow = meta.isSavingRow === row.original.id;
                return ( <div className="text-center"> {isEditingThisRow ? ( <div className='flex justify-center gap-0'> <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => meta.handleSaveRow(row.original.id)} disabled={isSavingThisRow} aria-label="Simpan"><Check className="h-4 w-4" /></Button> <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => meta.handleCancelRow(row.original.id)} disabled={isSavingThisRow} aria-label="Batal"><Ban className="h-4 w-4" /></Button> </div> ) : ( <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary" disabled={meta.isEditingAll || !!meta.editingRowId || row.getIsSelected()} onClick={() => meta.handleEditRowTrigger(row.original.id)} aria-label={`Edit`}><Pencil className="h-4 w-4" /></Button> )} </div> );
            },
            size: 80,
        },
    ];
    return columns;
};