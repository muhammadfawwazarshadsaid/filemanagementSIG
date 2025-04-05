// app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    useReactTable, Table as TanstackTable, Row, HeaderGroup, Header, Cell, // Impor tipe tambahan
} from '@tanstack/react-table';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GradeDataTableToolbar } from './grade-entry-table-toolbar';
import { DataTablePagination } from './pagination';
import { Student, AssessmentComponent, GradesState, GradeTableRowData, FilterOption, GradeTableMeta } from './schema';
import { generateGradeColumns } from './grade-entry-columns';

interface GradeEntryDataTableProps {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    initialGrades: GradesState; // Ini adalah prop yang bisa berubah karena optimistic update di parent
    subjectId: string;
    subjectName?: string;
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    onDeleteComponent?: (componentId: string, componentName: string) => void;
    onUpdateComponent?: (updatedComponent: AssessmentComponent) => Promise<void>;
}

export function GradeEntryDataTable({
    students,
    assessmentComponents = [],
    initialGrades = {}, // Prop yang diterima
    subjectId,
    subjectName,
    onSaveSingleGrade,
    onDeleteComponent = () => { console.warn("onDeleteComponent not provided"); },
    onUpdateComponent = async () => { console.warn("onUpdateComponent not provided"); },
}: GradeEntryDataTableProps) {

    // State untuk nilai saat ini (yang bisa diedit)
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    // !! State BARU untuk menyimpan nilai asli saat komponen dimuat/props berubah !!
    const [originalLoadedGrades, setOriginalLoadedGrades] = React.useState<GradesState>({});

    // State lainnya (tidak berubah)
    const [editingRowId, setEditingRowId] = React.useState<string | null>(null);
    const [isSavingRow, setIsSavingRow] = React.useState<string | null>(null);
    const [isEditingAll, setIsEditingAll] = React.useState(false);
    const [isSavingAll, setIsSavingAll] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ 'class': false, });
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [editingHeaderId, setEditingHeaderId] = React.useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = React.useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = React.useState(false);

    // Effect untuk sinkronisasi saat props berubah
    React.useEffect(() => {
        const initialDataFromProp = initialGrades || {};
        // Set state nilai saat ini
        setGrades(initialDataFromProp);
        // !! Simpan salinan nilai asli saat props ini diterima !!
        setOriginalLoadedGrades(JSON.parse(JSON.stringify(initialDataFromProp))); // Deep copy untuk mencegah mutasi

        // Reset state internal lainnya
        setEditingRowId(null);
        setRowSelection({});
        setIsEditingAll(false);
        setEditingHeaderId(null);
        // Jangan reset filter atau sorting di sini, biarkan user mengontrolnya
        // setColumnFilters([]);
        // setSorting([]);
    }, [initialGrades, students, assessmentComponents]); // Dependensi tetap sama

    // Kalkulasi data tabel (tidak berubah)
    const tableData = React.useMemo<GradeTableRowData[]>(() => {
        if (!Array.isArray(students)) return [];
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        return students.map((student: Student) => {
            const studentGrades = grades[student.id] || {}; // Gunakan state 'grades' untuk tampilan
            let calculatedFinalScore: number | null = null;
            let scoreTimesWeightSum = 0;
            let weightSum = 0;
            currentComponents.forEach((comp: AssessmentComponent) => {
                const score = studentGrades[comp.id];
                if (score !== null && score !== undefined && !isNaN(Number(score)) && comp.weight > 0) {
                    scoreTimesWeightSum += (Number(score) * comp.weight);
                    weightSum += comp.weight;
                }
            });
            if (weightSum > 0) { calculatedFinalScore = scoreTimesWeightSum / weightSum; }
            const componentScores: Record<string, number | null> = {};
            currentComponents.forEach((comp: AssessmentComponent) => {
                componentScores[comp.id] = studentGrades[comp.id] ?? null;
            });
            return { id: student.id, name: student.name, class: student.class, ...componentScores, finalScore: calculatedFinalScore };
        });
    }, [students, assessmentComponents, grades]); // Tetap dependensi pada 'grades' untuk tampilan

    // Opsi filter (tidak berubah)
    const nameFilterOptions = React.useMemo<FilterOption[]>(/* ... */ () => { if (!Array.isArray(students) || students.length === 0) return []; const uniqueNames = new Set(students.map(s => s.name)); return Array.from(uniqueNames).sort().map(name => ({ label: name, value: name })); }, [students]);
    const classFilterOptions = React.useMemo<FilterOption[]>(/* ... */ () => { if (!Array.isArray(students) || students.length === 0) return []; const uniqueClasses = new Set(students.map(s => s.class)); return Array.from(uniqueClasses).sort().map(className => ({ label: className, value: className })); }, [students]);
    const finalScoreFilterOptions: FilterOption[] = [ { label: "< 50", value: "lt50" }, { label: "50 - 75", value: "50to75" }, { label: "> 75", value: "gt75" }, ];

    // --- Handlers (Hanya handleResetSelected yang diubah) ---
    const handleGradeChange = React.useCallback(/* ... */ (studentId: string, componentId: string, value: string) => { const numericValue = value === '' ? null : Number(value); const clampedValue = numericValue === null ? null : Math.max(0, Math.min(100, numericValue)); if (numericValue !== null && (isNaN(numericValue) || numericValue < 0 || numericValue > 100)) { toast.warning("Nilai 0-100."); return; } setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: clampedValue } })); }, []);
    const handleCancelRow = React.useCallback(/* ... */ (rowId: string) => { const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; setGrades(prev => { const originalRowGrades = originalLoadedGrades[rowId] || {}; /*<-- Gunakan originalLoadedGrades untuk cancel juga*/ const updatedStudentGrades = { ...(prev[rowId] || {}) }; currentComponents.forEach((c: AssessmentComponent) => { updatedStudentGrades[c.id] = originalRowGrades[c.id] ?? null; }); return { ...prev, [rowId]: updatedStudentGrades }; }); setEditingRowId(null); }, [originalLoadedGrades, assessmentComponents]); // Ubah dependensi ke originalLoadedGrades
    const handleEditRowTrigger = React.useCallback(/* ... */ (rowId: string) => { if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); } setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId); }, [editingRowId, handleCancelRow]);
    const handleSaveRow = React.useCallback(/* ... */ async (rowId: string) => { setIsSavingRow(rowId); const promises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const student = students.find(s => s.id === rowId); if (!student) { toast.error("Siswa tidak ditemukan."); setIsSavingRow(null); return; } const studentCurrentGrades = grades[rowId] || {}; const studentInitialGrades = originalLoadedGrades[rowId] || {}; /*<-- Bandingkan dengan originalLoadedGrades */ const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; currentComponents.forEach((c: AssessmentComponent) => { const componentId = c.id; const currentGrade = studentCurrentGrades[componentId]; const initialGrade = studentInitialGrades[componentId]; const hasChanged = JSON.stringify(currentGrade ?? null) !== JSON.stringify(initialGrade ?? null); if (hasChanged) { if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) { toast.error(`Nilai ${c.name} (${student.name}) invalid.`); validationError = true; } else { changesCount++; promises.push(onSaveSingleGrade(rowId, componentId, currentGrade)); } } }); if (validationError) { setIsSavingRow(null); return; } if (changesCount === 0) { toast.info(`Tidak ada perubahan ${student.name}.`); setIsSavingRow(null); setEditingRowId(null); return; } try { await Promise.all(promises); toast.success(`Nilai ${student.name} disimpan.`); setEditingRowId(null); } catch (error) { toast.error(`Gagal simpan ${student.name}: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingRow(null); } }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade]); // Ubah dependensi initialGrades ke originalLoadedGrades
    const handleEditAllTrigger = React.useCallback(/* ... */ () => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); }, []);
    const handleCancelAllEdit = React.useCallback(/* ... */ () => { setGrades(originalLoadedGrades); /* <-- Reset semua ke originalLoadedGrades */ setIsEditingAll(false); setEditingRowId(null); toast.info("Mode Edit Semua dibatalkan."); }, [originalLoadedGrades]); // Ubah dependensi
    const handleSaveAllChanges = React.useCallback(/* ... */ async () => { setIsSavingAll(true); const savePromises: Promise<void>[] = []; let changesCount = 0; let validationError = false; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; for (const student of students) { const studentId = student.id; const studentCurrentGrades = grades[studentId] || {}; const studentInitialGrades = originalLoadedGrades[studentId] || {}; /* <-- Bandingkan dengan originalLoadedGrades */ for (const component of currentComponents) { const compId = component.id; const current = studentCurrentGrades[compId]; const initial = studentInitialGrades[compId]; const hasChanged = JSON.stringify(current ?? null) !== JSON.stringify(initial ?? null); if (hasChanged) { if (current !== null && (isNaN(current) || current < 0 || current > 100)) { toast.error(`Nilai ${component.name} (${student.name}) invalid.`); validationError = true; break; } changesCount++; savePromises.push(onSaveSingleGrade(studentId, compId, current)); } } if (validationError) break; } if (validationError) { setIsSavingAll(false); return; } if (changesCount === 0) { toast.info("Tidak ada perubahan nilai."); setIsSavingAll(false); setIsEditingAll(false); return; } try { await Promise.all(savePromises); toast.success(`${changesCount} perubahan disimpan.`); setIsEditingAll(false); } catch (error) { toast.error(`Gagal simpan semua: ${error instanceof Error ? error.message : 'Error'}`); } finally { setIsSavingAll(false); } }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade]); // Ubah dependensi

    // Handler header (tidak berubah)
    const startHeaderEdit = React.useCallback(/* ... */ (component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const handleDeleteComponent = React.useCallback(/* ... */ (id: string, name: string) => { if (onDeleteComponent) { onDeleteComponent(id, name); } else { console.warn("onDeleteComponent prop is missing"); } }, [onDeleteComponent]);
    const cancelHeaderEdit = React.useCallback(/* ... */ () => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = React.useCallback(/* ... */ (field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = React.useCallback(/* ... */ async () => { if (!editingHeaderId) return; const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : []; const comp = currentComponents.find(c => c.id === editingHeaderId); if (!comp) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib"); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot > 0."); return; } if (name.trim() === comp.name && weightValue === comp.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { if (onUpdateComponent) { await onUpdateComponent({ id: editingHeaderId, name: name.trim(), weight: weightValue }); toast.success(`Komponen ${name.trim()} diperbarui (menunggu refresh data).`); } else { throw new Error("Update handler missing"); } cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update header: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); } }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);

    // Definisi Kolom Tabel (tidak berubah, hanya dependensi generateGradeColumns)
    const columns = React.useMemo<ColumnDef<GradeTableRowData>[]>(
        () => generateGradeColumns(
            assessmentComponents, grades, startHeaderEdit, handleDeleteComponent,
            editingHeaderId, editingHeaderValues, handleHeaderEditChange,
            saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, !!editingRowId || isEditingAll
        ),
        [
            assessmentComponents, grades, startHeaderEdit, handleDeleteComponent,
            editingHeaderId, editingHeaderValues, handleHeaderEditChange,
            saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, editingRowId, isEditingAll
        ]
    );

    // Inisialisasi Tanstack Table Instance (tidak berubah)
    const table = useReactTable<GradeTableRowData>({
        data: tableData, columns, state: { sorting, columnVisibility, rowSelection, columnFilters, },
        enableRowSelection: true, onRowSelectionChange: setRowSelection, onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters, onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
        meta: { grades, editingRowId, isEditingAll, isSavingRow, isSavingAll, handleGradeChange, handleEditRowTrigger, handleCancelRow, handleSaveRow, } as GradeTableMeta
    });

    // !! Handler Reset Selected Rows (MODIFIKASI UTAMA) !!
    const handleResetSelected = React.useCallback(() => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) {
            toast.info("Pilih siswa."); return;
        }
        const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        setGrades(prevGrades => { // Update state 'grades' yang aktif ditampilkan
            const newGrades = { ...prevGrades };
            selectedRows.forEach(row => {
                const studentId = row.original.id;
                // !! Ambil nilai dari state originalLoadedGrades !!
                const originalStudentGrades = originalLoadedGrades[studentId] || {}; // <--- PERUBAHAN DI SINI
                newGrades[studentId] = {}; // Reset objek siswa ini
                // Isi kembali dengan nilai dari originalLoadedGrades
                currentComponents.forEach((c: AssessmentComponent) => {
                    newGrades[studentId][c.id] = originalStudentGrades[c.id] ?? null;
                });
            });
            return newGrades; // Kembalikan state grades yang sudah direset
        });
        table.toggleAllPageRowsSelected(false); // Hapus centang
        setEditingRowId(null); // Pastikan tidak ada baris dalam mode edit
        toast.info(`${selectedRows.length} nilai siswa direset ke data asli.`); // Ubah pesan toast
    }, [originalLoadedGrades, assessmentComponents, table]); // !! Ubah dependensi ke originalLoadedGrades !!

    // Helper function getStickyOffset (tidak berubah)
    const getStickyOffset = (table: TanstackTable<GradeTableRowData>, columnId: string): number => {/* ... */ let offset = 0; const columnOrder = ['select', 'name', 'class']; const currentIndex = columnOrder.indexOf(columnId); if (currentIndex === -1) return 0; for (let i = 0; i < currentIndex; i++) { offset += table.getColumn(columnOrder[i])?.getSize() ?? 0; } return offset; };

    // --- Render Komponen ---
    return (
        <div className="space-y-4">
            {/* Toolbar Tabel */}
            <GradeDataTableToolbar
                table={table}
                onResetSelected={handleResetSelected} // Teruskan handler yang sudah diperbarui
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
                        {table.getHeaderGroups().map((headerGroup: HeaderGroup<GradeTableRowData>) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header: Header<GradeTableRowData, unknown>) => {
                                    const isStickyLeft = ['select', 'name', 'class'].includes(header.id);
                                    const isStickyRight = ['finalScore', 'actions'].includes(header.id);
                                    const stickyLeftOffset = isStickyLeft ? getStickyOffset(table, header.id) : undefined;
                                    let stickyRightOffset = 0; if (header.id === 'actions') stickyRightOffset = 0; if (header.id === 'finalScore') stickyRightOffset = table.getColumn('actions')?.getSize() ?? 80;
                                    return ( <TableHead key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined, minWidth: header.getSize() !== 150 ? `${header.getSize()}px` : '100px', left: isStickyLeft ? `${stickyLeftOffset}px` : undefined, right: isStickyRight ? `${stickyRightOffset}px` : undefined, }} className={cn( 'px-2 py-2 text-sm h-auto whitespace-nowrap', (isStickyLeft || isStickyRight) && 'sticky z-10', isStickyLeft && 'bg-muted/90', isStickyRight && 'bg-muted/90 text-center', header.id === 'finalScore' && 'text-center' )}> {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())} </TableHead> );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    {/* Body Tabel */}
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row: Row<GradeTableRowData>) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={cn("hover:bg-muted/50", editingRowId === row.original.id && 'bg-secondary/60 hover:bg-secondary/70')}>
                                    {row.getVisibleCells().map((cell: Cell<GradeTableRowData, unknown>) => {
                                        const isStickyLeft = ['select', 'name', 'class'].includes(cell.column.id);
                                        const isStickyRight = ['finalScore', 'actions'].includes(cell.column.id);
                                        const stickyLeftOffset = isStickyLeft ? getStickyOffset(table, cell.column.id) : undefined;
                                        let stickyRightOffset = 0; if (cell.column.id === 'actions') stickyRightOffset = 0; if (cell.column.id === 'finalScore') stickyRightOffset = table.getColumn('actions')?.getSize() ?? 80;
                                        return ( <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined, minWidth: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : '100px', left: isStickyLeft ? `${stickyLeftOffset}px` : undefined, right: isStickyRight ? `${stickyRightOffset}px` : undefined, }} className={cn( 'px-2 py-1 h-11 align-middle', (isStickyLeft || isStickyRight) && 'sticky z-10', isStickyLeft && (editingRowId === row.original.id ? 'bg-secondary/70' : 'bg-card'), isStickyRight && (editingRowId === row.original.id ? 'bg-secondary/70' : 'bg-card'), cell.column.id === 'finalScore' && 'text-center', cell.column.id === 'actions' && 'text-center' )}> {flexRender(cell.column.columnDef.cell, cell.getContext())} </TableCell> );
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