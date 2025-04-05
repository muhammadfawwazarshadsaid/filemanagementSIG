// app/guru/input-nilai/[subjectId]/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
    DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, PlusCircle, Scale, Trash2, Settings, Save, Pencil, XCircle, Download, Sigma } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Impor jsPDF dan autoTable
import jsPDF from 'jspdf';
import autoTable, { UserOptions, CellDef, RowInput, HAlignType, FontStyle } from 'jspdf-autotable';
import { currentTeacher } from '@/app/api/subjects/dummy';
import { GradeEntryDataTable } from '@/components/grade-entry/grade-entry-data-table';


// --- Tipe Data --- (Pastikan definisi ini konsisten dengan schema.ts Anda)
interface Student { id: string; name: string; class: string; }
interface AssessmentComponent { id: string; name: string; weight: number; }
type GradesState = Record<string, Record<string, number | null>>;
interface GradeData {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    subjectName: string;
    initialGrades: GradesState;
    academicYear: string; // Tahun Ajaran
}
interface DeleteDialogState { isOpen: boolean; componentId: string | null; componentName: string | null; isLoading: boolean; error?: string | null; }
type PdfOrientation = 'p' | 'l';
type PdfPaperSize = 'a4' | 'letter' | 'legal';

// --- Komponen Halaman ---
export default function InputNilaiPage() {
    const params = useParams();
    const subjectId = params.subjectId as string; // ID unik kelas, e.g., "mtk-2425"

    // --- State Utama ---
    const [gradeData, setGradeData] = useState<GradeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- State Dialog Atur Komponen ---
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [editableComponents, setEditableComponents] = useState<AssessmentComponent[]>([]);
    const [dialogNewComponentName, setDialogNewComponentName] = useState('');
    const [dialogNewComponentWeight, setDialogNewComponentWeight] = useState('');
    const [isDialogLoading, setIsDialogLoading] = useState(false); // Loading khusus dialog komponen
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [editingComponentId, setEditingComponentId] = useState<string | null>(null); // ID komponen yg diedit inline di dialog
    const [editingValues, setEditingValues] = useState<{ name: string; weight: string }>({ name: '', weight: '' }); // Nilai yg diedit inline di dialog
    const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({ isOpen: false, componentId: null, componentName: null, isLoading: false });

    // --- State Dialog Opsi & Preview PDF ---
    const [isPdfOptionsDialogOpen, setIsPdfOptionsDialogOpen] = useState(false);
    const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>('p');
    const [pdfPaperSize, setPdfPaperSize] = useState<PdfPaperSize>('a4');
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // --- Fetch Data Awal ---
    const fetchInitialData = useCallback(async () => {
        if (!subjectId) return; setIsLoading(true); setError(null);
        try {
            const response = await fetch(`/api/subjects/${subjectId}/gradedata`);
            if (!response.ok) { let errData; try { errData = await response.json(); } catch {} throw new Error(errData?.message || `Error ${response.status}`); }
            const data: GradeData = await response.json();
            data.students.sort((a, b) => a.name.localeCompare(b.name)); // Sortir siswa by name
            setGradeData(data);
            setEditableComponents(data.assessmentComponents); // Init state dialog komponen
             console.log("[page.tsx] Fetched Initial Data:", data); // Debugging fetch
        } catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat data"); setGradeData(null); setEditableComponents([]); }
        finally { setIsLoading(false); }
    }, [subjectId]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    // --- Callback Simpan Satu Nilai (Untuk DataTable) ---
    const handleSaveSingleGradeClient = useCallback(async (studentId: string, componentId: string, score: number | null): Promise<void> => {
        if (!subjectId) { throw new Error("ID Mata Pelajaran tidak valid."); }
        try {
             console.log(`[page.tsx Save] Sending: St:${studentId} Comp:${componentId} Score:${score} Subj:${subjectId}`);
            const response = await fetch(`/api/subjects/${subjectId}/gradedata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, componentId, score }),
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || `Gagal menyimpan (${response.status})`); }
            // Update initialGrades di state utama setelah sukses
            setGradeData(prevData => {
                if (!prevData) return null;
                const newInitialGrades = structuredClone(prevData.initialGrades); // Selalu deep clone
                if (!newInitialGrades[studentId]) newInitialGrades[studentId] = {};
                newInitialGrades[studentId][componentId] = score;
                 console.log(`[page.tsx Save] Successfully updated initialGrades for ${studentId}. New state:`, newInitialGrades);
                // Kembalikan objek state BARU agar React tahu ada perubahan
                return {
                    ...prevData,
                    initialGrades: newInitialGrades
                };
            });
        } catch (err) {
            console.error('[page.tsx Client Save] Error:', err);
            throw err; // Re-throw agar DataTable bisa handle error (misal via toast)
        }
    }, [subjectId]);

    // --- Callback Update Komponen (Untuk DataTable dari edit header) ---
    const handleUpdateComponent = useCallback(async (updatedComponent: AssessmentComponent): Promise<void> => {
         console.log("[page.tsx UpdateComp] Updating component:", updatedComponent);
        setGradeData(prevData => {
            if (!prevData) return null;
            const updatedComponents = prevData.assessmentComponents.map(c =>
                c.id === updatedComponent.id ? updatedComponent : c
            );
            setEditableComponents(updatedComponents); // Jaga konsistensi state dialog
            return { ...prevData, assessmentComponents: updatedComponents };
        });
    }, []);

    // --- Fungsi Terkait Dialog "Atur Komponen" ---
    const openManageDialog = () => { if (gradeData) { setEditableComponents(JSON.parse(JSON.stringify(gradeData.assessmentComponents))); setDialogError(null); setDialogNewComponentName(''); setDialogNewComponentWeight(''); setEditingComponentId(null); } setIsManageDialogOpen(true); };
    const handleInlineEditChange = (field: 'name' | 'weight', value: string) => setEditingValues(prev => ({ ...prev, [field]: value }));
    const startInlineEdit = (component: AssessmentComponent) => { setEditingComponentId(component.id); setEditingValues({ name: component.name, weight: component.weight.toString() }); setDialogError(null); };
    const cancelInlineEdit = () => { setEditingComponentId(null); setEditingValues({ name: '', weight: '' }); setDialogError(null); };
    const saveInlineEdit = async () => { if (!editingComponentId || !subjectId) return; const currentComponent = editableComponents.find(c => c.id === editingComponentId); if (!currentComponent) return; const { name, weight } = editingValues; if (!name?.trim() || !weight?.trim()) { setDialogError("Nama/Bobot kosong."); return; } const weightValue = parseFloat(weight); if (isNaN(weightValue) || weightValue <= 0) { setDialogError("Bobot > 0."); return; } if (name.trim() === currentComponent.name && weightValue === currentComponent.weight) { cancelInlineEdit(); return; } setIsDialogLoading(true); setDialogError(null); try { const response = await fetch(`/api/subjects/${subjectId}/components/${editingComponentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), weight: weightValue }), }); const result = await response.json(); if (!response.ok) throw new Error(result.message || `Gagal (${response.status})`); await handleUpdateComponent(result as AssessmentComponent); cancelInlineEdit(); toast.success(`Komponen "${result.name}" diubah.`); } catch (err) { console.error("[Dialog] Edit component error:", err); const msg = err instanceof Error ? err.message : "Gagal ubah"; setDialogError(msg); toast.error(msg); } finally { setIsDialogLoading(false); } };
    const handleDialogAddComponent = async () => { if (!dialogNewComponentName.trim() || !dialogNewComponentWeight.trim()) { setDialogError("Nama/Bobot baru kosong."); return; } const weightValue = parseFloat(dialogNewComponentWeight); if (isNaN(weightValue) || weightValue <= 0) { setDialogError("Bobot baru > 0."); return; } setIsDialogLoading(true); setDialogError(null); try { const response = await fetch(`/api/subjects/${subjectId}/components`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: dialogNewComponentName.trim(), weight: weightValue }), }); const result = await response.json(); if (!response.ok) throw new Error(result.message || `Gagal (${response.status})`); const newComponent: AssessmentComponent = result; setGradeData(prevData => { if (!prevData) return null; const updatedComponents = [...prevData.assessmentComponents, newComponent]; const updatedGrades = structuredClone(prevData.initialGrades); Object.keys(updatedGrades).forEach(studentId => { updatedGrades[studentId] = { ...updatedGrades[studentId], [newComponent.id]: null }; }); setEditableComponents(updatedComponents); return { ...prevData, assessmentComponents: updatedComponents, initialGrades: updatedGrades }; }); setDialogNewComponentName(''); setDialogNewComponentWeight(''); toast.success(`Komponen "${newComponent.name}" ditambah.`); } catch (err) { console.error("[Dialog] Add component error:", err); const msg = err instanceof Error ? err.message : "Gagal tambah"; setDialogError(msg); toast.error(msg); } finally { setIsDialogLoading(false); } };
    const handleDialogDeleteComponent = (componentId: string, componentName: string) => setDeleteDialogState({ isOpen: true, componentId, componentName, isLoading: false });
    const confirmDeleteComponent = async () => { if (!deleteDialogState.componentId || !subjectId) return; setDeleteDialogState(prev => ({ ...prev, isLoading: true, error: null })); try { const response = await fetch(`/api/subjects/${subjectId}/components/${deleteDialogState.componentId}`, { method: 'DELETE' }); const result = await response.json(); if (!response.ok) throw new Error(result.message || `Gagal (${response.status})`); const deletedId = deleteDialogState.componentId; const deletedName = deleteDialogState.componentName; setGradeData(prevData => { if (!prevData) return null; const updatedComponents = prevData.assessmentComponents.filter(c => c.id !== deletedId); const updatedGrades = structuredClone(prevData.initialGrades); Object.keys(updatedGrades).forEach(studentId => { if (updatedGrades[studentId]?.[deletedId] !== undefined) { delete updatedGrades[studentId][deletedId]; } }); setEditableComponents(updatedComponents); return { ...prevData, assessmentComponents: updatedComponents, initialGrades: updatedGrades }; }); closeDeleteDialog(); toast.success(`Komponen "${deletedName}" dihapus.`); } catch (err) { console.error("[Dialog] Delete component error:", err); const msg = err instanceof Error ? err.message : "Gagal hapus"; setDeleteDialogState(prev => ({ ...prev, isLoading: false, error: msg })); toast.error(msg); } };
    const closeDeleteDialog = () => setDeleteDialogState({ isOpen: false, componentId: null, componentName: null, isLoading: false });

    // Hitung Total Bobot & Rata-rata
    const totalWeight = useMemo(() => { if (!gradeData || !Array.isArray(gradeData.assessmentComponents)) return 0; return gradeData.assessmentComponents.reduce((sum, comp) => sum + (Number(comp?.weight) || 0), 0); }, [gradeData]);
    const dialogTotalWeight = useMemo(() => { if (!Array.isArray(editableComponents)) return 0; return editableComponents.reduce((sum, comp) => sum + (Number(comp?.id === editingComponentId ? editingValues.weight : comp?.weight) || 0), 0); }, [editableComponents, editingComponentId, editingValues]);
    const overallAverageScore = useMemo(() => { if (!gradeData || !Array.isArray(gradeData.students) || gradeData.students.length === 0 || !Array.isArray(gradeData.assessmentComponents)) return null; const { students, initialGrades, assessmentComponents } = gradeData; let totalFinalScoreSum = 0; let validStudentCount = 0; students.forEach(student => { let studentScoreSum = 0; let studentWeightSum = 0; assessmentComponents.forEach(comp => { const score = initialGrades[student.id]?.[comp.id]; if (typeof score === 'number' && !isNaN(score) && comp.weight > 0) { studentScoreSum += (score * comp.weight); studentWeightSum += comp.weight; } }); if (studentWeightSum > 0) { const finalScore = studentScoreSum / studentWeightSum; if (!isNaN(finalScore)) { totalFinalScoreSum += finalScore; validStudentCount++; } } }); return validStudentCount > 0 ? (totalFinalScoreSum / validStudentCount) : null; }, [gradeData]);

    // --- Fungsi PDF ---
     const generatePdfDocument = useCallback((orientation: PdfOrientation, paperSize: PdfPaperSize): jsPDF | null => { if (!gradeData) return null; const { subjectName, assessmentComponents, students, initialGrades, academicYear } = gradeData; const location = "Slawi"; const signDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); const generatedDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); const doc = new jsPDF({ orientation: orientation, unit: 'mm', format: paperSize }) as jsPDF & { autoTable: (options: UserOptions) => jsPDF }; doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text(`Rekap Nilai - ${subjectName}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' }); doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text(`Tahun Ajaran: ${academicYear}`, doc.internal.pageSize.getWidth() / 2, 21, { align: 'center' }); doc.setFontSize(9); doc.setTextColor(100); doc.text(`Tanggal Cetak: ${generatedDate}`, 14, 27); const head: CellDef[][] = [[ { content: 'No', styles: { halign: 'center' as const, fontStyle: 'bold' as const } }, { content: 'Nama Siswa', styles: { fontStyle: 'bold' as const } }, { content: 'Kelas', styles: { fontStyle: 'bold' as const, halign: 'center' as const } }, ...assessmentComponents.map(comp => ({ content: `${comp.name}\n(${comp.weight}%)`, styles: { halign: 'center' as const, fontStyle: 'bold' as const } })), { content: 'Nilai Akhir', styles: { halign: 'center' as const, fontStyle: 'bold' as const } } ]]; const body: RowInput[] = students.map((student, index) => { let finalScoreNum = 0; let weightSum = 0; assessmentComponents.forEach(comp => { const score = initialGrades[student.id]?.[comp.id] ?? 0; if (typeof score === 'number' && !isNaN(score)) { finalScoreNum += (score * comp.weight); weightSum += comp.weight; } }); const finalScore = weightSum > 0 ? (finalScoreNum / weightSum).toFixed(1) : '-'; return [ { content: index + 1, styles: { halign: 'center' as const } }, student.name, { content: student.class, styles: { halign: 'center' as const } }, ...assessmentComponents.map(comp => ({ content: initialGrades[student.id]?.[comp.id]?.toString() ?? '-', styles: { halign: 'center' as const } })), { content: finalScore, styles: { halign: 'center' as const, fontStyle: 'bold' as const } } ]; }); const numComponentCols = assessmentComponents.length; const fixedWidths = (orientation === 'l' ? 8 : 10) + 15 + (orientation === 'l' ? 16 : 18); const nameWidth = 60; const availableWidth = doc.internal.pageSize.getWidth() - 28 - fixedWidths - nameWidth; const componentColWidth = numComponentCols > 0 ? Math.max(15, availableWidth / numComponentCols) : 20; let lastY = 30; autoTable(doc, { head: head, body: body, startY: lastY + 5, theme: 'grid', headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' as FontStyle, halign: 'center' as HAlignType, fontSize: 9 }, styles: { fontSize: 8.5, cellPadding: 2, overflow: 'linebreak' }, columnStyles: { 0: { cellWidth: orientation === 'l' ? 8 : 10, halign: 'center' as HAlignType }, 1: { cellWidth: nameWidth }, 2: { cellWidth: 15, halign: 'center' as HAlignType }, ...assessmentComponents.reduce((acc, comp, idx) => { acc[idx + 3] = { cellWidth: componentColWidth, halign: 'center' as HAlignType }; return acc; }, {} as { [key: number]: { cellWidth?: number; halign?: HAlignType } }), [head[0].length - 1]: { cellWidth: orientation === 'l' ? 16 : 18, halign: 'center' as HAlignType, fontStyle: 'bold' as FontStyle }, }, didDrawPage: (data) => { doc.setFontSize(8); doc.setTextColor(150); const pageCount = (doc.internal as any).pages.length ? (doc.internal as any).pages.length -1 : doc.getNumberOfPages(); doc.text('Halaman ' + data.pageNumber + ' dari ' + pageCount, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10); } }); const finalY = (doc as any).lastAutoTable.finalY || 35; const signatureYStart = finalY + 15; const pageWidth = doc.internal.pageSize.getWidth(); const marginRight = 14; const signatureX = pageWidth - marginRight; doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0); doc.text(`${location}, ${signDate}`, signatureX, signatureYStart, { align: 'right' }); doc.text('Guru Mata Pelajaran,', signatureX, signatureYStart + 5, { align: 'right' }); const signatureSpaceY = signatureYStart + 25; doc.setFont("helvetica", "bold"); doc.text(currentTeacher.name, signatureX, signatureSpaceY, { align: 'right' }); doc.setFont("helvetica", "normal"); doc.text(`NIP. ${currentTeacher.nip}`, signatureX, signatureSpaceY + 5, { align: 'right' }); return doc; }, [gradeData]);
    const handleGeneratePreview = useCallback(async () => { /* ... (sama) ... */ if (!gradeData || !isPdfOptionsDialogOpen) { setPdfPreviewUrl(null); return; } setIsPreviewLoading(true); setPdfPreviewUrl(null); await new Promise(resolve => setTimeout(resolve, 100)); try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { setPdfPreviewUrl(doc.output('datauristring')); } else { throw new Error("Gagal buat dokumen PDF."); } } catch (pdfError) { console.error("[PDF Preview] Error:", pdfError); toast.error("Gagal buat pratinjau."); setPdfPreviewUrl(null); } finally { setIsPreviewLoading(false); } }, [gradeData, pdfOrientation, pdfPaperSize, generatePdfDocument, isPdfOptionsDialogOpen]);
    useEffect(() => { if (isPdfOptionsDialogOpen) { handleGeneratePreview(); } else { setPdfPreviewUrl(null); } }, [pdfOrientation, pdfPaperSize, isPdfOptionsDialogOpen, handleGeneratePreview]);
    const handleActualDownload = useCallback(() => { /* ... (sama) ... */ if (!gradeData) { toast.error("Data belum dimuat."); return; } setIsDownloadingPdf(true); setTimeout(() => { try { const doc = generatePdfDocument(pdfOrientation, pdfPaperSize); if (doc) { const { subjectName } = gradeData; const safeSubjectName = subjectName.replace(/[^a-zA-Z0-9]/g, '_'); const timestamp = new Date().toISOString().slice(0,10); const fileName = `Rekap_Nilai_${safeSubjectName}_${timestamp}_${pdfOrientation}_${pdfPaperSize}.pdf`; doc.save(fileName); toast.success("Unduhan PDF dimulai..."); setIsPdfOptionsDialogOpen(false); } else { throw new Error("Gagal buat dokumen PDF."); } } catch (pdfError) { console.error("[PDF Download] Error:", pdfError); toast.error("Gagal mengunduh PDF."); } finally { setIsDownloadingPdf(false); } }, 50); }, [gradeData, pdfOrientation, pdfPaperSize, generatePdfDocument]);

    // --- Render Logic ---
    if (isLoading) return <div className="container mx-auto p-4 text-center"><Loader2 className="inline-block animate-spin mr-2" /> Memuat data nilai...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-600 text-center">Error memuat data: {error}</div>;
    if (!gradeData) return <div className="container mx-auto p-4 text-center text-muted-foreground">Data nilai tidak tersedia atau tidak ditemukan untuk ID: {subjectId}.</div>;

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Header Halaman */}
            <div className="flex justify-between items-start mb-3 flex-wrap gap-x-6 gap-y-3 p-4">
                {/* Info Kiri */}
                <div className='space-y-1'>
                     <h2 className="text-xl font-semibold">{gradeData.subjectName}</h2>
                     <p className="text-sm text-muted-foreground">Tahun Ajaran: {gradeData.academicYear}</p>
                     <div className={`text-sm font-medium flex items-center gap-1 ${totalWeight !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}> <Scale className="h-4 w-4" /> Total Bobot: {totalWeight.toFixed(2)}% {totalWeight !== 100 && <span className="font-semibold">(Tidak 100%)</span>} </div>
                     <div className="text-sm font-medium flex items-center gap-1 text-muted-foreground"> <Sigma className="h-4 w-4" /> Rata-rata Keseluruhan: {overallAverageScore !== null ? overallAverageScore.toFixed(1) : '-'} </div>
                </div>
                {/* Tombol Aksi Kanan */}
                <div className='flex items-center gap-2 flex-shrink-0 self-start pt-1'>
                    {/* Dialog Atur Komponen */}
                    <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                        <DialogTrigger asChild><Button variant="outline" size="sm" onClick={openManageDialog}> <Settings className="mr-2 h-4 w-4" /> Atur Komponen </Button></DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">{/* ... Konten Dialog Atur Komponen ... */}<DialogHeader> <DialogTitle>Atur Komponen Penilaian</DialogTitle> <DialogDescription>Tambah, hapus, atau ubah komponen penilaian.</DialogDescription> <div className={`pt-1 text-sm font-medium flex items-center gap-1 ${dialogTotalWeight !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}><Scale className="h-4 w-4" />Total Bobot (Dialog): {dialogTotalWeight.toFixed(2)}% {dialogTotalWeight !== 100 ? '(Tidak 100%)' : ''}</div> </DialogHeader><div className="max-h-[40vh] overflow-y-auto my-4 pr-2 border rounded-md"><Table><TableHeader><TableRow><TableHead>Nama</TableHead><TableHead className="w-[100px] text-right">Bobot (%)</TableHead><TableHead className="w-[120px] text-center">Aksi</TableHead></TableRow></TableHeader><TableBody>{editableComponents.map(comp => (<TableRow key={comp.id}>{editingComponentId === comp.id ? (<><TableCell className="py-1 px-2"><Input value={editingValues.name} onChange={(e) => handleInlineEditChange('name', e.target.value)} className="h-8 text-sm" disabled={isDialogLoading}/></TableCell><TableCell className="py-1 px-2"><Input type="number" value={editingValues.weight} onChange={(e) => handleInlineEditChange('weight', e.target.value)} className="h-8 text-sm text-right w-[80px]" disabled={isDialogLoading}/></TableCell><TableCell className="text-center py-1 px-1"><div className="flex justify-center gap-0"><Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={saveInlineEdit} disabled={isDialogLoading}>{isDialogLoading ? <Loader2 className='h-4 w-4 animate-spin'/> : <Save className="h-4 w-4"/>}</Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelInlineEdit} disabled={isDialogLoading}><XCircle className="h-4 w-4"/></Button></div></TableCell></>) : (<><TableCell>{comp.name}</TableCell><TableCell className="text-right">{comp.weight}</TableCell><TableCell className="text-center"><div className="flex justify-center gap-0"><Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600 hover:bg-blue-100" onClick={() => startInlineEdit(comp)} disabled={isDialogLoading}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-100" onClick={() => handleDialogDeleteComponent(comp.id, comp.name)} disabled={isDialogLoading}><Trash2 className="h-4 w-4"/></Button></div></TableCell></>)}</TableRow>))}{editableComponents.length === 0 && ( <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Belum ada komponen.</TableCell></TableRow> )}</TableBody></Table></div><div className="mt-4 pt-4 border-t"> <h4 className="text-md font-semibold mb-2">Tambah Komponen Baru</h4> <div className="flex flex-col sm:flex-row gap-2 items-start"><div className='flex-grow space-y-1'><Label htmlFor="dialog-new-name" className='sr-only'>Nama</Label><Input id="dialog-new-name" value={dialogNewComponentName} onChange={(e) => setDialogNewComponentName(e.target.value)} placeholder="Nama Komponen Baru" disabled={isDialogLoading}/></div><div className='w-full sm:w-auto space-y-1'><Label htmlFor="dialog-new-weight" className='sr-only'>Bobot</Label><Input id="dialog-new-weight" type="number" min="0.01" step="any" value={dialogNewComponentWeight} onChange={(e) => setDialogNewComponentWeight(e.target.value)} placeholder="Bobot (%)" className="w-full sm:w-28" disabled={isDialogLoading}/></div><Button onClick={handleDialogAddComponent} disabled={isDialogLoading || !dialogNewComponentName.trim() || !dialogNewComponentWeight.trim()} className='w-full sm:w-auto'>{isDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />} Tambah</Button></div> </div>{dialogError && <p className="mt-4 text-sm text-red-600 text-center">{dialogError}</p>}<DialogFooter className="mt-6"><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter></DialogContent>
                    </Dialog>
                    {/* Dialog Opsi PDF */}
                    <Dialog open={isPdfOptionsDialogOpen} onOpenChange={(open) => { setIsPdfOptionsDialogOpen(open); if (!open) setPdfPreviewUrl(null); }}>
                         <DialogTrigger asChild><Button variant="default" size="sm"> <Download className="mr-2 h-4 w-4" /> Unduh PDF... </Button></DialogTrigger>
                        <DialogContent className="sm:max-w-3xl"> <DialogHeader> <DialogTitle>Opsi Unduh PDF</DialogTitle> <DialogDescription>Pilih orientasi dan ukuran kertas. Pratinjau akan diperbarui otomatis.</DialogDescription> </DialogHeader> <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4"> <div className="space-y-4 md:col-span-1"> <div> <Label className="text-sm font-medium">Orientasi</Label> <RadioGroup value={pdfOrientation} onValueChange={(v) => setPdfOrientation(v as PdfOrientation)} className="mt-2 grid grid-cols-2 gap-2"> <div><RadioGroupItem value="p" id="pdf-p" className="peer sr-only" /><Label htmlFor="pdf-p" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Portrait</Label></div> <div><RadioGroupItem value="l" id="pdf-l" className="peer sr-only" /><Label htmlFor="pdf-l" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">Landscape</Label></div> </RadioGroup> </div> <div> <Label htmlFor="pdf-paper-size" className="text-sm font-medium">Ukuran Kertas</Label> <Select value={pdfPaperSize} onValueChange={(v) => setPdfPaperSize(v as PdfPaperSize)}> <SelectTrigger id="pdf-paper-size" className="w-full mt-2"><SelectValue placeholder="Pilih..." /></SelectTrigger> <SelectContent> <SelectItem value="a4">A4</SelectItem> <SelectItem value="letter">Letter</SelectItem> <SelectItem value="legal">Legal</SelectItem> </SelectContent> </Select> </div> <div className='pt-4'> <Button onClick={handleActualDownload} disabled={isDownloadingPdf || isPreviewLoading} className="w-full"> {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Unduh PDF Sekarang </Button> </div> </div> <div className="md:col-span-2 border rounded-md bg-muted/30 min-h-[400px] flex items-center justify-center relative overflow-hidden">{isPreviewLoading && ( <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> )}{pdfPreviewUrl ? ( <iframe src={pdfPreviewUrl} className="w-full h-[500px] md:h-[600px]" title="Pratinjau PDF" aria-label="Pratinjau Dokumen PDF"/> ) : ( <div className="text-center text-muted-foreground p-4"><p>Pratinjau akan muncul di sini...</p>{!isPreviewLoading && <p className='text-xs mt-1'>(Mengubah opsi akan memuat ulang)</p>}</div> )}</div> </div> <DialogFooter className="mt-4"><DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose></DialogFooter> </DialogContent>
                    </Dialog>
                </div>
             </div>

            {/* Render GradeEntryDataTable */}
            {gradeData && ( // Pastikan gradeData tidak null sebelum render DataTable
                <GradeEntryDataTable
                    students={gradeData.students}
                    assessmentComponents={gradeData.assessmentComponents}
                    subjectName={""} // Kosongkan karena sudah di header page
                    initialGrades={gradeData.initialGrades}
                    subjectId={subjectId}
                    onSaveSingleGrade={handleSaveSingleGradeClient}
                    onDeleteComponent={handleDialogDeleteComponent}
                    onUpdateComponent={handleUpdateComponent}
                />
            )}

             {/* Dialog Konfirmasi Hapus */}
             <Dialog open={deleteDialogState.isOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
                 <DialogContent><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle><DialogDescription>Yakin hapus komponen <strong className='mx-1'>"{deleteDialogState.componentName}"</strong>?</DialogDescription>{deleteDialogState.error && <p className="text-sm text-red-600 mt-2">{deleteDialogState.error}</p>}</DialogHeader><DialogFooter><Button variant="secondary" disabled={deleteDialogState.isLoading} onClick={closeDeleteDialog}>Batal</Button><Button onClick={confirmDeleteComponent} disabled={deleteDialogState.isLoading} variant="destructive">{deleteDialogState.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ya, Hapus</Button></DialogFooter></DialogContent>
            </Dialog>
        </div>
    );
}