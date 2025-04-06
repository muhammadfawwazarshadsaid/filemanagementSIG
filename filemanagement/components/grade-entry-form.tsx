// app/components/GradeEntryForm.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Save, XCircle, Loader2 } from 'lucide-react'; // Impor ikon baru
import { toast } from "sonner"; // Untuk notifikasi

// --- Tipe Data ---
interface Student { id: string; name: string; }
interface AssessmentComponent { id: string; name: string; weight: number; }
type GradesState = Record<string, Record<string, number | null>>;

// !! Props Ditambah
interface GradeEntryFormProps {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    subjectName: string;
    initialGrades?: GradesState;
    onSaveSingleGrade: (studentId: string, componentId: string, score: number | null) => Promise<void>;
    debounceWait?: number;
    onDeleteComponent: (componentId: string, componentName: string) => void; // Tetap ada untuk tombol delete
    subjectId: string; // Diperlukan untuk API call edit komponen
    onUpdateComponent: (updatedComponent: AssessmentComponent) => void; // Callback setelah edit sukses
}

export function GradeEntryForm({
    students,
    assessmentComponents,
    subjectName,
    initialGrades = {},
    onSaveSingleGrade,
    debounceWait = 750,
    onDeleteComponent,
    subjectId, // Terima prop subjectId
    onUpdateComponent, // Terima prop onUpdateComponent
}: GradeEntryFormProps) {
    const [grades, setGrades] = useState<GradesState>(initialGrades);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // !! State BARU untuk Edit Inline Header
    const [editingHeaderId, setEditingHeaderId] = useState<string | null>(null);
    const [editingHeaderValues, setEditingHeaderValues] = useState<{ name: string; weight: string }>({ name: '', weight: '' });
    const [isHeaderEditingLoading, setIsHeaderEditingLoading] = useState(false);
    
    // Sinkronisasi initialGrades
    useEffect(() => {
        setGrades(initialGrades);
    }, [initialGrades]);

    // Logika Simpan Otomatis (Debounce)
    const saveSingleGrade = useCallback(async (studentId: string, componentId: string, score: number | null) => {
        setSaveStatus('saving');
        setErrorMessage(null);
        try {
            await onSaveSingleGrade(studentId, componentId, score);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 1500);
        } catch (err) {
            console.error('Autosave failed:', err);
            setSaveStatus('error');
            setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan.');
        }
    }, [onSaveSingleGrade]);

    const debouncedSave = useMemo(() => debounce(saveSingleGrade, debounceWait), [saveSingleGrade, debounceWait]);

    // Handle Perubahan Nilai Input
    const handleGradeChange = (studentId: string, componentId: string, value: string) => {
        const numericValue = value === '' ? null : Number(value);
        if (value !== '' && (isNaN(numericValue!) || numericValue! < 0 || numericValue! > 100)) { // Validasi 0-100
             toast.warning("Nilai harus antara 0 dan 100."); // Beri peringatan
            return;
        }

        setGrades((prevGrades) => ({
            ...prevGrades,
            [studentId]: { ...(prevGrades[studentId] || {}), [componentId]: numericValue },
        }));

        if(saveStatus === 'error') { setErrorMessage(null); }
        setSaveStatus('idle');
        debouncedSave(studentId, componentId, numericValue);
    };

    useEffect(() => () => debouncedSave.cancel(), [debouncedSave]); // Cleanup debounce

    // Kalkulasi Nilai Akhir
    const calculateFinalScore = useCallback((studentId: string): number | null => {
        let finalScore = 0;
        let totalWeightConsidered = 0;
        for (const component of assessmentComponents) {
            const score = grades[studentId]?.[component.id] ?? 0; // Anggap null/kosong = 0
            const weight = component.weight;
            finalScore += (Number(score) * weight) / 100;
            totalWeightConsidered += weight;
        }
        return totalWeightConsidered > 0 ? finalScore : null; // Hanya tampilkan jika ada bobot
    }, [grades, assessmentComponents]);


    // --- Fungsi untuk Edit Inline Header ---
    // const startHeaderEdit = (component: AssessmentComponent) => {
    //     setEditingHeaderId(component.id);
    //     setEditingHeaderValues({ name: component.name, weight: component.weight.toString() });
    // };

    // const cancelHeaderEdit = () => {
    //     setEditingHeaderId(null);
    //     setEditingHeaderValues({ name: '', weight: '' });
    // };

    // const handleHeaderEditChange = (field: 'name' | 'weight', value: string) => {
    //     setEditingHeaderValues(prev => ({ ...prev, [field]: value }));
    // };

    // const saveHeaderEdit = async () => {
    //     if (!editingHeaderId) return;

    //     const currentComponent = assessmentComponents.find(c => c.id === editingHeaderId);
    //     if (!currentComponent) return;

    //     const { name, weight } = editingHeaderValues;
    //     if (!name?.trim() || !weight?.trim()) {
    //         toast.error("Nama dan Bobot komponen tidak boleh kosong.");
    //         return;
    //     }
    //     const weightValue = parseFloat(weight);
    //     if (isNaN(weightValue) || weightValue <= 0) {
    //         toast.error("Bobot harus angka positif.");
    //         return;
    //     }

    //     // Cek jika tidak ada perubahan
    //     if (name.trim() === currentComponent.name && weightValue === currentComponent.weight) {
    //         cancelHeaderEdit();
    //         return;
    //     }

    //     setIsHeaderEditingLoading(true);
    //     try {
    //         const response = await fetch(`/api/subjects/${subjectId}/components/${editingHeaderId}`, {
    //             method: 'PUT',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ name: name.trim(), weight: weightValue }),
    //         });
    //         const result = await response.json();
    //         if (!response.ok) throw new Error(result.message || `Gagal mengubah (${response.status})`);

    //         // Panggil callback ke parent untuk update state global
    //         onUpdateComponent(result as AssessmentComponent);

    //         cancelHeaderEdit(); // Keluar dari mode edit
    //         // Notifikasi sukses sudah ditangani di parent (handleUpdateComponent)

    //     } catch (err) {
    //         console.error("[GradeEntryForm] Save header edit error:", err);
    //         toast.error(`Gagal menyimpan perubahan: ${err instanceof Error ? err.message : 'Error'}`);
    //     } finally {
    //         setIsHeaderEditingLoading(false);
    //     }
    // };


    // Render Status Simpan
     const renderSaveStatus = () => {
        switch (saveStatus) {
            case 'saving': return <span className="text-sm text-muted-foreground italic">Menyimpan...</span>;
            case 'saved': return <span className="text-sm text-green-600">✓ Tersimpan</span>;
            case 'error': return <span className="text-sm text-red-600">⚠️ Error: {errorMessage}</span>;
            case 'idle': default: return <span className="text-sm text-muted-foreground h-5"></span>; // Placeholder space
        }
     };
    
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Input Nilai Siswa</CardTitle>
                <CardDescription>Mata Pelajaran: {subjectName}</CardDescription>
                <div className="mt-1 h-5">{renderSaveStatus()}</div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto relative border rounded-md">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 z-20 backdrop-blur-sm">
                            <TableRow>
                                <TableHead className="min-w-[180px] sticky left-0 bg-muted/50 z-10">Nama Siswa</TableHead>
                                {assessmentComponents.map((component) => (
                                    <TableHead key={component.id} className="text-center min-w-[250px] px-2"> {/* Lebarkan sedikit untuk input */}
                                            // --- Mode Tampil Header ---
                                            <div className="flex items-center justify-center gap-1 flex-wrap">
                                                <span className='font-semibold'>{component.name}</span>
                                            </div>
                                            <span className="block text-xs text-muted-foreground font-normal mt-1">
                                                (Bobot: {component.weight}%)
                                            </span>
                                    </TableHead>
                                ))}
                                <TableHead className="text-center font-semibold sticky right-0 bg-muted/50 z-10 min-w-[100px]">Nilai Akhir</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* ... (Render Baris Siswa - sama seperti sebelumnya) ... */}
                             {students.length === 0 && ( <TableRow><TableCell colSpan={assessmentComponents.length + 2} className="text-center text-muted-foreground">Belum ada data siswa.</TableCell></TableRow> )}
                            {students.map((student) => {
                                const finalScore = calculateFinalScore(student.id);
                                return (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium sticky left-0 bg-card z-10">{student.name}</TableCell>
                                        {assessmentComponents.map((component) => (
                                            <TableCell key={component.id} className="text-center px-2 py-1">
                                                <Input id={`${student.id}-${component.id}`} type="number" step="any" min="0" max="100" placeholder="0-100" value={grades[student.id]?.[component.id]?.toString() ?? ''} onChange={(e) => handleGradeChange(student.id, component.id, e.target.value)} className="max-w-[80px] mx-auto text-center h-8"/>
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
        </Card>
    );
}