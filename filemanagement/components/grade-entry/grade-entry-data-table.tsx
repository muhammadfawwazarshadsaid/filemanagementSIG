// app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel, // Model untuk sorting
    useReactTable,
    Table as TanstackTable,
    Row,
    CellContext,
    HeaderContext,
    FilterFn,
    SortingFn, // <-- Impor SortingFn
    getFacetedRowModel,
    getFacetedUniqueValues
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Trash2, Pencil, Save, XCircle, Loader2, Check, Ban, Edit } from 'lucide-react';
import { GradeDataTableToolbar } from './grade-entry-table-toolbar'; // Pastikan path benar
import { DataTablePagination } from './pagination'; // Pastikan path benar
import { Student, AssessmentComponent, GradesState, GradeTableRowData } from './schema'; // Pastikan path dan tipe benar
import { DataTableColumnHeader } from './sort'; // Pastikan path benar dan komponennya support title node

// Tipe Opsi Filter
interface FilterOption { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; }


// Fungsi Filter untuk Rentang Nilai Akhir
const finalGradeRangeFilter: FilterFn<GradeTableRowData> = (
    row: Row<GradeTableRowData>,
    columnId: string,
    filterValue: string[]
): boolean => {
    const grade = row.getValue(columnId) as number | null | undefined;
    if (!filterValue || filterValue.length === 0) return true;
    if (grade === null || grade === undefined || isNaN(grade)) return false;
    return filterValue.some(value => {
        if (value === '<50') return grade < 50; // Disesuaikan dengan opsi toolbar
        if (value === '51-75') return grade >= 51 && grade <= 75; // Disesuaikan dengan opsi toolbar
        if (value === '>75') return grade > 75; // Disesuaikan dengan opsi toolbar
        return false;
    });
};
// Komponen Cell Nilai
const GradeCell = ({ getValue, row, column, table }: CellContext<GradeTableRowData, unknown>) => {
     const meta = table.options.meta as { editingRowId: string | null; isEditingAll: boolean; grades: GradesState; handleGradeChange: (studentId: string, componentId: string, value: string) => void; isSavingRow: string | null; isSavingAll: boolean; };
     const isEditable = meta.isEditingAll || meta.editingRowId === row.original.id; const studentId = row.original.id; const componentId = column.id; const currentValue = meta.grades?.[studentId]?.[componentId]; const displayValue = currentValue === null || currentValue === undefined ? '' : currentValue.toString();
     return ( <div className="text-center min-w-[70px]"> {isEditable ? ( <Input type="number" step="any" min="0" max="100" placeholder="0-100" value={displayValue} onChange={(e) => meta.handleGradeChange(studentId, componentId, e.target.value)} className="max-w-[70px] mx-auto text-center h-8 text-sm p-1" disabled={meta.isSavingRow === studentId || meta.isSavingAll} aria-label={`Nilai ${column.id} untuk ${row.original.name}`} /> ) : ( <span className="text-sm px-2">{displayValue === '' ? '-' : displayValue}</span> )} </div> );
};

// Fungsi Generate Kolom (dengan sorting komponen yang diperbaiki)
const generateGradeColumns = (
    assessmentComponents: AssessmentComponent[],
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

    // Fungsi sorting kustom dengan tipe dan signature yang benar
    const componentColumnSortingFn: SortingFn<GradeTableRowData> = (
        rowA: Row<GradeTableRowData>,
        rowB: Row<GradeTableRowData>,
        columnId: string
    ): number => {
        const gradeA = grades[rowA.original.id]?.[columnId]; const gradeB = grades[rowB.original.id]?.[columnId];
        const valA = gradeA === null || gradeA === undefined ? -1 : Number(gradeA); const valB = gradeB === null || gradeB === undefined ? -1 : Number(gradeB);
        return valA - valB;
    };

    const columns: ColumnDef<GradeTableRowData>[] = [
        // Checkbox
        { id: 'select', header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Pilih semua baris" disabled={isAnyValueEditing}/> ), cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Pilih baris" disabled={isAnyValueEditing}/> ), enableSorting: false, enableHiding: false, size: 40 },
        // Nama Siswa
        { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />, cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>, enableSorting: true, size: 180, enableColumnFilter: true },
        // Kolom Komponen Dinamis (Header Disederhanakan)
        ...assessmentComponents.map<ColumnDef<GradeTableRowData>>(component => ({
            accessorKey: component.id,
            // ---- Header diubah agar title HANYA string (nama komponen) ----
            header: ({ column }) => (
                 <div className="flex flex-col items-center"> {/* Bungkus agar bisa tambah bobot */}
                     <DataTableColumnHeader
                        column={column}
                        // ---- Berikan HANYA NAMA (string) ke title ----
                        title={component.name} // <-- Hanya string nama komponen
                     />
                     {/* Tampilkan bobot di bawah tombol sort (tidak bisa diklik untuk sort) */}
                     <span className="block text-xs text-muted-foreground font-normal mt-1">
                         (Bobot: {component.weight}%)
                     </span>
                     {/* Jika perlu tombol edit/delete header, letakkan di sini */}
                 </div>
            ),
            // ---- End Perubahan Header ----
            cell: GradeCell,
            enableSorting: true,
            sortingFn: componentColumnSortingFn,
            size: 110,
        })),
        // Nilai Akhir
        {
             accessorKey: 'finalScore',
             header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Akhir" />, // Pakai Header Sort
             cell: ({ row }) => { const finalScore = row.getValue('finalScore') as number | null | undefined; const displayScore = (finalScore === null || finalScore === undefined || isNaN(finalScore)) ? '-' : finalScore.toFixed(1); return <div className="text-center font-bold">{displayScore}</div>; },
             enableSorting: true, size: 100,
             filterFn: finalGradeRangeFilter
         },
        // Kolom Aksi Baris
        { id: 'actions', header: () => <div className="text-center">Aksi</div>, cell: ({ row, table }) => { const meta = table.options.meta as { editingRowId: string | null; isSavingRow: string | null; handleEditRowTrigger: (rowId: string) => void; handleCancelRow: (rowId: string) => void; handleSaveRow: (rowId: string) => Promise<void>; isEditingAll: boolean; }; const isEditingThisRow = meta.editingRowId === row.original.id; const isSavingThisRow = meta.isSavingRow === row.original.id; return ( <div className="text-center"> {isEditingThisRow ? ( <div className='flex justify-center gap-0'> <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => meta.handleSaveRow(row.original.id)} disabled={isSavingThisRow} aria-label="Simpan nilai baris"><Check className="h-4 w-4" /></Button> <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => meta.handleCancelRow(row.original.id)} disabled={isSavingThisRow} aria-label="Batal edit baris"><Ban className="h-4 w-4" /></Button> </div> ) : ( <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary" disabled={meta.isEditingAll || !!meta.editingRowId || row.getIsSelected()} onClick={() => meta.handleEditRowTrigger(row.original.id)} aria-label={`Edit nilai baris ${row.original.name}`}><Pencil className="h-4 w-4" /></Button> )} </div> ); }, size: 80 },
    ];
    return columns;
};


// Props Komponen Utama
interface GradeEntryDataTableProps {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    initialGrades: GradesState;
    subjectId: string; // atau kodeMataPelajaran
    subjectName?: string;
    // className?: string;
    // academicYear?: string;
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    onDeleteComponent: (componentId: string, componentName: string) => void;
    onUpdateComponent: (updatedComponent: AssessmentComponent) => Promise<void>;
    // updateInitialGrades?: (updatedGrades: GradesState) => void;
}

// Komponen Utama DataTable
export function GradeEntryDataTable({
    students,
    assessmentComponents,
    initialGrades,
    subjectId,
    subjectName,
    // className,
    // academicYear,
    onSaveSingleGrade,
    onDeleteComponent,
    onUpdateComponent,
    // updateInitialGrades
}: GradeEntryDataTableProps) {

    // 1. State Declarations
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [isSavingRow, setIsSavingRow] = React.useState<string | null>(null);
    const [isEditingAll, setIsEditingAll] = React.useState(false);
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editingHeaderId, setEditingHeaderId] = React.useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = React.useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = React.useState(false);

    // 2. Effect
    React.useEffect(() => {
        setGrades(initialGrades || {}); // Fallback jika initialGrades bisa undefined
        setEditingRowId(null); setRowSelection({}); setIsEditingAll(false); setEditingHeaderId(null);
    }, [initialGrades, students, assessmentComponents]);

    // 3. Data Calculation
    const tableData = React.useMemo<GradeTableRowData[]>(() => {
        return students.map(student => {
            const studentGrades = grades[student.id] || {};
            let calculatedFinalScore: number | null = null; let scoreTimesWeightSum = 0; let hasValidComponentScore = false;
            assessmentComponents.forEach(comp => { const score = studentGrades[comp.id]; if (score !== null && score !== undefined && !isNaN(Number(score)) && comp.weight > 0) { scoreTimesWeightSum += (Number(score) * comp.weight); hasValidComponentScore = true; } });
            if (hasValidComponentScore) { calculatedFinalScore = scoreTimesWeightSum / 100; }
            return { id: student.id, name: student.name, finalScore: calculatedFinalScore };
        });
    }, [students, assessmentComponents, grades]);

    // 4. Handlers
    const handleGradeChange = React.useCallback((studentId: string, componentId: string, value: string) => { const numVal = value === '' ? null : Number(value); const clampedVal = numVal === null ? null : Math.max(0, Math.min(100, numVal)); setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: clampedVal } })); }, []);
    const handleCancelRow = React.useCallback((rowId: string) => { setGrades(prev => { const originalRowGrades = initialGrades[rowId] || {}; const updatedStudentGrades = { ...(prev[rowId] || {}) }; assessmentComponents.forEach(c => { updatedStudentGrades[c.id] = originalRowGrades[c.id] ?? null; }); return { ...prev, [rowId]: updatedStudentGrades }; }); setEditingRowId(null); }, [initialGrades, assessmentComponents]);
    const handleEditRowTrigger = React.useCallback((rowId: string) => { if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); } setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId); }, [editingRowId, handleCancelRow]);
    const handleSaveRow = React.useCallback(async (rowId: string) => { setIsSavingRow(rowId); const promises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const student = students.find(s => s.id === rowId); if (!student) { setIsSavingRow(null); return; } const studentCurrentGrades = grades[rowId] || {}; const studentInitialGrades = initialGrades[rowId] || {}; assessmentComponents.forEach(c => { const componentId = c.id; const currentGrade = studentCurrentGrades[componentId]; const initialGrade = studentInitialGrades[componentId]; const hasChanged = JSON.stringify(currentGrade ?? null) !== JSON.stringify(initialGrade ?? null); if (hasChanged) { if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) { toast.error(`Nilai ${c.name} (${student.name}) invalid.`); validationError = true; } else { changesCount++; promises.push(onSaveSingleGrade(rowId, componentId, currentGrade)); } } }); if (validationError) { setIsSavingRow(null); return; } if (changesCount === 0) { toast.info(`Tak ada perubahan ${student.name}.`); setIsSavingRow(null); setEditingRowId(null); return; } try { await Promise.all(promises); toast.success(`Nilai ${student.name} disimpan.`); /* TODO: Update initialGrades */ setEditingRowId(null); } catch (error) { toast.error(`Gagal simpan ${student.name}: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingRow(null); } }, [students, assessmentComponents, grades, initialGrades, onSaveSingleGrade]);
    const handleEditAllTrigger = React.useCallback(() => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); }, []);
    const handleCancelAllEdit = React.useCallback(() => { setGrades(initialGrades); setIsEditingAll(false); setEditingRowId(null); toast.info("Perubahan dibatalkan."); }, [initialGrades]);
    const handleSaveAllChanges = React.useCallback(async () => { setIsSavingAll(true); const savePromises: Promise<void>[] = []; const changedGradesPayload: GradesState = {}; let changesCount = 0; let validationError = false; for (const student of students) { const studentId = student.id; const studentCurrentGrades = grades[studentId] || {}; const studentInitialGrades = initialGrades[studentId] || {}; changedGradesPayload[studentId] = {}; for (const component of assessmentComponents) { const compId = component.id; const current = studentCurrentGrades[compId]; const initial = studentInitialGrades[compId]; const hasChanged = JSON.stringify(current ?? null) !== JSON.stringify(initial ?? null); if (hasChanged) { if (current !== null && (isNaN(current) || current < 0 || current > 100)) { toast.error(`Nilai ${component.name} (${student.name}) invalid.`); validationError = true; break; } changesCount++; savePromises.push(onSaveSingleGrade(studentId, compId, current)); changedGradesPayload[studentId][compId] = current; } else { if(initial !== undefined) changedGradesPayload[studentId][compId] = initial; } } if (validationError) break; } if (validationError) { setIsSavingAll(false); return; } if (changesCount === 0) { toast.info("Tak ada perubahan."); setIsSavingAll(false); setIsEditingAll(false); return; } try { await Promise.all(savePromises); toast.success(`${changesCount} perubahan disimpan.`); /* TODO: Update initialGrades */ setIsEditingAll(false); } catch (error) { toast.error(`Gagal simpan: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingAll(false); } }, [students, assessmentComponents, grades, initialGrades, onSaveSingleGrade]);
    const startHeaderEdit = React.useCallback((component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const cancelHeaderEdit = React.useCallback(() => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = React.useCallback((field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = React.useCallback(async () => { if (!editingHeaderId) return; const componentToUpdate = assessmentComponents.find(c => c.id === editingHeaderId); if (!componentToUpdate) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib."); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot > 0."); return; } if (name.trim() === componentToUpdate.name && weightValue === componentToUpdate.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { await onUpdateComponent({ id: editingHeaderId, name: name.trim(), weight: weightValue }); toast.success(`Komponen "${name.trim()}" diupdate.`); cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); } }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);

    // 5. Column Definition
    const columns = React.useMemo(
        () => generateGradeColumns( assessmentComponents, grades, startHeaderEdit, onDeleteComponent, !!editingRowId || isEditingAll, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading ),
        [assessmentComponents, grades, startHeaderEdit, onDeleteComponent, editingRowId, isEditingAll, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading] // grades ditambahkan
    );

    // 6. Table Declaration
    const table = useReactTable({
        data: tableData,
        columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting, // Handler sorting
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(), // Aktifkan model sorting
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        meta: { // Handler/state yang dibutuhkan oleh Cell/Header/RowActions
            editingRowId, isSavingRow, grades, handleGradeChange, handleEditRowTrigger, handleCancelRow, handleSaveRow, isEditingAll, isSavingAll
        }
    });

    // 7. Handlers yang butuh instance 'table'
    const handleResetSelected = React.useCallback((selectedRows: Row<GradeTableRowData>[]) => {
        if (selectedRows.length === 0) { toast.info("Pilih siswa."); return; }
        setGrades(prevGrades => { const newGrades = { ...prevGrades }; selectedRows.forEach(row => { const studentId = row.original.id; const originalStudentGrades = initialGrades[studentId] || {}; newGrades[studentId] = {}; assessmentComponents.forEach(c => { newGrades[studentId][c.id] = originalStudentGrades[c.id] ?? null; }); }); return newGrades; });
        table.toggleAllRowsSelected(false);
        setEditingRowId(null);
        toast.info(`${selectedRows.length} siswa direset.`);
    }, [initialGrades, assessmentComponents, table]);

    // 8. Kalkulasi lain untuk UI
    const uniqueComponentOptions = React.useMemo<FilterOption[]>(() => {
        return assessmentComponents.map(comp => ({ label: comp.name, value: comp.id }));
    }, [assessmentComponents]);

    // 9. Return JSX
    return (
        <div className="space-y-4">
            {/* Menampilkan nama mapel jika ada */}
            {subjectName && (
                 <div className="mb-2">
                     <h2 className="text-xl font-semibold">{subjectName}</h2>
                     {/* Anda bisa tambahkan className dan academicYear di sini jika prop-nya ada */}
                     {/* <p className="text-sm text-muted-foreground">Kelas: {className} | Tahun Ajaran: {academicYear}</p> */}
                 </div>
            )}

            <GradeDataTableToolbar
                table={table}
                uniqueComponentOptions={uniqueComponentOptions}
                onResetSelected={handleResetSelected}
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
                                    <TableHead key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }} className={cn(
                                        'px-2 py-2 text-sm h-auto whitespace-nowrap',
                                        (header.id === 'select' || header.id === 'name' || header.id === 'actions' || header.id === 'finalScore') && 'sticky z-10',
                                        header.id === 'select' && 'left-0',
                                        header.id === 'name' && 'left-[40px]',
                                        header.id === 'actions' && 'right-0 text-center',
                                        header.id === 'finalScore' && 'right-[80px] text-center',
                                        (header.id === 'select' || header.id === 'name' || header.id === 'actions' || header.id === 'finalScore') && 'bg-muted/90'
                                    )}>
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
                                        <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined }} className={cn(
                                            'px-2 py-1 h-11 align-middle',
                                            (cell.column.id === 'select' || cell.column.id === 'name' || cell.column.id === 'actions' || cell.column.id === 'finalScore') && 'sticky z-10',
                                            cell.column.id === 'select' && 'left-0',
                                            cell.column.id === 'name' && 'left-[40px]',
                                            cell.column.id === 'actions' && 'right-0',
                                            cell.column.id === 'finalScore' && 'right-[80px] font-bold text-center',
                                            (cell.column.id === 'select' || cell.column.id === 'name' || cell.column.id === 'actions' || cell.column.id === 'finalScore') && (editingRowId === row.original.id ? 'bg-secondary/60' : 'bg-card')
                                        )}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Tidak ada data siswa.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} />
        </div>
    );
}