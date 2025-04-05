// app/components/GradeEntryForm.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Save, XCircle, Loader2, Check, Ban, Edit } from 'lucide-react'; // Impor semua ikon yang dibutuhkan
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Asumsi Anda punya utilitas cn dari shadcn

// --- Tipe Data ---
interface Student { id: string; name: string; }
interface AssessmentComponent { id: string; name: string; weight: number; }
type GradesState = Record<string, Record<string, number | null>>;

interface GradeEntryFormProps {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    subjectName: string;
    initialGrades?: GradesState;
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    onDeleteComponent: (componentId: string, componentName: string) => void;
    subjectId: string;
    onUpdateComponent: (updatedComponent: AssessmentComponent) => void;
}

export function GradeEntryForm({
    students,
    assessmentComponents,
    subjectName,
    initialGrades = {},
    onSaveSingleGrade,
    onDeleteComponent,
    subjectId,
    onUpdateComponent,
}: GradeEntryFormProps) {
    // State untuk nilai saat ini
    const [grades, setGrades] = useState<GradesState>(initialGrades);

    // State Edit Header
    const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = useState(false);

    // State Mode Edit Nilai
    const [isEditingAll, setIsEditingAll] = useState(false);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false); // Loading untuk simpan nilai

    // Sinkronisasi initialGrades ke grades saat prop berubah
    useEffect(() => {
        setGrades(initialGrades);
        // Reset mode edit jika data awal berubah dari luar
        // setIsEditingAll(false);
        // setEditingRowId(null);
    }, [initialGrades]);

    // Handle Perubahan Nilai Input (Hanya update state lokal 'grades')
    const handleGradeChange = (studentId: string, componentId: string, value: string) => {
        const numericValue = value === '' ? null : Number(value);
        // Optional: Validasi langsung saat ketik, atau hanya saat save
        // if (value !== '' && (isNaN(numericValue!) || numericValue! < 0 || numericValue! > 100)) {
        //     return; // Atau beri style error
        // }
        setGrades((prevGrades) => ({
            ...prevGrades,
            [studentId]: { ...(prevGrades[studentId] || {}), [componentId]: numericValue },
        }));
    };

    // Kalkulasi Nilai Akhir
    const calculateFinalScore = useCallback((studentId: string): number | null => {
        let finalScore = 0;
        let totalWeightConsidered = 0;
        for (const component of assessmentComponents) {
            // Gunakan state 'grades' yang mungkin sedang diedit untuk kalkulasi real-time
            const score = grades[studentId]?.[component.id] ?? 0;
            const weight = component.weight;
            finalScore += (Number(score) * weight) / 100;
            totalWeightConsidered += weight;
        }
        return totalWeightConsidered > 0 ? finalScore : null;
    }, [grades, assessmentComponents]);

    // --- Fungsi Edit Inline Header ---
    const startHeaderEdit = (component: AssessmentComponent) => {
        setEditingHeaderId(component.id);
        setEditingHeaderValues({ name: component.name, weight: component.weight.toString() });
    };
    const cancelHeaderEdit = () => {
        setEditingHeaderId(null);
        setEditingHeaderValues({ name: '', weight: '' });
    };
    const handleHeaderEditChange = (field: 'name' | 'weight', value: string) => {
        setEditingHeaderValues(prev => ({ ...prev, [field]: value }));
    };
    const saveHeaderEdit = async () => {
        if (!editingHeaderId) return;
        const currentComponent = assessmentComponents.find(c => c.id === editingHeaderId);
        if (!currentComponent) return;

        const { name, weight } = editingHeaderValues;
        if (!name?.trim() || !weight?.trim()) { toast.error("Nama dan Bobot tidak boleh kosong."); return; }
        const weightValue = parseFloat(weight);
        if (isNaN(weightValue) || weightValue <= 0) { toast.error("Bobot harus angka positif."); return; }
        if (name.trim() === currentComponent.name && weightValue === currentComponent.weight) { cancelHeaderEdit(); return; }

        setIsHeaderEditingLoading(true);
        try {
            const response = await fetch(`/api/subjects/${subjectId}/components/${editingHeaderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), weight: weightValue }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal (${response.status})`);
            onUpdateComponent(result as AssessmentComponent); // Panggil callback parent
            cancelHeaderEdit();
        } catch (err) {
            console.error("[GradeEntryForm] Save header edit error:", err);
            toast.error(`Gagal simpan header: ${err instanceof Error ? err.message : 'Error'}`);
        } finally {
            setIsHeaderEditingLoading(false);
        }
    };

    // --- Fungsi Mode Edit Nilai ---
    const handleEditAll = () => { setIsEditingAll(true); setEditingRowId(null); };
    const handleEditRow = (studentId: string) => { setEditingRowId(studentId); setIsEditingAll(false); };
    const handleCancelEdit = () => {
        setGrades(initialGrades); // Reset ke nilai awal
        setIsEditingAll(false);
        setEditingRowId(null);
        setIsSaving(false);
    };

    // Menyimpan Perubahan Nilai
    const handleSaveChanges = async (studentIdToSave?: string) => {
        setIsSaving(true);
        const savePromises: Promise<void>[] = [];
        let changesCount = 0;
        let validationError = false;

        const studentsToProcess = studentIdToSave ? students.filter(s => s.id === studentIdToSave) : students;

        for (const student of studentsToProcess) {
            for (const component of assessmentComponents) {
                const currentGrade = grades[student.id]?.[component.id];
                const initialGrade = initialGrades[student.id]?.[component.id];
                const hasChanged = currentGrade !== initialGrade;

                if (hasChanged) {
                    // Validasi nilai sebelum dimasukkan ke promise
                    if (currentGrade !== null && (isNaN(currentGrade) || currentGrade < 0 || currentGrade > 100)) {
                        toast.error(`Nilai tidak valid (${currentGrade ?? 'N/A'}) untuk ${student.name} - ${component.name}. Perubahan dibatalkan.`);
                        validationError = true;
                        break; // Hentikan loop komponen untuk siswa ini
                    }
                    changesCount++;
                    savePromises.push(onSaveSingleGrade(student.id, component.id, currentGrade));
                }
            }
            if (validationError) break; // Hentikan loop siswa jika ada error validasi
        }

        if (validationError) {
            setIsSaving(false);
            return; // Jangan lanjutkan jika validasi gagal
        }

        if (changesCount === 0 && !studentIdToSave) { // Hanya tampilkan jika save all dan tidak ada perubahan
            toast.info("Tidak ada perubahan nilai untuk disimpan.");
            setIsSaving(false);
            setIsEditingAll(false); // Keluar mode edit jika tidak ada yg berubah
            setEditingRowId(null);
            return;
        }

        try {
            await Promise.all(savePromises);
            if (changesCount > 0) {
                toast.success(`${changesCount} perubahan nilai berhasil disimpan.`);
                // Idealnya, parent perlu tahu bahwa initialGrades perlu diupdate
                // Untuk sementara, 'cancel' akan revert ke initialGrades lama
            } else if (studentIdToSave) {
                 toast.info("Tidak ada perubahan pada baris ini.");
            }
        } catch (error) {
            console.error("Error saving grades:", error);
            toast.error("Gagal menyimpan beberapa nilai. Silakan cek kembali.");
        } finally {
            setIsSaving(false);
            setIsEditingAll(false);
            setEditingRowId(null);
        }
    };

    // Helper cek edit cell
    const isCellEditable = (studentId: string) => isEditingAll || editingRowId === studentId;

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                        <CardTitle>Input Nilai Siswa</CardTitle>
                        <CardDescription>Mata Pelajaran: {subjectName}</CardDescription>
                    </div>
                    {!isEditingAll && !editingRowId && (
                        <Button onClick={handleEditAll} variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" /> Edit Semua Nilai
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto relative border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-20 backdrop-blur-sm">
                            <TableRow>
                                <TableHead className="w-[70px] sticky left-0 bg-muted/50 z-10 text-center">Aksi</TableHead>
                                <TableHead className="min-w-[180px] sticky left-[70px] bg-muted/50 z-10">Nama Siswa</TableHead>
                                {assessmentComponents.map((component) => (
                                    <TableHead key={component.id} className="text-center min-w-[200px] px-2">
                                        {editingHeaderId === component.id ? (
                                            <div className='space-y-1 py-1'>
                                                <Input value={editingHeaderValues.name} onChange={(e) => handleHeaderEditChange('name', e.target.value)} className="h-7 text-xs" placeholder='Nama' disabled={isHeaderEditingLoading}/>
                                                <div className='flex items-center justify-center gap-1'>
                                                    <span className="text-xs">Bobot:</span>
                                                    <Input type="number" min="0.01" step="any" value={editingHeaderValues.weight} onChange={(e) => handleHeaderEditChange('weight', e.target.value)} className="h-6 w-14 text-right text-xs" placeholder='%' disabled={isHeaderEditingLoading}/>
                                                    <span className="text-xs">%</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={saveHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Simpan"><Save className="h-3 w-3" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelHeaderEdit} disabled={isHeaderEditingLoading} aria-label="Batal"><XCircle className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1 flex-wrap">
                                                <span className='font-semibold'>{component.name}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => startHeaderEdit(component)} aria-label={`Edit ${component.name}`} disabled={isEditingAll || !!editingRowId}><Pencil className="h-3 w-3" /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => onDeleteComponent(component.id, component.name)} aria-label={`Hapus ${component.name}`} disabled={isEditingAll || !!editingRowId}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                        )}
                                        {editingHeaderId !== component.id && <span className="block text-xs text-muted-foreground font-normal mt-1">(Bobot: {component.weight}%)</span>}
                                    </TableHead>
                                ))}
                                <TableHead className="text-center font-semibold sticky right-0 bg-muted/50 z-10 min-w-[100px]">Nilai Akhir</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length === 0 && ( <TableRow><TableCell colSpan={assessmentComponents.length + 3} className="text-center text-muted-foreground">Belum ada data siswa.</TableCell></TableRow> )}
                            {students.map((student) => {
                                const finalScore = calculateFinalScore(student.id);
                                const isCurrentRowEditing = editingRowId === student.id;
                                const editable = isCellEditable(student.id);

                                return (
                                    <TableRow key={student.id} className={cn(isCurrentRowEditing && 'bg-secondary/50')}>
                                        <TableCell className="sticky left-0 bg-card z-10 px-1 text-center">
                                            {editable ? (
                                                 isCurrentRowEditing && (
                                                     <div className='flex justify-center gap-0'>
                                                         <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => handleSaveChanges(student.id)} disabled={isSaving} aria-label="Simpan baris">
                                                             {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Check className="h-4 w-4" />}
                                                         </Button>
                                                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-secondary" onClick={handleCancelEdit} disabled={isSaving} aria-label="Batal baris">
                                                             <Ban className="h-4 w-4" />
                                                         </Button>
                                                     </div>
                                                 )
                                            ) : (
                                                 <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-secondary" onClick={() => handleEditRow(student.id)} disabled={isEditingAll} aria-label={`Edit nilai ${student.name}`}>
                                                     <Pencil className="h-4 w-4" />
                                                 </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium sticky left-[70px] bg-card z-10">{student.name}</TableCell>
                                        {assessmentComponents.map((component) => (
                                            <TableCell key={component.id} className="text-center px-1 py-1">
                                                {editable ? (
                                                    <Input
                                                        id={`${student.id}-${component.id}`}
                                                        type="number" step="any" min="0" max="100" placeholder="0-100"
                                                        value={grades[student.id]?.[component.id]?.toString() ?? ''}
                                                        onChange={(e) => handleGradeChange(student.id, component.id, e.target.value)}
                                                        className="max-w-[70px] min-w-[60px] mx-auto text-center h-8 text-sm"
                                                        disabled={isSaving} // Nonaktifkan saat menyimpan
                                                    />
                                                ) : (
                                                     <span className="text-sm px-2">{grades[student.id]?.[component.id]?.toString() ?? '-'}</span>
                                                )}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-center font-bold sticky right-0 bg-card z-10">
                                             {finalScore !== null ? finalScore.toFixed(1) : '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             {(isEditingAll) && (
                <CardFooter className="flex justify-end gap-2 pt-4 border-t">
                     <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                         <Ban className="mr-2 h-4 w-4"/> Batal Semua
                     </Button>
                     <Button onClick={() => handleSaveChanges()} disabled={isSaving}>
                         {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Simpan Semua Perubahan
                     </Button>
                </CardFooter>
             )}
        </Card>
    );
}