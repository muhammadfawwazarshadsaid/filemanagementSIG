// app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    useReactTable, Table as TanstackTable, Row, CellContext, HeaderContext, SortingFn // Impor SortingFn
} from '@tanstack/react-table';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Pastikan path ini benar
import { Trash2, Pencil, Save, XCircle, Loader2, Check, Ban, Edit } from 'lucide-react';
import { GradeDataTableToolbar } from './grade-entry-table-toolbar';
import { DataTablePagination } from './pagination';
import { Student, AssessmentComponent, GradesState, GradeTableRowData } from './schema';
import { DataTableColumnHeader } from './sort';

// Asumsikan komponen ini ada dan diimpor dari path yang benar
// --- Props Komponen Utama ---
// !! PASTIKAN INTERFACE INI ADA SEBELUM FUNGSI KOMPONEN !!
interface GradeEntryDataTableProps {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    initialGrades: GradesState;
    subjectId: string;
    subjectName?: string; // Tambahkan subjectName opsional
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    onDeleteComponent: (componentId: string, componentName: string) => void;
    onUpdateComponent: (updatedComponent: AssessmentComponent) => Promise<void>;
}

// --- Komponen Cell Nilai ---
// Definisikan di luar atau di dalam, pastikan tipenya benar
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
    const studentId = row.original.id;
    const componentId = column.id;
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


// --- Fungsi Generate Kolom ---
// Definisikan di luar atau di dalam, pastikan tipenya benar
const generateGradeColumns = (
    assessmentComponents: AssessmentComponent[] | undefined | null, // Terima tipe nullish
    grades: GradesState, // Terima state grades
    onEditHeader: (component: AssessmentComponent) => void,
    onDeleteComponent: (componentId: string, componentName: string) => void,
    isAnyValueEditing: boolean,
    editingHeaderId: string | null,
    editingHeaderValues: { name: string; weight: string },
    handleHeaderEditChange: (field: 'name' | 'weight', value: string) => void,
    saveHeaderEdit: () => Promise<void>,
    cancelHeaderEdit: () => void,
    isHeaderEditingLoading: boolean
): ColumnDef<GradeTableRowData>[] => {

    // Gunakan default array kosong jika assessmentComponents nullish
    const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];

    // Fungsi sorting kustom
    const componentColumnSortingFn: SortingFn<GradeTableRowData> = (rowA, rowB, columnId) => {
        const gradeA = grades[rowA.original.id]?.[columnId]; const gradeB = grades[rowB.original.id]?.[columnId];
        const valA = gradeA === null || gradeA === undefined ? -1 : Number(gradeA);
        const valB = gradeB === null || gradeB === undefined ? -1 : Number(gradeB);
        return valA - valB;
    };

    const columns: ColumnDef<GradeTableRowData>[] = [
        // Checkbox
        { id: 'select', header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Pilih semua baris" disabled={isAnyValueEditing}/> ), cell: ({ row, table }) => { const meta = table.options.meta as { editingRowId: string | null; isEditingAll: boolean; }; return ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Pilih baris" disabled={meta.isEditingAll || !!meta.editingRowId}/> ); }, enableSorting: false, enableHiding: false, size: 40 },
        // Nama Siswa
        { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />, cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>, enableSorting: true, size: 180, enableColumnFilter: true },
        // Kolom Komponen Dinamis
        ...currentComponents.map<ColumnDef<GradeTableRowData>>((component: AssessmentComponent) => ({ // <-- Tipe eksplisit
            accessorKey: component.id,
            header: () => { const isEditingThisHeader = editingHeaderId === component.id; return isEditingThisHeader ? (<div className='space-y-1 py-1'> <Input value={editingHeaderValues.name} onChange={(e) => handleHeaderEditChange('name', e.target.value)} className="h-7 text-xs" placeholder='Nama' disabled={isHeaderEditingLoading}/> <div className='flex items-center justify-center gap-1'> <span className="text-xs">Bobot:</span> <Input type="number" min="0.01" step="any" value={editingHeaderValues.weight} onChange={(e) => handleHeaderEditChange('weight', e.target.value)} className="h-6 w-14 text-right text-xs" placeholder='%' disabled={isHeaderEditingLoading}/> <span className="text-xs">%</span> <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={saveHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Simpan Header"><Save className="h-3 w-3" /></Button> <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Batal Edit Header"><XCircle className="h-3 w-3" /></Button> </div> </div>) : (<div className="flex flex-col items-center space-y-1"> <div className="flex items-center justify-center gap-1 flex-wrap"> <span className='font-semibold'>{component.name}</span> <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onEditHeader(component)} aria-label={`Edit ${component.name}`} disabled={isAnyValueEditing}><Pencil className="h-3 w-3" /></Button> <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => onDeleteComponent(component.id, component.name)} aria-label={`Hapus ${component.name}`} disabled={isAnyValueEditing}><Trash2 className="h-3 w-3" /></Button> </div> <span className="block text-xs text-muted-foreground font-normal">(Bobot: {component.weight}%)</span> </div>); },
            cell: GradeCell, enableSorting: true, sortingFn: componentColumnSortingFn, size: 110,
        })),
        // Nilai Akhir
        { accessorKey: 'finalScore', header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Akhir" />, cell: ({ row }) => { const finalScore = row.getValue('finalScore') as number | null | undefined; const displayScore = (finalScore === null || finalScore === undefined || isNaN(finalScore)) ? '-' : finalScore.toFixed(1); return <div className="text-center font-bold">{displayScore}</div>; }, enableSorting: true, size: 100 },
        // Kolom Aksi Baris
        { id: 'actions', header: () => <div className="text-center">Aksi</div>, cell: ({ row, table }) => { const meta = table.options.meta as { editingRowId: string | null; isSavingRow: string | null; handleEditRowTrigger: (rowId: string) => void; handleCancelRow: (rowId: string) => void; handleSaveRow: (rowId: string) => Promise<void>; isEditingAll: boolean; }; const isEditingThisRow = meta.editingRowId === row.original.id; const isSavingThisRow = meta.isSavingRow === row.original.id; return ( <div className="text-center"> {isEditingThisRow ? ( <div className='flex justify-center gap-0'> <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => meta.handleSaveRow(row.original.id)} disabled={isSavingThisRow} aria-label="Simpan"><Check className="h-4 w-4" /></Button> <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => meta.handleCancelRow(row.original.id)} disabled={isSavingThisRow} aria-label="Batal"><Ban className="h-4 w-4" /></Button> </div> ) : ( <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary" disabled={meta.isEditingAll || !!meta.editingRowId || row.getIsSelected()} onClick={() => meta.handleEditRowTrigger(row.original.id)} aria-label={`Edit`}><Pencil className="h-4 w-4" /></Button> )} </div> ); }, size: 80 },
    ];
    return columns;
};


// --- Komponen Utama DataTable ---
// !! PASTIKAN NAMA INTERFACE SESUAI SAAT DIGUNAKAN !!
export function GradeEntryDataTable({
    students,
    assessmentComponents = [], // Default jika prop undefined
    initialGrades = {},      // Default jika prop undefined
    subjectId,
    subjectName,
    onSaveSingleGrade,
    onDeleteComponent,
    onUpdateComponent,
}: GradeEntryDataTableProps) { // <-- Penggunaan Interface

    // --- State ---
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [isSavingRow, setIsSavingRow] = React.useState<string | null>(null);
    const [isEditingAll, setIsEditingAll] = React.useState(false);
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({}); // Type fix
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editingHeaderId, setEditingHeaderId] = React.useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = React.useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = React.useState(false);

    // Sinkronisasi initialGrades
    React.useEffect(() => {
        setGrades(initialGrades || {}); setEditingRowId(null); setRowSelection({}); setIsEditingAll(false); setEditingHeaderId(null);
    }, [initialGrades, students, assessmentComponents]);

    // Kalkulasi Nilai Akhir & Persiapan Data Tabel
    const tableData = React.useMemo<GradeTableRowData[]>(() => {
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        // !! FIX: Tambah tipe ': Student' !!
        return students.map((student: Student) => {
            const studentGrades = grades[student.id] || {};
            let calculatedFinalScore: number | null = null; let scoreTimesWeightSum = 0; let weightSum = 0;
             // !! FIX: Tambah tipe ': AssessmentComponent' !!
            currentComponents.forEach((comp: AssessmentComponent) => { const score = studentGrades[comp.id]; if (score !== null && score !== undefined && !isNaN(Number(score)) && comp.weight > 0) { scoreTimesWeightSum += (Number(score) * comp.weight); weightSum += comp.weight; } });
            if (weightSum > 0) { calculatedFinalScore = scoreTimesWeightSum / 100; }
            const componentScores: Record<string, number | null> = {};
            // !! FIX: Tambah tipe ': AssessmentComponent' !!
            currentComponents.forEach((comp: AssessmentComponent) => { componentScores[comp.id] = studentGrades[comp.id] ?? null; });
            return { id: student.id, name: student.name, ...componentScores, finalScore: calculatedFinalScore };
        });
    }, [students, assessmentComponents, grades]);

    // Handler update state nilai dari cell
    const handleGradeChange = React.useCallback((studentId: string, componentId: string, value: string) => { const numVal = value === '' ? null : Number(value); const clampedVal = numVal === null ? null : Math.max(0, Math.min(100, numVal)); setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: clampedVal } })); }, []);

    // Handlers Edit/Save/Cancel Per Baris
    const handleCancelRow = React.useCallback((rowId: string) => { const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; setGrades(prev => { const originalRowGrades = initialGrades[rowId] || {}; const updatedStudentGrades = { ...(prev[rowId] || {}) }; /* !! FIX: Tambah tipe 'c' !! */ currentComponents.forEach((c: AssessmentComponent) => { updatedStudentGrades[c.id] = originalRowGrades[c.id] ?? null; }); return { ...prev, [rowId]: updatedStudentGrades }; }); setEditingRowId(null); }, [initialGrades, assessmentComponents]);
    const handleEditRowTrigger = React.useCallback((rowId: string) => { if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); } setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId); }, [editingRowId, handleCancelRow]);
    const handleSaveRow = React.useCallback(async (rowId: string) => { setIsSavingRow(rowId); const promises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const student = students.find(s => s.id === rowId); if (!student) { setIsSavingRow(null); return; } const studentCurrentGrades = grades[rowId] || {}; const studentInitialGrades = initialGrades[rowId] || {}; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; /* !! FIX: Tambah tipe 'c' !! */ currentComponents.forEach((c: AssessmentComponent) => { const componentId = c.id; const currentGrade = studentCurrentGrades[componentId]; const initialGrade = studentInitialGrades[componentId]; const hasChanged = JSON.stringify(currentGrade ?? null) !== JSON.stringify(initialGrade ?? null); if (hasChanged) { if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) { toast.error(`Nilai ${c.name} (${student.name}) invalid.`); validationError = true; } else { changesCount++; promises.push(onSaveSingleGrade(rowId, componentId, currentGrade)); } } }); if (validationError) { setIsSavingRow(null); return; } if (changesCount === 0) { toast.info(`Tidak ada perubahan ${student.name}.`); setIsSavingRow(null); setEditingRowId(null); return; } try { await Promise.all(promises); toast.success(`Nilai ${student.name} disimpan.`); setEditingRowId(null); /* TODO: update initialGrades */ } catch (error) { toast.error(`Gagal simpan ${student.name}: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingRow(null); } }, [students, assessmentComponents, grades, initialGrades, onSaveSingleGrade]);

    // Handlers Edit/Save/Cancel/Reset Terpilih & Semua (Toolbar)
    const handleEditAllTrigger = React.useCallback(() => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); }, []);
    const handleCancelAllEdit = React.useCallback(() => { setGrades(initialGrades); setIsEditingAll(false); setEditingRowId(null); toast.info("Perubahan dibatalkan."); }, [initialGrades]);
    const handleSaveAllChanges = React.useCallback(async () => { setIsSavingAll(true); const savePromises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; /* !! FIX: Tambah tipe 'student' !! */ for (const student of students) { const studentId = student.id; const studentCurrentGrades = grades[studentId] || {}; const studentInitialGrades = initialGrades[studentId] || {}; /* !! FIX: Tambah tipe 'component' !! */ for (const component of currentComponents) { const compId = component.id; const current = studentCurrentGrades[compId]; const initial = studentInitialGrades[compId]; const hasChanged = JSON.stringify(current ?? null) !== JSON.stringify(initial ?? null); if (hasChanged) { if (current !== null && (isNaN(current) || current < 0 || current > 100)) { toast.error(`Nilai ${component.name} (${student.name}) invalid.`); validationError = true; break; } changesCount++; savePromises.push(onSaveSingleGrade(studentId, compId, current)); } } if (validationError) break; } if (validationError) { setIsSavingAll(false); return; } if (changesCount === 0) { toast.info("Tak ada perubahan."); setIsSavingAll(false); setIsEditingAll(false); return; } try { await Promise.all(savePromises); toast.success(`${changesCount} perubahan disimpan.`); setIsEditingAll(false); /* TODO: Update initialGrades */ } catch (error) { toast.error(`Gagal simpan: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingAll(false); } }, [students, assessmentComponents, grades, initialGrades, onSaveSingleGrade]);
    const handleResetSelected = React.useCallback((selectedRows: Row<GradeTableRowData>[]) => { if (selectedRows.length === 0) { toast.info("Pilih siswa."); return; } const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; setGrades(prevGrades => { const newGrades = { ...prevGrades }; selectedRows.forEach(row => { const studentId = row.original.id; const originalStudentGrades = initialGrades[studentId] || {}; newGrades[studentId] = {}; /* !! FIX: Tambah tipe 'c' !! */ currentComponents.forEach((c: AssessmentComponent) => { newGrades[studentId][c.id] = originalStudentGrades[c.id] ?? null; }); }); return newGrades; }); table.toggleAllRowsSelected(false); setEditingRowId(null); toast.info(`${selectedRows.length} siswa direset.`); }, [initialGrades, assessmentComponents]); // table dihapus dari dependency

    // Handlers Edit Header Komponen
    const startHeaderEdit = React.useCallback((component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const cancelHeaderEdit = React.useCallback(() => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = React.useCallback((field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = React.useCallback(async () => { if (!editingHeaderId) return; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; const comp = currentComponents.find(c => c.id === editingHeaderId); if (!comp) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib"); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot > 0."); return; } if (name.trim() === comp.name && weightValue === comp.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { await onUpdateComponent({ id: editingHeaderId, name: name.trim(), weight: weightValue }); /* Notif ditangani parent? */ cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update header: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); } }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);

    // Definisi Kolom
    const columns = React.useMemo( () => generateGradeColumns( assessmentComponents, grades, startHeaderEdit, onDeleteComponent, !!editingRowId || isEditingAll, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading ), [assessmentComponents, grades, startHeaderEdit, onDeleteComponent, editingRowId, isEditingAll, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading] );

    // Inisialisasi Tanstack Table
    const table = useReactTable({
        data: tableData, columns, state: { sorting, columnVisibility, rowSelection, columnFilters }, enableRowSelection: true, onRowSelectionChange: setRowSelection, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
        meta: { editingRowId, isSavingRow, grades, handleGradeChange, handleEditRowTrigger, handleCancelRow, handleSaveRow, isEditingAll, isSavingAll }
    });

    return (
        <div className="space-y-4">
            {subjectName && <h2 className="text-xl font-semibold">{subjectName}</h2>}
            <GradeDataTableToolbar
                table={table}
                onResetSelected={() => handleResetSelected(table.getSelectedRowModel().rows)}
                isEditingAll={isEditingAll}
                isSavingAll={isSavingAll}
                onEditAll={handleEditAllTrigger}
                onSaveAll={handleSaveAllChanges}
                onCancelAll={handleCancelAllEdit}
                isRowEditing={!!editingRowId}
            />
            <div className="overflow-x-auto relative border rounded-md">
                <Table>
                     <TableHeader className="sticky top-0 bg-muted/80 z-20 backdrop-blur-sm">
                         {table.getHeaderGroups().map(headerGroup => (
                             <TableRow key={headerGroup.id}>
                                 {headerGroup.headers.map(header => (
                                     <TableHead key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }} className={cn('px-2 py-2 text-sm h-auto whitespace-nowrap', (header.id === 'select' || header.id === 'name' || header.id === 'actions' || header.id === 'finalScore') && 'sticky z-10', header.id === 'select' && 'left-0', header.id === 'name' && 'left-[40px]', header.id === 'actions' && 'right-0 text-center', header.id === 'finalScore' && 'right-[80px] text-center', (header.id === 'select' || header.id === 'name' || header.id === 'actions' || header.id === 'finalScore') && 'bg-muted/90')}>
                                         {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                     </TableHead>
                                 ))}
                             </TableRow>
                         ))}
                     </TableHeader>
                     <TableBody>
                         {table.getRowModel().rows?.length ? (
                             table.getRowModel().rows.map(row => (
                                 <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={cn("hover:bg-muted/50", editingRowId === row.original.id && 'bg-secondary/60 hover:bg-secondary/70')}>
                                     {row.getVisibleCells().map(cell => (
                                         <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }} className={cn('px-2 py-1 h-11 align-middle', (cell.column.id === 'select' || cell.column.id === 'name' || cell.column.id === 'actions' || cell.column.id === 'finalScore') && 'sticky z-10', cell.column.id === 'select' && 'left-0', cell.column.id === 'name' && 'left-[40px]', cell.column.id === 'actions' && 'right-0', cell.column.id === 'finalScore' && 'right-[80px] font-bold text-center', (cell.column.id === 'select' || cell.column.id === 'name' || cell.column.id === 'actions' || cell.column.id === 'finalScore') && (editingRowId === row.original.id ? 'bg-secondary/60' : 'bg-card'))}>
                                             {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                         </TableCell>
                                     ))}
                                 </TableRow>
                             ))
                         ) : ( <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Tidak ada data siswa.</TableCell></TableRow> )}
                     </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}