// app/components/grade-entry-data-table.tsx
'use client';

import * as React from 'react';
import {
    ColumnDef, ColumnFiltersState, SortingState, VisibilityState, flexRender,
    getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
    useReactTable, Table as TanstackTable, Row, HeaderGroup, Header, Cell,
} from '@tanstack/react-table';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Pastikan path benar
import { GradeDataTableToolbar } from './grade-entry-table-toolbar'; // Sesuaikan path
import { DataTablePagination } from './pagination'; // Sesuaikan path
import { Student, AssessmentComponent, GradesState, GradeTableRowData, FilterOption, GradeTableMeta } from './schema'; // Sesuaikan path
import { generateGradeColumns } from './grade-entry-columns'; // Sesuaikan path
import { RotateCcw, Loader2 } from 'lucide-react'; // Impor ikon
import { useCallback } from 'react';

interface GradeEntryDataTableProps {
    // Props yang diterima dari parent component (page)
    students: Student[] | undefined | null; // Izinkan undefined/null saat loading
    assessmentComponents: AssessmentComponent[] | undefined | null; // Izinkan undefined/null
    initialGrades: GradesState;
    subjectId: string;
    subjectName?: string;
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    onDeleteComponent?: (componentId: string, componentName: string) => void;
    onUpdateComponent?: (updatedComponent: AssessmentComponent) => Promise<void>;
}

export function GradeEntryDataTable({
    students, // Terima prop students (bisa undefined/null saat awal)
    assessmentComponents, // Terima prop assessmentComponents (bisa undefined/null)
    initialGrades = {},
    subjectId,
    subjectName,
    onSaveSingleGrade,
    onDeleteComponent = () => { console.warn("onDeleteComponent not provided"); },
    onUpdateComponent = async () => { console.warn("onUpdateComponent not provided"); },
}: GradeEntryDataTableProps) {

    // State lokal
    const [grades, setGrades] = React.useState<GradesState>(initialGrades);
    const [originalLoadedGrades, setOriginalLoadedGrades] = React.useState<GradesState>({});
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
    const [isResetting, setIsResetting] = React.useState(false);

    // Effect sinkronisasi (data dari props)
    React.useEffect(() => {
        const initialDataFromProp = initialGrades || {};
        setGrades(initialDataFromProp);
        setOriginalLoadedGrades(JSON.parse(JSON.stringify(initialDataFromProp)));
        setEditingRowId(null);
        setRowSelection({});
        setIsEditingAll(false);
        setEditingHeaderId(null);
    }, [initialGrades, students, assessmentComponents]); // <-- Deps tetap

    // --- Opsi Filter (DENGAN PENGECEKAN) ---
    const nameFilterOptions = React.useMemo<FilterOption[]>(() => {
        // --- TAMBAHKAN PENGECEKAN ---
        if (!Array.isArray(students)) {
            // console.warn("nameFilterOptions: students prop is not an array yet.");
            return []; // Kembalikan array kosong jika belum siap
        }
        // ---------------------------
        if (students.length === 0) return [];
        const uniqueNames = new Set(students.map(s => s.name));
        const sortedNames = Array.from(uniqueNames);
        try {
            sortedNames.sort(); // Panggil sort
        } catch (e) {
             console.error("Error sorting names:", e, sortedNames);
             return [];
        }
        return sortedNames.map(name => ({ label: name, value: name }));
    }, [students]); // <-- Dependensi ke prop students

    const classFilterOptions = React.useMemo<FilterOption[]>(() => {
        // --- TAMBAHKAN PENGECEKAN ---
         if (!Array.isArray(students)) {
            // console.warn("classFilterOptions: students prop is not an array yet.");
            return []; // Kembalikan array kosong jika belum siap
        }
        // ---------------------------
        if (students.length === 0) return [];
        const uniqueClasses = new Set(students.map(s => s.class));
        const sortedClasses = Array.from(uniqueClasses);
        try {
            sortedClasses.sort(); // Panggil sort
        } catch (e) {
            console.error("Error sorting classes:", e, sortedClasses);
            return [];
        }
        return sortedClasses.map(className => ({ label: className, value: className }));
    }, [students]); // <-- Dependensi ke prop students

    const finalScoreFilterOptions: FilterOption[] = [
        { label: "< 50", value: "lt50" },
        { label: "50 - 75", value: "50to75" },
        { label: "> 75", value: "gt75" },
    ];
    // -------------------------------------------

    // --- Kalkulasi Data Tabel (DENGAN PENGECEKAN) ---
    const tableData = React.useMemo<GradeTableRowData[]>(() => {
        // --- TAMBAHKAN PENGECEKAN ---
        if (!Array.isArray(students) || !Array.isArray(assessmentComponents)) {
             // console.warn("tableData: students or assessmentComponents not ready.");
            return []; // Kembalikan array kosong jika data belum siap
        }
        // --------------------------
        // Pastikan assessmentComponents tidak null/undefined sebelum di-pass
        const currentComponents = assessmentComponents || [];

        return students.map((student: Student) => {
            const studentGrades = grades[student.id] || {};
            let calculatedFinalScore: number | null = null;
            let scoreTimesWeightSum = 0;
            let weightSum = 0;

            currentComponents.forEach((comp: AssessmentComponent) => {
                // Pastikan comp tidak null dan weight ada sebelum kalkulasi
                if (comp && typeof comp.weight === 'number') {
                    const score = studentGrades[comp.id];
                    if (score !== null && score !== undefined && !isNaN(Number(score)) && comp.weight > 0) {
                        scoreTimesWeightSum += (Number(score) * comp.weight);
                        weightSum += comp.weight;
                    }
                }
            });

            if (weightSum > 0) {
                 // Pastikan tidak division by zero
                calculatedFinalScore = scoreTimesWeightSum / weightSum;
            }

            const componentScores: Record<string, number | null> = {};
            currentComponents.forEach((comp: AssessmentComponent) => {
                if (comp && comp.id) { // Pastikan comp dan comp.id ada
                    componentScores[comp.id] = studentGrades[comp.id] ?? null;
                }
            });

            return {
                id: student.id,
                name: student.name,
                class: student.class,
                ...componentScores, // Sebar skor komponen
                finalScore: calculatedFinalScore
            };
        });
    // Tambahkan assessmentComponents ke dependensi useMemo tableData
    }, [students, assessmentComponents, grades]);
    // -------------------------------------------

    // --- Handlers (Edit, Save, Cancel, Reset - SAMA seperti versi terakhir) ---
    const handleGradeChange = useCallback((studentId: string, componentId: string, value: string) => {
        const numericValue = value === '' ? null : Number(value);
        const clampedValue = numericValue === null ? null : Math.max(0, Math.min(100, numericValue));
        if (numericValue !== null && (isNaN(numericValue) || numericValue < 0 || numericValue > 100)) { toast.warning("Nilai 0-100."); return; }
        setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), [componentId]: clampedValue } }));
    }, []);

    const handleCancelRow = useCallback((rowId: string) => {
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        setGrades(prev => {
            const originalRowGrades = originalLoadedGrades[rowId] || {};
            const updatedStudentGrades = { ...(prev[rowId] || {}) };
            currentComponentsSafe.forEach((c: AssessmentComponent) => {
                if (c && c.id) updatedStudentGrades[c.id] = originalRowGrades[c.id] ?? null;
            });
            return { ...prev, [rowId]: updatedStudentGrades };
        });
        setEditingRowId(null);
    }, [originalLoadedGrades, assessmentComponents]);

    const handleEditRowTrigger = useCallback((rowId: string) => {
        if (editingRowId && editingRowId !== rowId) { handleCancelRow(editingRowId); }
        setIsEditingAll(false); setRowSelection({}); setEditingRowId(rowId);
    }, [editingRowId, handleCancelRow]);

    const handleSaveRow = useCallback(async (rowId: string) => {
        // Pastikan students & assessmentComponents adalah array sebelum lanjut
        if (!Array.isArray(students) || !Array.isArray(assessmentComponents)) {
            toast.error("Data siswa atau komponen belum siap.");
            return;
        }
        setIsSavingRow(rowId);
        const promises: Promise<void>[] = []; let changesCount = 0; let validationError = false;
        const student = students.find(s => s.id === rowId);
        if (!student) { toast.error("Siswa tidak ditemukan."); setIsSavingRow(null); return; }
        const studentCurrentGrades = grades[rowId] || {};
        const studentInitialGrades = originalLoadedGrades[rowId] || {};
        const currentComponentsSafe = assessmentComponents || [];

        currentComponentsSafe.forEach((c: AssessmentComponent) => {
            if (!c || !c.id) return; // Skip jika komponen tidak valid
            const componentId = c.id;
            const currentGrade = studentCurrentGrades[componentId];
            const initialGrade = studentInitialGrades[componentId];
            const hasChanged = JSON.stringify(currentGrade ?? null) !== JSON.stringify(initialGrade ?? null);
            if (hasChanged) {
                if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) {
                    toast.error(`Nilai ${c.name} (${student.name}) invalid.`); validationError = true;
                } else { changesCount++; promises.push(onSaveSingleGrade(rowId, componentId, currentGrade)); }
            }
        });

        if (validationError) { setIsSavingRow(null); return; }
        if (changesCount === 0) { toast.info(`Tidak ada perubahan ${student.name}.`); setIsSavingRow(null); setEditingRowId(null); return; }
        try {
            await Promise.all(promises); toast.success(`Nilai ${student.name} disimpan.`);
            setOriginalLoadedGrades(prevOrig => { const newOrig = JSON.parse(JSON.stringify(prevOrig)); newOrig[rowId] = { ...(newOrig[rowId] || {}), ...studentCurrentGrades }; return newOrig; });
            setEditingRowId(null);
        } catch (error) { toast.error(`Gagal simpan ${student.name}: ${error instanceof Error ? error.message : 'Error'}`); }
        finally { setIsSavingRow(null); }
    }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade]);

    const handleEditAllTrigger = useCallback(() => { setEditingRowId(null); setRowSelection({}); setIsEditingAll(true); }, []);

    const handleCancelAllEdit = useCallback(() => { setGrades(originalLoadedGrades); setIsEditingAll(false); setEditingRowId(null); toast.info("Mode Edit Semua dibatalkan."); }, [originalLoadedGrades]);

    // In GradeEntryDataTable component

    const handleSaveAllChanges = useCallback(async () => {
        // Initial checks remain the same
        if (!Array.isArray(students) || !Array.isArray(assessmentComponents)) {
            toast.error("Data siswa atau komponen belum siap.");
            return;
        }
        setIsSavingAll(true); // Start loading indicator

        // --- Variables to track changes and errors ---
        const studentsWithChanges: Record<string, GradesState[string]> = {};
        const changesToSave: { studentId: string; componentId: string; score: number | null; studentName: string; componentName: string }[] = [];
        let validationError = false;
        let saveErrors: { studentName: string; componentName: string; message: string }[] = [];
        // --------------------------------------------

        console.log("[Save All] Starting check for changes...");

        // --- Phase 1: Identify all valid changes ---
        for (const student of students) {
            if (!student?.id) continue;
            const studentId = student.id;
            const studentCurrentGrades = grades[studentId] || {};
            const studentInitialGrades = originalLoadedGrades[studentId] || {};
            let studentHasChanges = false;

            for (const component of assessmentComponents) {
                if (!component?.id) continue;
                const compId = component.id;
                const current = studentCurrentGrades[compId];
                const initial = studentInitialGrades[compId];
                const hasChanged = JSON.stringify(current ?? null) !== JSON.stringify(initial ?? null);

                if (hasChanged) {
                    // Validate the changed value
                    if (current !== null && (isNaN(Number(current)) || Number(current) < 0 || Number(current) > 100)) {
                        toast.error(`Nilai ${component.name} (${student.name}) tidak valid.`);
                        validationError = true;
                        break; // Stop checking this student if one value is invalid
                    }
                    // Add valid change to the list to be saved
                    changesToSave.push({ studentId, componentId: compId, score: current, studentName: student.name, componentName: component.name });
                    studentHasChanges = true;
                }
            } // End component loop

            if (validationError) break; // Stop checking other students if validation failed
            if (studentHasChanges) {
                // Store the *current* grades for students who had changes, needed for updating originalLoadedGrades later
                studentsWithChanges[studentId] = { ...studentCurrentGrades };
            }
        } // End student loop
        // --- End Phase 1 ---

        if (validationError) {
            setIsSavingAll(false);
            return; // Stop if validation failed
        }

        if (changesToSave.length === 0) {
            toast.info("Tidak ada perubahan nilai untuk disimpan.");
            setIsSavingAll(false);
            setIsEditingAll(false); // Exit edit all mode if no changes
            return;
        }

        console.log(`[Save All] Found ${changesToSave.length} changes. Starting sequential save...`);

        // --- Phase 2: Save changes sequentially ---
        let successCount = 0;
        for (const change of changesToSave) {
            try {
                console.log(`[Save All] Saving: St:${change.studentId}, Comp:${change.componentId}, Score:${change.score}`);
                // Await each save operation
                await onSaveSingleGrade(change.studentId, change.componentId, change.score);
                successCount++;
            } catch (error) {
                console.error(`[Save All] Failed for St:${change.studentId}, Comp:${change.componentId}:`, error);
                saveErrors.push({
                    studentName: change.studentName,
                    componentName: change.componentName,
                    message: error instanceof Error ? error.message : String(error)
                });
                // Continue to next save attempt even if one fails
            }
        }
        // --- End Phase 2 ---

        console.log(`[Save All] Finished sequential save. Success: ${successCount}/${changesToSave.length}. Errors: ${saveErrors.length}`);

        // --- Phase 3: Finalize state and show feedback ---
        // Update snapshot only for students whose grades were *intended* to be saved (even if some failed)
        // This ensures 'Cancel' after a partial save reflects the attempted state.
        if (Object.keys(studentsWithChanges).length > 0) {
            setOriginalLoadedGrades(prevOrig => {
                const newOrig = JSON.parse(JSON.stringify(prevOrig));
                Object.keys(studentsWithChanges).forEach(sid => {
                    newOrig[sid] = { ...(newOrig[sid] || {}), ...studentsWithChanges[sid] };
                });
                return newOrig;
            });
        }

        if (saveErrors.length === 0) {
            // All saves succeeded
            toast.success(`${successCount} perubahan berhasil disimpan.`);
            setIsEditingAll(false); // Exit edit all mode on full success
        } else {
            // Some saves failed
            toast.error(`Gagal menyimpan ${saveErrors.length} dari ${changesToSave.length} perubahan. Error pertama: ${saveErrors[0].message}`, { duration: 7000 });
            // Optional: List all errors if needed
            // saveErrors.forEach(err => console.error(`Save Error Detail: ${err.studentName}, ${err.componentName} - ${err.message}`));
            // DO NOT exit edit all mode if there were errors, let user fix them
        }

        setIsSavingAll(false); // End loading indicator

    // Update dependencies - ensure all state variables and props used are listed
    }, [students, assessmentComponents, grades, originalLoadedGrades, onSaveSingleGrade, setIsSavingAll, setIsEditingAll, setOriginalLoadedGrades]);

    const handleResetSelected = useCallback(async () => {
        // Pastikan assessmentComponents dan table ada dan valid
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        if (selectedRows.length === 0) { toast.info("Pilih siswa."); return; }
        if (currentComponentsSafe.length === 0) { toast.warning("Tidak ada komponen."); return; }

        setIsResetting(true); // Mulai loading
        let successCount = 0;
        let firstError: Error | null = null;
        const studentsToReset: { studentId: string, name: string }[] = selectedRows.map(row => ({ studentId: row.original.id, name: row.original.name }));
        const componentsToReset: AssessmentComponent[] = currentComponentsSafe.filter(c => c && c.id);
        const totalOperations = studentsToReset.length * componentsToReset.length;

        console.log(`[Reset Sekuensial] Mulai reset untuk ${studentsToReset.length} siswa, ${componentsToReset.length} komponen. Total ops: ${totalOperations}`);

        // --- GANTI Promise.all DENGAN LOOP SEKUENSIAL ---
        const updatedGradesForState: GradesState = structuredClone(grades || {}); // Clone state awal

        // Loop untuk setiap siswa
        for (const student of studentsToReset) {
            const studentId = student.studentId;
            if (!updatedGradesForState[studentId]) updatedGradesForState[studentId] = {}; // Siapkan object nilai siswa di state clone

            // Loop untuk setiap komponen
            for (const component of componentsToReset) {
                const componentId = component.id;
                console.log(`[Reset Sekuensial] Proses: St:${studentId}, Comp:${componentId}, Score: null`);

                // Update state clone dulu untuk UI (jika state diupdate di akhir)
                updatedGradesForState[studentId][componentId] = null;

                try {
                    // await PENTING DI SINI: Tunggu 1 request selesai baru lanjut
                    await onSaveSingleGrade(studentId, componentId, null); // Panggil fungsi save dari props (page.tsx)
                    successCount++;
                } catch (error) {
                    console.error(`[Reset Sekuensial] GAGAL untuk St:${studentId}, Comp:${componentId}:`, error);
                    if (!firstError) { // Simpan error pertama yang terjadi
                        firstError = error instanceof Error ? error : new Error(String(error));
                    }
                    // Putuskan: Lanjutkan reset untuk yang lain? Atau berhenti?
                    // Jika ingin berhenti di error pertama, tambahkan 'break;' di kedua loop:
                    // break; // Keluar dari loop komponen
                }
            } // Akhir loop komponen
            // Jika ingin berhenti di error pertama, cek di sini juga
            // if (firstError) break; // Keluar dari loop siswa
        } // Akhir loop siswa
        // --- AKHIR LOOP SEKUENSIAL ---

        console.log(`[Reset Sekuensial] Selesai. Sukses: ${successCount}/${totalOperations}.`);

        // Update state React SETELAH SEMUA operasi selesai (atau gagal sebagian)
        setGrades(updatedGradesForState);

        // Update snapshot original jika semua berhasil (opsional)
        if (!firstError && successCount === totalOperations) {
            setOriginalLoadedGrades(prevOrig => {
                const newOrig = JSON.parse(JSON.stringify(prevOrig));
                studentsToReset.forEach(student => {
                    const sid = student.studentId;
                    if (!newOrig[sid]) newOrig[sid] = {};
                    componentsToReset.forEach(comp => { if(comp && comp.id) newOrig[sid][comp.id] = null; });
                });
                return newOrig;
            });
            toast.success(`${successCount} nilai berhasil direset.`);
        } else if (firstError) {
            // Jika ada error, tampilkan pesan error pertama
            toast.error(`Gagal mereset sebagian nilai: ${firstError.message}`, { duration: 5000 });
            // Pertimbangkan refresh data jika gagal sebagian
            // fetchInitialData();
        } else {
            // Kasus aneh jika tidak error tapi successCount != totalOperations
            toast.warning(`Reset selesai dengan ${successCount} operasi sukses dari ${totalOperations}.`);
        }

        // Reset UI table selection
        table.toggleAllPageRowsSelected(false);
        setEditingRowId(null);
        setIsResetting(false); // Selesai loading

    // Pastikan dependensi useCallback sesuai, terutama onSaveSingleGrade, assessmentComponents, table, grades, originalLoadedGrades
    }, [assessmentComponents, onSaveSingleGrade, grades, originalLoadedGrades, setIsResetting, setGrades, setOriginalLoadedGrades, setEditingRowId]);

    // Handler header (SAMA seperti versi terakhir)
    const startHeaderEdit = useCallback((component: AssessmentComponent) => { setEditingHeaderId(component.id); setEditingHeaderValues({ name: component.name, weight: component.weight.toString() }); }, []);
    const handleDeleteComponent = useCallback((id: string, name: string) => { if (onDeleteComponent) { onDeleteComponent(id, name); } else { console.warn("onDeleteComponent prop missing"); } }, [onDeleteComponent]);
    const cancelHeaderEdit = useCallback(() => { setEditingHeaderId(null); setEditingHeaderValues({ name: '', weight: '' }); }, []);
    const handleHeaderEditChange = useCallback((field: 'name' | 'weight', value: string) => { setEditingHeaderValues(prev => ({ ...prev, [field]: value })); }, []);
    const saveHeaderEdit = useCallback(async () => {
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        if (!editingHeaderId) return; const comp = currentComponentsSafe.find(c => c.id === editingHeaderId); if (!comp) return; const { name, weight } = editingHeaderValues; if (!name?.trim() || !weight?.trim()) { toast.error("Nama & Bobot wajib"); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot > 0."); return; } if (name.trim() === comp.name && weightValue === comp.weight) { cancelHeaderEdit(); return; } setIsHeaderEditingLoading(true); try { if (onUpdateComponent) { await onUpdateComponent({ ...comp, name: name.trim(), weight: weightValue }); toast.success(`Komponen diperbarui.`); } else { throw new Error("Update handler missing"); } cancelHeaderEdit(); } catch (err) { toast.error(`Gagal update header: ${err instanceof Error ? err.message : 'Error'}`); } finally { setIsHeaderEditingLoading(false); } }, [editingHeaderId, editingHeaderValues, assessmentComponents, onUpdateComponent, cancelHeaderEdit]);

    // Definisi Kolom Tabel (Dependensi ditambah assessmentComponents & grades)
    const columns = React.useMemo<ColumnDef<GradeTableRowData>[]>(() => {
        // Pastikan assessmentComponents adalah array sebelum di-pass
        const currentComponentsSafe = Array.isArray(assessmentComponents) ? assessmentComponents : [];
        return generateGradeColumns(
                currentComponentsSafe, grades, startHeaderEdit, handleDeleteComponent,
                editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit,
                cancelHeaderEdit, isHeaderEditingLoading, !!editingRowId || isEditingAll
        )
    }, [ assessmentComponents, grades, startHeaderEdit, handleDeleteComponent, editingHeaderId, editingHeaderValues, handleHeaderEditChange, saveHeaderEdit, cancelHeaderEdit, isHeaderEditingLoading, editingRowId, isEditingAll ]); // <-- Dependencies columns


    // Inisialisasi Tanstack Table Instance
    const table = useReactTable<GradeTableRowData>({
        data: tableData, // Gunakan tableData yang sudah dicek
        columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: { grades, editingRowId, isEditingAll, isSavingRow, isSavingAll, handleGradeChange, handleEditRowTrigger, handleCancelRow, handleSaveRow } as GradeTableMeta
    });

    // Helper function getStickyOffset (SAMA)
    const getStickyOffset = (tableInstance: TanstackTable<GradeTableRowData>, columnId: string): number => {
        let offset = 0; const columnOrder = ['select', 'name', 'class']; const currentIndex = columnOrder.indexOf(columnId); if (currentIndex === -1) return 0;
        for (let i = 0; i < currentIndex; i++) { const column = tableInstance.getColumn(columnOrder[i]); if (column?.getIsVisible()) { offset += column.getSize(); } } return offset;
    }

    // --- Render Komponen ---
    return (
        <div className="space-y-4">
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
                nameFilterOptions={nameFilterOptions} // filter options yg sudah dicek
                classFilterOptions={classFilterOptions} // filter options yg sudah dicek
                finalScoreFilterOptions={finalScoreFilterOptions}
                isResetting={isResetting}
            />

            {/* Tabel Utama */}
            <div className="overflow-x-auto relative border rounded-md">
                <Table>
                    {/* Header Tabel (Logika Sticky SAMA) */}
                     <TableHeader className="sticky top-0 bg-muted/80 z-20 backdrop-blur-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const isStickyLeft = ['select', 'name', 'class'].includes(header.id);
                                    const isStickyRight = ['finalScore', 'actions'].includes(header.id);
                                    const stickyLeftOffset = isStickyLeft ? getStickyOffset(table, header.id) : undefined;
                                    let stickyRightOffset = 0;
                                    if (header.id === 'actions') stickyRightOffset = 0;
                                    if (header.id === 'finalScore') { const actionsCol = table.getColumn('actions'); stickyRightOffset = actionsCol?.getIsVisible() ? actionsCol.getSize() : 0; }
                                    return ( <TableHead key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined, minWidth: header.getSize() !== 150 ? `${header.getSize()}px` : '100px', left: isStickyLeft ? `${stickyLeftOffset}px` : undefined, right: isStickyRight ? `${stickyRightOffset}px` : undefined, position: (isStickyLeft || isStickyRight) ? 'sticky' : undefined, }} className={cn('px-2 py-2 text-sm h-auto whitespace-nowrap', (isStickyLeft || isStickyRight) && 'z-10', isStickyLeft && 'bg-muted/90', isStickyRight && 'bg-muted/90 text-center', header.id === 'finalScore' && 'text-center')} > {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())} </TableHead> );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                   {/* Body Tabel */}
                    <TableBody>
                        {(() => { // Gunakan IIFE untuk memastikan return value bersih
                            const rows = table.getRowModel().rows; // Ambil baris

                            if (rows && rows.length > 0) {
                                // Jika ada baris, map seperti biasa
                                return rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        className={cn("hover:bg-muted/50", editingRowId === row.original.id && 'bg-secondary/60 hover:bg-secondary/70')}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            // Logika sticky tetap sama
                                            const isStickyLeft = ['select', 'name', 'class'].includes(cell.column.id);
                                            const isStickyRight = ['finalScore', 'actions'].includes(cell.column.id);
                                            const stickyLeftOffset = isStickyLeft ? getStickyOffset(table, cell.column.id) : undefined;
                                            let stickyRightOffset = 0;
                                            if (cell.column.id === 'actions') stickyRightOffset = 0;
                                            if (cell.column.id === 'finalScore') { const actionsCol = table.getColumn('actions'); stickyRightOffset = actionsCol?.getIsVisible() ? actionsCol.getSize() : 0; }

                                            return (
                                                <TableCell
                                                    key={cell.id}
                                                    style={{
                                                        width: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : undefined,
                                                        minWidth: cell.column.getSize() !== 150 ? `${cell.column.getSize()}px` : '100px',
                                                        left: isStickyLeft ? `${stickyLeftOffset}px` : undefined,
                                                        right: isStickyRight ? `${stickyRightOffset}px` : undefined,
                                                        position: (isStickyLeft || isStickyRight) ? 'sticky' : undefined,
                                                    }}
                                                    className={cn(
                                                        'px-2 py-1 h-11 align-middle',
                                                        (isStickyLeft || isStickyRight) && 'z-10',
                                                        isStickyLeft && (editingRowId === row.original.id ? 'bg-secondary/70' : 'bg-card'),
                                                        isStickyRight && (editingRowId === row.original.id ? 'bg-secondary/70' : 'bg-card'),
                                                        cell.column.id === 'finalScore' && 'text-center',
                                                        cell.column.id === 'actions' && 'text-center'
                                                    )}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ));
                            } else {
                                // Jika tidak ada baris, kembalikan satu TableRow fallback
                                return (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            Tidak ada data siswa yang cocok dengan filter atau data belum dimuat.
                                        </TableCell>
                                    </TableRow>
                                );
                            }
                        })()}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Tabel */}
            <DataTablePagination table={table} />
        </div>
    );
}