// app/components/grade-entry-columns.tsx
'use client';

import { ColumnDef, CellContext, SortingFn, HeaderContext, FilterFn, Row } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Save, XCircle, Loader2, Check, Ban } from "lucide-react";
import { AssessmentComponent, GradeTableRowData, GradesState, GradeTableMeta } from "./schema"; // Impor tipe
import { DataTableColumnHeader } from "./sort"; // Pastikan path ini benar
import { toast } from "sonner";

// --- Komponen Cell Nilai ---
const GradeCell = ({ row, column, table }: CellContext<GradeTableRowData, unknown>) => {
    const meta = table.options.meta as GradeTableMeta;
    const studentId = row.original.id;
    const componentId = column.id;
    const isEditable = meta.isEditingAll || meta.editingRowId === studentId;
    const isSaving = meta.isSavingRow === studentId || meta.isSavingAll;
    // Ambil nilai DARI STATE 'grades' yang ada di meta untuk tampilan
    const currentValue = meta.grades?.[studentId]?.[componentId];
    const displayValue = currentValue === null || currentValue === undefined ? '' : currentValue.toString();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(numericValue!) || numericValue! < 0 || numericValue! > 100)) {
             toast.warning("Nilai harus antara 0 dan 100.");
             return;
        }
        // Panggil handler dari meta untuk update state 'grades'
        meta.handleGradeChange(studentId, componentId, value);
    };

    return (
        <div className="text-center min-w-[70px]">
            {isEditable ? (
                <Input
                    type="number"
                    step="any" // Atau "1" jika hanya integer
                    min="0"
                    max="100"
                    placeholder="-" // Placeholder jika kosong
                    value={displayValue} // Tampilkan nilai dari state 'grades'
                    onChange={handleChange}
                    className="max-w-[70px] mx-auto text-center h-8 text-sm p-1"
                    disabled={isSaving} // Disable saat saving
                    aria-label={`Nilai ${column.id} untuk ${row.original.name}`}
                />
            ) : (
                // Tampilkan nilai (atau '-') jika tidak dalam mode edit
                <span className="text-sm px-2">{displayValue === '' ? '-' : displayValue}</span>
            )}
        </div>
    );
};

// Fungsi Filter Kustom untuk Nilai Akhir
const finalScoreRangeFilter: FilterFn<GradeTableRowData> = (
    row: Row<GradeTableRowData>,
    columnId: string,
    filterValue: any
) => {
    if (!filterValue || !Array.isArray(filterValue) || filterValue.length === 0) {
        return true;
    }
    const score = row.getValue(columnId) as number | null | undefined;
    if (score === null || score === undefined || isNaN(score)) {
        return false;
    }
    return filterValue.some(range => {
        switch (range) {
            case 'lt50': return score < 50;
            case '50to75': return score >= 50 && score <= 75;
            case 'gt75': return score > 75;
            default: return false;
        }
    });
};

// --- Fungsi Generate Kolom ---
export const generateGradeColumns = (
    assessmentComponents: AssessmentComponent[] | undefined | null,
    grades: GradesState, // State grades terbaru untuk sorting (jika diperlukan)
    onEditHeader: (component: AssessmentComponent) => void,
    onDeleteComponent: (componentId: string, componentName: string) => void,
    editingHeaderId: string | null,
    editingHeaderValues: { name: string; weight: string },
    handleHeaderEditChange: (field: 'name' | 'weight', value: string) => void,
    saveHeaderEdit: () => Promise<void>,
    cancelHeaderEdit: () => void,
    isHeaderEditingLoading: boolean,
    isAnyValueEditing: boolean // Status apakah ada baris/semua yang diedit
): ColumnDef<GradeTableRowData>[] => {

    const currentComponents = Array.isArray(assessmentComponents) ? assessmentComponents : [];

    // Fungsi sorting kustom untuk kolom nilai komponen (opsional, jika perlu)
    const componentColumnSortingFn: SortingFn<GradeTableRowData> = (rowA, rowB, columnId) => {
        // Ambil nilai dari state 'grades' yang ada di meta tabel saat sorting
        // (Perlu akses ke meta tabel di sini, atau state grades diteruskan)
        // Contoh jika grades diteruskan:
         const gradeA = grades[rowA.original.id]?.[columnId];
         const gradeB = grades[rowB.original.id]?.[columnId];
         const valA = gradeA === null || gradeA === undefined ? -Infinity : Number(gradeA);
         const valB = gradeB === null || gradeB === undefined ? -Infinity : Number(gradeB);
         return valA - valB;
         // Alternatif: const meta = header.getContext().table.options.meta as GradeTableMeta;
         // jika Anda melakukan sorting dari header context
    };

    const columns: ColumnDef<GradeTableRowData>[] = [
        // Kolom Checkbox
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Pilih semua baris"
                    // Disable checkbox jika sedang dalam mode edit apapun
                    disabled={isAnyValueEditing}
                />
            ),
            cell: ({ row, table }) => {
                 const meta = table.options.meta as GradeTableMeta;
                return (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Pilih baris"
                        // Disable checkbox jika sedang dalam mode edit apapun
                        disabled={meta.isEditingAll || !!meta.editingRowId}
                    />
                );
            },
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        // Kolom Nama Siswa
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Siswa" />,
            cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
            enableSorting: true,
            size: 180,
            enableColumnFilter: true,
            // Eksplisit gunakan filter yang sesuai untuk array (dari faceted)
            filterFn: 'arrIncludesSome',
        },
        // Kolom Kelas
        {
            id: 'class', // Eksplisit ID
            accessorKey: 'class',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kelas" />,
            cell: ({ row }) => <div>{row.getValue('class')}</div>,
            enableSorting: true,
            enableHiding: true,
            enableColumnFilter: true,
             // Eksplisit gunakan filter yang sesuai untuk array (dari faceted)
             filterFn: 'arrIncludesSome',
            size: 100,
        },
        // Kolom Komponen Penilaian Dinamis
        ...currentComponents.map<ColumnDef<GradeTableRowData>>(component => ({
            accessorKey: component.id, // Penting: accessorKey = component.id
            header: ({ header }: HeaderContext<GradeTableRowData, unknown>) => {
                 const isEditingThisHeader = editingHeaderId === component.id;
                return isEditingThisHeader ? (
                     <div className='space-y-1 py-1'>
                         <Input value={editingHeaderValues.name} onChange={(e) => handleHeaderEditChange('name', e.target.value)} className="h-7 text-xs" placeholder='Nama' disabled={isHeaderEditingLoading}/>
                         <div className='flex items-center justify-center gap-1'>
                             <span className="text-xs">Bobot:</span>
                             <Input type="number" min="0.01" step="any" value={editingHeaderValues.weight} onChange={(e) => handleHeaderEditChange('weight', e.target.value)} className="h-6 w-14 text-right text-xs" placeholder='%' disabled={isHeaderEditingLoading}/>
                             <span className="text-xs">%</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={saveHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Simpan Header">
                                 {isHeaderEditingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Batal Edit Header">
                                 <XCircle className="h-3 w-3" />
                            </Button>
                         </div>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center space-y-1">
                         <div className="flex items-center justify-center gap-1 flex-wrap">
                             <span className='font-semibold'>{component.name}</span>
                             {/* <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => onEditHeader(component)} aria-label={`Edit ${component.name}`} disabled={isAnyValueEditing}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => onDeleteComponent(component.id, component.name)} aria-label={`Hapus ${component.name}`} disabled={isAnyValueEditing}>
                                <Trash2 className="h-3 w-3" />
                            </Button> */}
                         </div>
                         <span className="block text-xs text-muted-foreground font-normal">(Bobot: {component.weight}%)</span>
                     </div>
                 );
            },
            cell: GradeCell, // Gunakan komponen GradeCell
            enableSorting: true,
            sortingFn: componentColumnSortingFn, // Gunakan fungsi sorting kustom
            size: 110,
        })),
        // Kolom Nilai Akhir
        {
            accessorKey: 'finalScore',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nilai Akhir" />,
            cell: ({ row }) => { const finalScore = row.getValue('finalScore') as number | null | undefined; const displayScore = (finalScore === null || finalScore === undefined || isNaN(finalScore)) ? '-' : finalScore.toFixed(1); return <div className="text-center font-bold">{displayScore}</div>; },
            enableSorting: true,
            enableColumnFilter: true, // Pastikan filter aktif
            filterFn: finalScoreRangeFilter, // Terapkan fungsi filter kustom
            size: 100,
        },
        // Kolom Aksi Baris
        {
            id: 'actions',
            header: () => <div className="text-center">Aksi</div>,
            cell: ({ row, table }) => {
                const meta = table.options.meta as GradeTableMeta;
                const isEditingThisRow = meta.editingRowId === row.original.id;
                const isSavingThisRow = meta.isSavingRow === row.original.id;

                return (
                    <div className="text-center">
                        {isEditingThisRow ? (
                            <div className='flex justify-center gap-0'>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => meta.handleSaveRow(row.original.id)} disabled={isSavingThisRow} aria-label="Simpan perubahan baris">
                                    {isSavingThisRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={() => meta.handleCancelRow(row.original.id)} disabled={isSavingThisRow} aria-label="Batal edit baris">
                                    <Ban className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                             // Tampilkan tombol Edit jika tidak sedang mengedit baris ini
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary"
                                // Disable jika: mode Edit All, ada baris lain diedit, atau baris ini TERPILIH
                                disabled={meta.isEditingAll || (!!meta.editingRowId && meta.editingRowId !== row.original.id) || row.getIsSelected()}
                                onClick={() => meta.handleEditRowTrigger(row.original.id)}
                                aria-label={`Edit nilai ${row.original.name}`}
                             >
                                 <Pencil className="h-4 w-4" />
                             </Button>
                        )}
                    </div>
                );
            },
            size: 80,
        },
    ];
    return columns;
};