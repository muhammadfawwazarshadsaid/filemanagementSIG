// app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    useReactTable, Table as TanstackTable, Row,
} from '@tanstack/react-table';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GradeDataTableToolbar } from './grade-entry-table-toolbar';
import { DataTablePagination } from './pagination';
import { Student, AssessmentComponent, GradesState, GradeTableRowData, FilterOption } from './schema';
import { generateGradeColumns } from './grade-entry-columns';

// Props Komponen Utama (Tidak berubah)
interface GradeEntryDataTableProps {
    students: Student[]; // Prop students
    assessmentComponents: AssessmentComponent[];
    initialGrades: GradesState;
    subjectId: string;
    subjectName?: string;
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    onDeleteComponent?: (componentId: string, componentName: string) => void;
    onUpdateComponent?: (updatedComponent: AssessmentComponent) => Promise<void>;
}

// Komponen Utama DataTable
export function GradeEntryDataTable({
    students, // Terima prop students
    assessmentComponents = [],
    initialGrades = {},
    subjectId,
    subjectName,
    onSaveSingleGrade,
    onDeleteComponent = () => { console.warn("onDeleteComponent not provided"); },
    onUpdateComponent = async () => { console.warn("onUpdateComponent not provided"); },
}: GradeEntryDataTableProps) {

    // State Internal Komponen (Tidak berubah)
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [isSavingRow, setIsSavingRow] = React.useState<string | null>(null);
    const [isEditingAll, setIsEditingAll] = React.useState(false);
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
        const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
        'class': false, // <-- Sembunyikan kolom 'class' secara default
        // Anda bisa menambahkan kolom lain di sini jika ingin disembunyikan juga
        // 'finalScore': false, // Contoh jika ingin sembunyikan nilai akhir juga
    });
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editingHeaderId, setEditingHeaderId] = React.useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = React.useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = React.useState(false);

    // Efek untuk Sinkronisasi (Tidak berubah)
    React.useEffect(() => { setGrades(initialGrades || {}); setEditingRowId(null); setRowSelection({}); setIsEditingAll(false); setEditingHeaderId(null); }, [initialGrades, students, assessmentComponents]);

    // Kalkulasi Data Tabel (Tidak berubah, sudah sertakan kelas)
    const tableData = React.useMemo<GradeTableRowData[]>(() => {
        // !! Tambah pengecekan students di sini untuk keamanan tambahan !!
        if (!Array.isArray(students)) return []; // Kembalikan array kosong jika students belum valid
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        return students.map((student: Student) => {
            const studentGrades = grades[student.id] || {};
            let calculatedFinalScore: number | null = null; let scoreTimesWeightSum = 0; let weightSum = 0;
            currentComponents.forEach((comp: AssessmentComponent) => { const score = studentGrades[comp.id]; if (score !== null && score !== undefined && !isNaN(Number(score)) && comp.weight > 0) { scoreTimesWeightSum += (Number(score) * comp.weight); weightSum += comp.weight; } });
            if (weightSum > 0) { calculatedFinalScore = scoreTimesWeightSum / weightSum; }
            const componentScores: Record<string, number | null> = {};
            currentComponents.forEach((comp: AssessmentComponent) => { componentScores[comp.id] = studentGrades[comp.id] ?? null; });
            return { id: student.id, name: student.name, class: student.class, ...componentScores, finalScore: calculatedFinalScore };
        });
    }, [students, assessmentComponents, grades]);

    // Siapkan Opsi Filter Nama Siswa
    const nameFilterOptions = React.useMemo<FilterOption[]>(() => {
        // !! Pastikan students adalah array sebelum mapping !!
        if (!Array.isArray(students) || students.length === 0) {
            return []; // Kembalikan array kosong jika tidak ada student
        }
        const uniqueName = new Set(students.map(s => s.name));
        return Array.from(uniqueName).sort().map(name => ({
            label: name,
            value: name
        }));
    }, [students]); // Tetap dependency pada students
    
    // Opsi Filter Nilai Akhir
    const finalScoreFilterOptions: FilterOption[] = [ { label: "< 50", value: "lt50" }, { label: "50 - 75", value: "50to75" }, { label: "> 75", value: "gt75" }, ];

    // Siapkan Opsi Filter Kelas (MODIFIKASI: Tambah Pengecekan)
    const classFilterOptions = React.useMemo<FilterOption[]>(() => {
        // !! Pastikan students adalah array sebelum mapping !!
        if (!Array.isArray(students) || students.length === 0) {
            return []; // Kembalikan array kosong jika tidak ada student
        }
        const uniqueClasses = new Set(students.map(s => s.class));
        return Array.from(uniqueClasses).sort().map(className => ({
            label: className,
            value: className
        }));
    }, [students]); // Tetap dependency pada students

    // --- Handlers (Tidak berubah) ---
    // ... (handleGradeChange, handleCancelRow, handleEditRowTrigger, handleSaveRow,
    //      handleEditAllTrigger, handleCancelAllEdit, handleSaveAllChanges,
    //      startHeaderEdit, handleDeleteComponent, cancelHeaderEdit,
    //      handleHeaderEditChange, saveHeaderEdit - semua sama seperti sebelumnya) ...
    const handleGradeChange = React.useCallback((studentId: string, componentId: string, value: string) => { const numericValue = value === '' ? null : Number(value); const clampedValue = numericValue === null ? null : Math.max(0, Math.min(100, numericValue)); if (numericValue !== null && (isNaN(numericValue) || numericValue < 0 || numericValue > 100)) { toast.warning("Nilai 0-100."); return; } setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: clampedValue } })); }, []);
    const handleCancelRow = React.useCallback((rowId: string) => { const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; setGrades(prev => { const originalRowGrades = initialGrades[rowId] || {}; const updatedStudentGrades = { ...(prev[rowId] || {}) }; currentComponents.forEach((c: AssessmentComponent) => { updatedStudentGrades[c.id] = originalRowGrades[c.id] ?? null; }); return { ...prev, [rowId]: updatedStudentGrades }; }); setEditingRowId(null); }, [initialGrades, assessmentComponents]);
    const handleEditRowTrigger = React.useCallback((rowId: string) => { if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); } setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId); }, [editingRowId, handleCancelRow]);
    const handleSaveRow = React.useCallback(async (rowId: string) => { setIsSavingRow(rowId); const promises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const student = students.find(s => s.id === rowId); if (!student) { toast.error("Siswa tidak ditemukan."); setIsSavingRow(null); return; } const studentCurrentGrades = grades[rowId] || {}; const studentInitialGrades = initialGrades[rowId] || {}; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; currentComponents.forEach((c: AssessmentComponent) => { const componentId = c.id; const currentGrade = studentCurrentGrades[componentId]; const initialGrade = studentInitialGrades[componentId]; const hasChanged = JSON.stringify(currentGrade ?? null) !== JSON.stringify(initialGrade ?? null); if (hasChanged) { if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) { toast.error(`Nilai ${c.name} (${student.name}) invalid.`); validationError = true; } else { changesCount++; promises.push(onSaveSingleGrade(rowId, componentId, currentGrade)); } } }); if (validationError) { setIsSavingRow(null); return; } if (changesCount === 0) { toast.info(`Tidak ada perubahan ${student.name}.`); setIsSavingRow(null); setEditingRowId(null); return; } try { await Promise.all(promises); toast.success(`Nilai ${student.name} disimpan.`); setEditingRowId(null); } catch (error) { toast.error(`Gagal simpan ${student.name}: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingRow(null); } }, [students, assessmentComponents, grades, initialGrades, onSaveSingleGrade]);
    const handleEditAllTrigger = React.useCallback(() => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); }, []);
    const handleCancelAllEdit = React.useCallback(() => { setGrades(initialGrades); setIsEditingAll(false); setEditingRowId(null); toast.info("Mode Edit Semua dibatalkan."); }, [initialGrades]);
    const handleSaveAllChanges = React.useCallback(async () => { setIsSavingAll(true); const savePromises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; for (const student of students) { const studentId = student.id; const studentCurrentGrades = grades[studentId] || {}; const studentInitialGrades = initialGrades[studentId] || {}; for (const component of currentComponents) { const compId = component.id; const current = studentCurrentGrades[compId]; const initial = studentInitialGrades[compId]; const hasChanged = JSON.stringify(current ?? null) !== JSON.stringify(initial ?? null); if (hasChanged) { if (current !== null && (isNaN(current) || current < 0 || current > 100)) { toast.error(`Nilai ${component.name} (${student.name}) invalid.`); validationError = true; break; } changesCount++; savePromises.push(onSaveSingleGrade(studentId, compId, current)); } } if (validationError) break; } if (validationError) { setIsSavingAll(false); return; } if (changesCount === 0) { toast.info("Tidak ada perubahan nilai."); setIsSavingAll(false); setIsEditingAll(false); return; } try { await Promise.all(savePromises); toast.success(`${changesCount} perubahan disimpan.`); setIsEditingAll(false); } catch (error) { toast.error(`Gagal simpan semua: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingAll(false); } }, [students, assessmentComponents, grades, initialGrades, onSaveSingleGrade]);
    const startHeaderEdit = React.useCallback((component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const handleDeleteComponent = React.useCallback((id: string, name: string) => { if (onDeleteComponent) { onDeleteComponent(id, name); } else { console.warn("onDeleteComponent prop is missing"); } }, [onDeleteComponent]);
    const cancelHeaderEdit = React.useCallback(() => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = React.useCallback((field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = React.useCallback(async () => { if (!editingHeaderId) return; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; const comp = currentComponents.find(c => c.id === editingHeaderId); if (!comp) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib"); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot > 0."); return; } if (name.trim() === comp.name && weightValue === comp.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { await onUpdateComponent({ id: editingHeaderId, name: name.trim(), weight: weightValue }); toast.success(`Komponen ${name.trim()} diperbarui.`); cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update header: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); } }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);
    

    // Definisi Kolom Tabel (Memoized)
    const columns = React.useMemo( () => generateGradeColumns( assessmentComponents, grades, startHeaderEdit, handleDeleteComponent, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, !!editingRowId || isEditingAll ), [ assessmentComponents, grades, startHeaderEdit, handleDeleteComponent, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, editingRowId, isEditingAll ]);

     // Inisialisasi Tanstack Table Instance
     const table = useReactTable({
        data: tableData,
        columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters }, // columnVisibility state digunakan di sini
        enableRowSelection: true, onRowSelectionChange: setRowSelection, onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility, // Handler untuk update state visibility
        getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
        meta: { grades, editingRowId, isEditingAll, isSavingRow, isSavingAll, handleGradeChange, handleEditRowTrigger, handleCancelRow, handleSaveRow }
    });
    // Handler Reset (Definisi setelah 'table')
    const handleResetSelected = React.useCallback(() => { const selectedRows = table.getFilteredSelectedRowModel().rows; if (selectedRows.length === 0) { toast.info("Pilih siswa."); return; } const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; setGrades(prevGrades => { const newGrades = { ...prevGrades }; selectedRows.forEach(row => { const studentId = row.original.id; const originalStudentGrades = initialGrades[studentId] || {}; newGrades[studentId] = {}; currentComponents.forEach((c: AssessmentComponent) => { newGrades[studentId][c.id] = originalStudentGrades[c.id] ?? null; }); }); return newGrades; }); table.toggleAllPageRowsSelected(false); setEditingRowId(null); toast.info(`${selectedRows.length} siswa direset.`); }, [initialGrades, assessmentComponents, table]);

    // --- Render Komponen ---
    return (
        <div className="space-y-4">
            {subjectName && <h2 className="text-xl font-semibold mb-2">{subjectName}</h2>}

            {/* Toolbar Tabel */}
            <GradeDataTableToolbar
                table={table}
                onResetSelected={handleResetSelected}
                isEditingAll={isEditingAll}
                isSavingAll={isSavingAll}
                onEditAll={handleEditAllTrigger}
                onSaveAll={handleSaveAllChanges}
                onCancelAll={handleCancelAllEdit}
                isRowEditing={!!editingRowId}
                nameFilterOptions={nameFilterOptions}
                classFilterOptions={classFilterOptions}
                finalScoreFilterOptions={finalScoreFilterOptions}
            />

            {/* Tabel Utama */}
            <div className="overflow-x-auto relative border rounded-md">
                <Table>
                     {/* Header Tabel */}
                     <TableHeader className="sticky top-0 bg-muted/80 z-20 backdrop-blur-sm">
                         {table.getHeaderGroups().map(headerGroup => (
                             <TableRow key={headerGroup.id}>
                                 {headerGroup.headers.map(header => {
                                     let stickyOffset = 0;
                                     if (header.id === 'name') stickyOffset = table.getColumn('select')?.getSize() ?? 0;
                                     else if (header.id === 'class') stickyOffset = (table.getColumn('select')?.getSize() ?? 0) + (table.getColumn('name')?.getSize() ?? 0);
                                     return ( <TableHead key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined, minWidth: header.getSize() !== 150 ? `${header.getSize()}px` : '100px', left: (header.id === 'name' || header.id === 'class') ? `${stickyOffset}px` : undefined, }} className={cn( 'px-2 py-2 text-sm h-auto whitespace-nowrap', (header.id === 'select' || header.id === 'name' || header.id === 'class' || header.id === 'actions' || header.id === 'finalScore') && 'sticky z-10', header.id === 'select' && 'left-0', header.id === 'actions' && 'right-0 text-center', header.id === 'finalScore' && `right-[${table.getColumn('actions')?.getSize() ?? 80}px] text-center`, (header.id === 'select' || header.id === 'name' || header.id === 'class' || header.id === 'actions' || header.id === 'finalScore') && 'bg-muted/90' )}> {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())} </TableHead> );
                                 })}
                             </TableRow>
                         ))}
                     </TableHeader>
                     {/* Body Tabel */}
                     <TableBody>
                         {table.getRowModel().rows?.length ? (
                             table.getRowModel().rows.map(row => (
                                 <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={cn("hover:bg-muted/50", editingRowId === row.original.id && 'bg-secondary/60 hover:bg-secondary/70')}>
                                     {row.getVisibleCells().map(cell => {
                                          let stickyOffset = 0;
                                          if (cell.column.id === 'name') stickyOffset = table.getColumn('select')?.getSize() ?? 0;
                                          else if (cell.column.id === 'class') stickyOffset = (table.getColumn('select')?.getSize() ?? 0) + (table.getColumn('name')?.getSize() ?? 0);
                                          return ( <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined, minWidth: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : '100px', left: (cell.column.id === 'name' || cell.column.id === 'class') ? `${stickyOffset}px` : undefined, }} className={cn( 'px-2 py-1 h-11 align-middle', (cell.column.id === 'select' || cell.column.id === 'name' || cell.column.id === 'class' || cell.column.id === 'actions' || cell.column.id === 'finalScore') && 'sticky z-10', cell.column.id === 'select' && 'left-0', cell.column.id === 'actions' && 'right-0', cell.column.id === 'finalScore' && `right-[${table.getColumn('actions')?.getSize() ?? 80}px]`, (cell.column.id === 'select' || cell.column.id === 'name' || cell.column.id === 'class' || cell.column.id === 'actions' || cell.column.id === 'finalScore') && (editingRowId === row.original.id ? 'bg-secondary/60' : 'bg-card') )}> {flexRender(cell.column.columnDef.cell, cell.getContext())} </TableCell> );
                                     })}
                                 </TableRow>
                             ))
                         ) : ( <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Tidak ada data siswa.</TableCell></TableRow> )}
                     </TableBody>
                </Table>
            </div>

            {/* Pagination Tabel */}
            <DataTablePagination table={table} />
        </div>
    );
}