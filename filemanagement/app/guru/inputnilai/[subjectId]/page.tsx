// app/guru/input-nilai/[subjectId]/page.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { GradeEntryForm } from '@/components/grade-entry-form'; // Sesuaikan path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"; // Dialog utama
import { toast } from "sonner";
import { Loader2, PlusCircle, Scale, Trash2, Settings, Save, Pencil, XCircle, Download } from 'lucide-react'; // Tambah ikon Settings, Save, Pencil, XCircle
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Untuk tabel di dialog

import jsPDF from 'jspdf';
// Import autoTable dan tipe yang dibutuhkan
import autoTable, { UserOptions, CellDef, RowInput } from 'jspdf-autotable';

// --- Tipe Data ---
interface Student { id: string; name: string; }
interface AssessmentComponent { id: string; name: string; weight: number; }
type GradesState = Record<string, Record<string, number | null>>;
interface GradeData {
    students: Student[];
    assessmentComponents: AssessmentComponent[];
    subjectName: string;
    initialGrades: GradesState;
}
// State untuk komponen yang sedang diedit di dialog
interface EditingComponentState extends AssessmentComponent { originalWeight: number; originalName: string; }
// State dialog hapus
interface DeleteDialogState { isOpen: boolean; componentId: string | null; componentName: string | null; isLoading: boolean; error?: string | null; }

export default function InputNilaiPage() {
    const params = useParams();
    const subjectId = params.subjectId as string;

    const [gradeData, setGradeData] = useState<GradeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- State untuk Dialog "Atur Komponen" ---
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    // State untuk daftar komponen yang *sedang diedit* di dalam dialog
    const [editableComponents, setEditableComponents] = useState<AssessmentComponent[]>([]);
    // State untuk komponen baru yang ditambahkan *di dalam* dialog
    const [dialogNewComponentName, setDialogNewComponentName] = useState('');
    const [dialogNewComponentWeight, setDialogNewComponentWeight] = useState('');
    const [isDialogLoading, setIsDialogLoading] = useState(false); // Loading umum di dialog
    const [dialogError, setDialogError] = useState<string | null>(null);
    // State untuk komponen yang sedang diedit inline di dialog
    const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
    const [editingValues, setEditingValues] = useState<{ name: string; weight: string }>({ name: '', weight: '' });
        // State untuk loading PDF
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);



    // State dialog konfirmasi hapus (tetap sama)
    const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({ isOpen: false, componentId: null, componentName: null, isLoading: false });

    // --- Fetch Data Awal ---
    const fetchInitialData = useCallback(async () => {
        if (!subjectId) return;
        setIsLoading(true);
        setError(null);
        try {
            // Pastikan endpoint API GET sudah benar (sesuaikan jika perlu)
            const response = await fetch(`/api/subjects/${subjectId}/gradedata`);
            if (!response.ok) {
                let errorData; try { errorData = await response.json(); } catch { /* ignore */ }
                throw new Error(errorData?.message || `Gagal mengambil data (${response.status})`);
            }
            const data: GradeData = await response.json();
            setGradeData(data);
            // !! Saat data utama diambil, update juga state editableComponents
            setEditableComponents(data.assessmentComponents);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data");
            setGradeData(null);
            setEditableComponents([]); // Reset jika error
        } finally {
            setIsLoading(false);
        }
    }, [subjectId]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    // --- Simpan Satu Nilai (tetap sama) ---
    const handleSaveSingleGradeClient = useCallback(async (/*...*/) => { /*...*/ }, [subjectId]);

    // --- Fungsi Terkait Dialog "Atur Komponen" ---

    // Membuka Dialog dan menyalin state komponen saat ini
    const openManageDialog = () => {
        if (gradeData) {
            setEditableComponents(JSON.parse(JSON.stringify(gradeData.assessmentComponents))); // Deep copy
            setDialogError(null); // Reset error
            setDialogNewComponentName(''); // Reset form tambah
            setDialogNewComponentWeight('');
            setEditingComponentId(null); // Pastikan tidak ada yg sedang diedit
        }
        setIsManageDialogOpen(true);
    };

    // Menangani perubahan pada input bobot/nama inline di dialog
    const handleInlineEditChange = (field: 'name' | 'weight', value: string) => {
        setEditingValues(prev => ({ ...prev, [field]: value }));
    };

    // Memulai mode edit inline untuk satu komponen
    const startInlineEdit = (component: AssessmentComponent) => {
        setEditingComponentId(component.id);
        setEditingValues({ name: component.name, weight: component.weight.toString() });
        setDialogError(null);
    };

    // Membatalkan mode edit inline
    const cancelInlineEdit = () => {
        setEditingComponentId(null);
        setEditingValues({ name: '', weight: '' });
        setDialogError(null);
    };

    // Menyimpan perubahan dari edit inline (panggil API PUT)
    const saveInlineEdit = async () => {
        if (!editingComponentId) return;

        const currentComponent = editableComponents.find(c => c.id === editingComponentId);
        if (!currentComponent) return;

        const { name, weight } = editingValues;
        if (!name?.trim() || !weight?.trim()) {
            setDialogError("Nama dan Bobot tidak boleh kosong.");
            return;
        }
        const weightValue = parseFloat(weight);
        if (isNaN(weightValue) || weightValue <= 0) {
             setDialogError("Bobot harus angka positif.");
            return;
        }

        // Optimistic check: only save if changed
        if (name.trim() === currentComponent.name && weightValue === currentComponent.weight) {
            cancelInlineEdit(); // No change, just exit edit mode
            return;
        }


        setIsDialogLoading(true);
        setDialogError(null);
        try {
             const response = await fetch(`/api/subjects/${subjectId}/components/${editingComponentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), weight: weightValue }),
            });
             const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal mengubah (${response.status})`);
            const updatedComponent: AssessmentComponent = result;

            // Update state editableComponents dan gradeData
            const updateState = (prev: GradeData | null) => {
                if (!prev) return null;
                const updated = prev.assessmentComponents.map(c => c.id === editingComponentId ? updatedComponent : c);
                setEditableComponents(updated); // Update state dialog
                return { ...prev, assessmentComponents: updated }; // Update state utama
            };
            setGradeData(updateState);

            cancelInlineEdit(); // Exit edit mode
            toast.success(`Komponen "${updatedComponent.name}" berhasil diubah.`);

        } catch (err) {
            console.error("[Dialog] Edit component error:", err);
            const msg = err instanceof Error ? err.message : "Gagal mengubah komponen";
            setDialogError(msg); // Tampilkan error di dialog
            toast.error(msg);
        } finally {
            setIsDialogLoading(false);
        }
    };


    // Menambah komponen baru dari dalam dialog (panggil API POST)
    const handleDialogAddComponent = async () => {
        if (!dialogNewComponentName.trim() || !dialogNewComponentWeight.trim()) {
             setDialogError("Nama dan Bobot wajib diisi untuk komponen baru.");
            return;
        }
         const weightValue = parseFloat(dialogNewComponentWeight);
        if (isNaN(weightValue) || weightValue <= 0) {
            setDialogError("Bobot harus angka positif.");
            return;
        }

        setIsDialogLoading(true);
        setDialogError(null);
        try {
            const response = await fetch(`/api/subjects/${subjectId}/components`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: dialogNewComponentName.trim(), weight: weightValue }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal menambah (${response.status})`);
            const newComponent: AssessmentComponent = result;

            // Update state editableComponents dan gradeData
             const updateState = (prev: GradeData | null) => {
                if (!prev) return null;
                const updated = [...prev.assessmentComponents, newComponent];
                // Tambahkan juga null entry di grades
                 const updatedGrades = { ...prev.initialGrades };
                 Object.keys(updatedGrades).forEach(studentId => {
                    updatedGrades[studentId] = { ...updatedGrades[studentId], [newComponent.id]: null };
                });

                setEditableComponents(updated); // Update state dialog
                return { ...prev, assessmentComponents: updated, initialGrades: updatedGrades }; // Update state utama
            };
            setGradeData(updateState);


            setDialogNewComponentName(''); // Reset form tambah di dialog
            setDialogNewComponentWeight('');
            toast.success(`Komponen "${newComponent.name}" berhasil ditambahkan.`);

        } catch (err) {
            console.error("[Dialog] Add component error:", err);
            const msg = err instanceof Error ? err.message : "Gagal menambah komponen";
            setDialogError(msg);
            toast.error(msg);
        } finally {
            setIsDialogLoading(false);
        }
    };

    // !! TAMBAHKAN DEFINISI FUNGSI INI !!
    // Fungsi untuk menangani update komponen dari GradeEntryForm (setelah edit inline sukses)
    const handleUpdateComponent = useCallback((updatedComponent: AssessmentComponent) => {
        console.log('[InputNilaiPage] handleUpdateComponent updating state with:', updatedComponent);

        // Update state utama (gradeData)
        setGradeData(prevData => {
            if (!prevData) return null; // Jika data belum ada, jangan lakukan apa-apa

            // Map over komponen lama, ganti yang ID-nya cocok
            const updatedComponents = prevData.assessmentComponents.map(c =>
                c.id === updatedComponent.id ? updatedComponent : c
            );

            // Kembalikan state baru dengan komponen yang sudah diupdate
            return { ...prevData, assessmentComponents: updatedComponents };
        });

        // Update juga state dialog editableComponents jika perlu (agar konsisten jika dialog dibuka)
        setEditableComponents(prevEditable =>
             prevEditable.map(c => c.id === updatedComponent.id ? updatedComponent : c)
        );

        // Notifikasi bisa dipindahkan ke sini dari GradeEntryForm jika mau
        // toast.success(`Komponen "${updatedComponent.name}" berhasil diperbarui.`);

    }, []); // useCallback dependencies kosong karena setGradeData dan setEditableComponents stabil


    // Hapus Komponen (dipicu dari dalam dialog, buka AlertDialog terpisah)
    const handleDialogDeleteComponent = (componentId: string, componentName: string) => {
        // Buka dialog konfirmasi yang sudah ada
        setDeleteDialogState({ isOpen: true, componentId, componentName, isLoading: false });
        // Dialog utama mungkin bisa ditutup atau dibiarkan terbuka, tergantung preferensi UX
        // setIsManageDialogOpen(false); // Opsi: tutup dialog manage saat konfirmasi hapus muncul
    };

    // Konfirmasi Hapus (setelah dialog konfirmasi)
    const confirmDeleteComponent = async () => {
        if (!deleteDialogState.componentId || !subjectId) return;
        setDeleteDialogState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch(`/api/subjects/${subjectId}/components/${deleteDialogState.componentId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal menghapus (${response.status})`);

            const deletedId = deleteDialogState.componentId;
            const deletedName = deleteDialogState.componentName;

            // Update state editableComponents dan gradeData
            const updateState = (prev: GradeData | null) => {
                if (!prev) return null;
                const updated = prev.assessmentComponents.filter(c => c.id !== deletedId);
                 // Hapus juga nilai terkait
                const updatedGrades = { ...prev.initialGrades };
                Object.keys(updatedGrades).forEach(studentId => {
                    if (updatedGrades[studentId]?.[deletedId] !== undefined) {
                         const newStudentGrades = { ...updatedGrades[studentId] };
                        delete newStudentGrades[deletedId];
                        updatedGrades[studentId] = newStudentGrades;
                    }
                });
                setEditableComponents(updated); // Update state dialog
                return { ...prev, assessmentComponents: updated, initialGrades: updatedGrades }; // Update state utama
            };
            setGradeData(updateState);

            closeDeleteDialog(); // Tutup dialog konfirmasi
            toast.success(`Komponen "${deletedName}" berhasil dihapus.`);

        } catch (err) {
            console.error("[Dialog] Delete component error:", err);
            const msg = err instanceof Error ? err.message : "Gagal menghapus komponen";
            setDeleteDialogState(prev => ({ ...prev, isLoading: false, error: msg }));
            toast.error(msg);
        }
    };

    const closeDeleteDialog = () => {
        setDeleteDialogState({ isOpen: false, componentId: null, componentName: null, isLoading: false });
    };

    // --- Hitung Total Bobot ---
    // !! PERBAIKAN TOTALWEIGHT DENGAN PENGECEKAN !!
    const totalWeight = useMemo(() => {
        if (!gradeData || !Array.isArray(gradeData.assessmentComponents)) {
            // console.warn('[useMemo totalWeight] gradeData or assessmentComponents invalid, returning 0');
            return 0;
        }
        return gradeData.assessmentComponents.reduce((sum, comp) => {
            const weight = Number(comp?.weight) || 0;
            return sum + weight;
        }, 0);
    }, [gradeData]);

    // Hitung total bobot di dialog (dari state editable)
const dialogTotalWeight = useMemo(() => {
    // !! TAMBAHKAN PENGECEKAN Array.isArray !!
    if (!Array.isArray(editableComponents)) {
        console.warn('[useMemo dialogTotalWeight] editableComponents is not an array, returning 0.');
        return 0; // Kembalikan 0 jika bukan array
    }
    // Jika lolos, aman untuk reduce
    return editableComponents.reduce((sum, comp) => {
        // Jika sedang diedit, gunakan nilai dari input edit, jika tidak, gunakan nilai asli
        // Pastikan comp tidak null/undefined sebelum akses properti
        const weightSource = comp?.id === editingComponentId ? editingValues.weight : comp?.weight;
        const weight = Number(weightSource) || 0; // Default 0 jika tidak valid
        return sum + weight;
    }, 0);
}, [editableComponents, editingComponentId, editingValues]); // Dependencies

    // --- Fungsi untuk Generate dan Unduh PDF ---
    const handleDownloadPdf = useCallback(() => {
        if (!gradeData) {
            toast.error("Data nilai belum dimuat.");
            return;
        }

        setIsGeneratingPdf(true);
        console.log("[PDF Gen] Starting PDF generation...");

        try {
           
            const doc = new jsPDF() as jsPDF & { autoTable: (options: UserOptions) => jsPDF };
            const { subjectName, assessmentComponents, students, initialGrades } = gradeData;
             const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
             const location = "Slawi, Jawa Tengah";
             const generatedDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // --- Header Dokumen ---
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(`Rekap Nilai - ${subjectName}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text(`Lokasi: ${location}`, 14, 22);
            doc.text(`Tanggal Cetak: ${generatedDate}`, 14, 27);

            // --- Siapkan Data Tabel ---
            // Tipe eksplisit untuk head
            // !! HAPUS fillColor dan textColor inline, cukup style dasar !!
             const head: CellDef[][] = [[
                { content: 'No', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
                { content: 'Nama Siswa', styles: { fontStyle: 'bold' as const } }, // halign default left
                ...assessmentComponents.map(comp => ({
                    content: `${comp.name}\n(${comp.weight}%)`,
                    styles: { halign: 'center' as const, fontStyle: 'bold' as const }
                })),
                { content: 'Nilai Akhir', styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
            ]];

            // Tipe eksplisit untuk body
            const body: RowInput[] = students.map((student, index) => {
                // ... (hitung finalScore sama seperti sebelumnya) ...
                 let finalScoreNum = 0; let weightSum = 0;
                 assessmentComponents.forEach(comp => {
                    const score = initialGrades[student.id]?.[comp.id] ?? 0;
                    finalScoreNum += (Number(score) * comp.weight) / 100;
                    weightSum += comp.weight;
                 });
                 const finalScore = weightSum > 0 ? finalScoreNum.toFixed(1) : '-';

                return [
                    { content: index + 1, styles: { halign: 'center' as const } },
                    student.name,
                    ...assessmentComponents.map(comp => ({
                        content: initialGrades[student.id]?.[comp.id]?.toString() ?? '-',
                        styles: { halign: 'center' as const }
                    })),
                    { content: finalScore, styles: { halign: 'center' as const, fontStyle: 'bold' as const } }
                ];
            });
            // --- Generate Tabel ---
            // !! UBAH CARA PEMANGGILAN AUTO TABLE !!
            // Bukan doc.autoTable({...})
            autoTable(doc, { // Panggil fungsi autoTable langsung, berikan doc sebagai argumen pertama
                head: head,
                body: body,
                startY: 35,
                theme: 'grid',
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 9
                },
                styles: { fontSize: 8.5, cellPadding: 2, overflow: 'linebreak' },
                columnStyles: {
                     0: { cellWidth: 10, halign: 'center' as const },
                     1: { cellWidth: 'auto' },
                     ...assessmentComponents.reduce((acc, comp, idx) => {
                         acc[idx + 2] = { cellWidth: 20, halign: 'center' as const };
                         return acc;
                     }, {} as { [key: number]: { /* ... */ } }),
                     [head[0].length - 1]: { cellWidth: 18, halign: 'center' as const, fontStyle: 'bold' as const },
                 },
                 didDrawPage: (data) => {
                     // ... (logika nomor halaman) ...
                      doc.setFontSize(8);
                     doc.setTextColor(150);
                     const pageCount = doc.internal.pages.length - 1; // Tetap gunakan cara ini jika bekerja
                     // Alternatif jika di atas error: const pageCount = data.cursor?.pageCount ?? doc.getNumberOfPages();
                     doc.text('Halaman ' + data.pageNumber + ' dari ' + pageCount, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
                 }
            });

            // --- Simpan PDF ---
            // ... (doc.save() - sama) ...
             const safeSubjectName = subjectName.replace(/[^a-zA-Z0-9]/g, '_');
             const timestamp = new Date().toISOString().slice(0,10);
            const fileName = `Rekap_Nilai_${safeSubjectName}_${timestamp}.pdf`;
            doc.save(fileName);
            console.log("[PDF Gen] PDF generated and download triggered:", fileName);
            toast.success("Rekap nilai PDF berhasil dibuat.");

        } catch (pdfError) {
             // ... (error handling) ...
              console.error("[PDF Gen] Error generating PDF:", pdfError);
             toast.error("Gagal membuat PDF. Silakan coba lagi.");
        } finally {
            setIsGeneratingPdf(false);
        }

    }, [gradeData, totalWeight]);
    // --- Render Logic ---
    if (isLoading) return <div className="container mx-auto p-4 text-center"><Loader2 className="inline-block animate-spin" /> Memuat...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-600">Error: {error}</div>;
    if (!gradeData) return <div className="container mx-auto p-4">Data tidak tersedia.</div>;



    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Tombol Atur Komponen & Info Bobot */}
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2 p-4 border rounded-md bg-card text-card-foreground shadow">
                <h2 className="text-xl font-semibold">{gradeData.subjectName} - Input Nilai</h2>
                <div className="flex items-center gap-4">
                    <div className={`text-sm font-medium flex items-center gap-1 ${totalWeight !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                        <Scale className="h-4 w-4" />
                        Total Bobot: {totalWeight}% {totalWeight !== 100 && '(Tidak 100%)'}
                    </div>
                    <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={openManageDialog}>
                                <Settings className="mr-2 h-4 w-4" /> Atur Komponen Penilaian
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Atur Komponen Penilaian</DialogTitle>
                                {/* Deskripsi standar */}
                                <DialogDescription>
                                    Tambah, hapus, atau ubah nama dan bobot komponen penilaian untuk mata pelajaran ini.
                                </DialogDescription>
                                {/* !! PINDAHKAN DIV Total Bobot ke SINI (setelah Deskripsi) !! */}
                                <div className={`pt-1 text-sm font-medium flex items-center gap-1 ${dialogTotalWeight !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                                    <Scale className="h-4 w-4" />
                                    Total Bobot (Dialog): {dialogTotalWeight}% {dialogTotalWeight !== 100 ? '(Tidak 100%)' : ''}
                                </div>
                            </DialogHeader>

                            {/* Tabel Komponen di Dialog */}
                            <div className="max-h-[40vh] overflow-y-auto my-4 pr-2 border rounded-md">
                                <Table>
                                    {/* ... Isi TableHeader dan TableBody ... */}
                                     <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Komponen</TableHead>
                                            <TableHead className="w-[100px] text-right">Bobot (%)</TableHead>
                                            <TableHead className="w-[120px] text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    </TableBody>
                                </Table>
                             </div>

                            {/* Form Tambah Baru di Dialog */}
                            <div className="mt-4 pt-4 border-t">
                                {/* ... Isi Form Tambah ... */}
                                 <h4 className="text-md font-semibold mb-2">Tambah Komponen Baru</h4>
                                <div className="flex flex-col sm:flex-row gap-2 items-start">
                                    <div className='flex-grow space-y-1'>
                                         <Label htmlFor="dialog-new-name" className='sr-only'>Nama</Label>
                                        <Input id="dialog-new-name" value={dialogNewComponentName} onChange={(e) => setDialogNewComponentName(e.target.value)} placeholder="Nama Komponen Baru" disabled={isDialogLoading}/>
                                    </div>
                                    <div className='w-full sm:w-auto space-y-1'>
                                         <Label htmlFor="dialog-new-weight" className='sr-only'>Bobot</Label>
                                         <Input id="dialog-new-weight" type="number" min="0.01" step="any" value={dialogNewComponentWeight} onChange={(e) => setDialogNewComponentWeight(e.target.value)} placeholder="Bobot (%)" className="w-full sm:w-28" disabled={isDialogLoading}/>
                                    </div>
                                    <Button onClick={handleDialogAddComponent} disabled={isDialogLoading || !dialogNewComponentName.trim() || !dialogNewComponentWeight.trim()} className='w-full sm:w-auto'>
                                        {isDialogLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />} Tambah
                                    </Button>
                                </div>
                            </div>

                             {/* Tampilkan Error Umum Dialog */}
                            {dialogError && <p className="mt-4 text-sm text-red-600 text-center">{dialogError}</p>}

                            <DialogFooter className="mt-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Tutup</Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* !! Tombol Unduh PDF !! */}
                    <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf} size="sm">
                        {isGeneratingPdf ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         ) : (
                            <Download className="mr-2 h-4 w-4" />
                         )}
                         Unduh Rekap (PDF)
                    </Button>
                 </div>
             </div>

            {/* Form Input Nilai Utama */}
            <GradeEntryForm
                students={gradeData.students}
                assessmentComponents={gradeData.assessmentComponents}
                subjectName={gradeData.subjectName}
                initialGrades={gradeData.initialGrades}
                onSaveSingleGrade={handleSaveSingleGradeClient}
                // Pass handler delete yang benar
                onDeleteComponent={handleDialogDeleteComponent}
                // !! TAMBAHKAN PROPS YANG HILANG !!
                subjectId={subjectId} // Pass subjectId dari params
                onUpdateComponent={handleUpdateComponent} // Pass fungsi handler update
            />

             {/* Dialog Konfirmasi Hapus */}
            <Dialog open={deleteDialogState.isOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
                 {/* ... Isi AlertDialog ... */}
                 <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus komponen <strong className='mx-1'>"{deleteDialogState.componentName}"</strong>? Semua nilai terkait akan hilang.
                        </DialogDescription>
                         {deleteDialogState.error && <p className="text-sm text-red-600 mt-2">{deleteDialogState.error}</p>}
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={deleteDialogState.isLoading} onClick={closeDeleteDialog}>Batal</Button> {/* Pastikan cancel memanggil close */}
                        <Button onClick={confirmDeleteComponent} disabled={deleteDialogState.isLoading} className="bg-destructive hover:bg-destructive/90">
                            {deleteDialogState.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ya, Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}