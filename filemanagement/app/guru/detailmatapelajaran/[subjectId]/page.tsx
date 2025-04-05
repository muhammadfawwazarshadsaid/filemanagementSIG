// app/guru/mata-pelajaran/[subjectId]/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Untuk deskripsi
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose, // Untuk tombol close manual
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Pencil, PlusCircle, Save, Trash2, XCircle, Scale } from 'lucide-react';

// --- Tipe Data ---
interface Outcome { pengetahuan: string; keterampilan: string; }
interface AssessmentComponent { id: string; name: string; weight: number; }
interface SubjectDetails {
    id: string;
    name: string;
    outcomes: Outcome;
    assessmentComponents: AssessmentComponent[];
}
// State untuk dialog hapus/edit/tambah (bisa di-refactor jadi satu jika kompleks)
interface DialogState { isOpen: boolean; data?: any; isLoading: boolean; error?: string | null; }
interface DeleteDialogState { isOpen: boolean; componentId: string | null; componentName: string | null; isLoading: boolean; error?: string | null; }

// Komponen Helper untuk Edit Capaian
const EditableOutcome = ({ type, initialDescription, subjectId, onSaveSuccess }: {
    type: 'pengetahuan' | 'keterampilan';
    initialDescription: string;
    subjectId: string;
    onSaveSuccess: (type: 'pengetahuan' | 'keterampilan', newDescription: string) => void;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(initialDescription);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (description === initialDescription) {
            setIsEditing(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/subjects/${subjectId}/outcomes`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, description: description.trim() }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal menyimpan perubahan');

            onSaveSuccess(type, description.trim()); // Update state di parent
            setIsEditing(false);
            toast.success(`Capaian ${type} berhasil diperbarui.`);
        } catch (err) {
            console.error(`Error saving ${type}:`, err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
            toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : 'Error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setDescription(initialDescription); // Reset ke nilai awal
        setIsEditing(false);
        setError(null);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold capitalize">{type}</h4>
                {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                )}
            </div>
            {isEditing ? (
                <div className="space-y-2">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        disabled={isLoading}
                        className="w-full"
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
                            <XCircle className="h-4 w-4 mr-1" /> Batal
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isLoading || description === initialDescription}>
                            {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Simpan
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description || `Belum ada deskripsi ${type}.`}</p>
            )}
        </div>
    );
};


export default function SubjectDetailPage() {
    const params = useParams();
    const subjectId = params.subjectId as string;

    const [subjectDetails, setSubjectDetails] = useState<SubjectDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State Dialogs
    const [addComponentDialog, setAddComponentDialog] = useState<DialogState>({ isOpen: false, isLoading: false });
    const [editComponentDialog, setEditComponentDialog] = useState<DialogState>({ isOpen: false, data: null, isLoading: false });
    const [deleteComponentDialog, setDeleteComponentDialog] = useState<DeleteDialogState>({ isOpen: false, componentId: null, componentName: null, isLoading: false });

    // Fetch Data Awal
    const fetchDetails = useCallback(async () => {
        if (!subjectId) return;
        setIsLoading(true);
        setError(null);
        console.log(`[Detail Page] Fetching details for subjectId: ${subjectId}`);
        try {
            const response = await fetch(`/api/subjects/${subjectId}/details`);
            if (!response.ok) {
                let errorData; try { errorData = await response.json(); } catch { /* ignore */ }
                throw new Error(errorData?.message || `Gagal memuat detail (${response.status})`);
            }
            const data: SubjectDetails = await response.json();
            setSubjectDetails(data);
        } catch (err) {
            console.error("[Detail Page] Fetch error:", err);
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
            setSubjectDetails(null);
        } finally {
            setIsLoading(false);
        }
    }, [subjectId]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    // Handler Update Capaian Sukses (untuk update state lokal)
    const handleOutcomeSaveSuccess = (type: 'pengetahuan' | 'keterampilan', newDescription: string) => {
        setSubjectDetails(prev => prev ? {
            ...prev,
            outcomes: { ...prev.outcomes, [type]: newDescription }
        } : null);
    };

    // --- Handlers Komponen Penilaian (Mirip InputNilaiPage, disesuaikan) ---

    // Tambah Komponen (dalam Dialog)
    const handleAddComponentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const weight = formData.get('weight') as string;

        if (!name?.trim() || !weight?.trim()) {
            setAddComponentDialog(prev => ({ ...prev, error: "Nama dan Bobot wajib diisi." }));
            return;
        }
        const weightValue = parseFloat(weight);
        if (isNaN(weightValue) || weightValue <= 0) {
             setAddComponentDialog(prev => ({ ...prev, error: "Bobot harus angka positif." }));
            return;
        }

        setAddComponentDialog(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch(`/api/subjects/${subjectId}/components`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), weight: weightValue }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal menambah (${response.status})`);
            const newComponent: AssessmentComponent = result;

            setSubjectDetails(prev => prev ? { ...prev, assessmentComponents: [...prev.assessmentComponents, newComponent] } : null);
            setAddComponentDialog({ isOpen: false, isLoading: false }); // Tutup dialog
            toast.success(`Komponen "${newComponent.name}" berhasil ditambahkan.`);
        } catch (err) {
            console.error("[Detail Page] Add component error:", err);
            const msg = err instanceof Error ? err.message : "Gagal menambah komponen";
            setAddComponentDialog(prev => ({ ...prev, isLoading: false, error: msg }));
            toast.error(msg);
        }
    };

    // Edit Komponen (dalam Dialog)
    const handleEditComponentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editComponentDialog.data?.id) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const weight = formData.get('weight') as string;
        const componentId = editComponentDialog.data.id;

        if (!name?.trim() || !weight?.trim()) {
             setEditComponentDialog(prev => ({ ...prev, error: "Nama dan Bobot wajib diisi." }));
            return;
        }
         const weightValue = parseFloat(weight);
        if (isNaN(weightValue) || weightValue <= 0) {
             setEditComponentDialog(prev => ({ ...prev, error: "Bobot harus angka positif." }));
            return;
        }

        setEditComponentDialog(prev => ({ ...prev, isLoading: true, error: null }));
        try {
             const response = await fetch(`/api/subjects/${subjectId}/components/${componentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), weight: weightValue }),
            });
             const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal mengubah (${response.status})`);
            const updatedComponent: AssessmentComponent = result;

            setSubjectDetails(prev => prev ? {
                ...prev,
                assessmentComponents: prev.assessmentComponents.map(c => c.id === componentId ? updatedComponent : c)
            } : null);
             setEditComponentDialog({ isOpen: false, isLoading: false, data: null }); // Tutup dialog
            toast.success(`Komponen "${updatedComponent.name}" berhasil diubah.`);
        } catch (err) {
            console.error("[Detail Page] Edit component error:", err);
            const msg = err instanceof Error ? err.message : "Gagal mengubah komponen";
             setEditComponentDialog(prev => ({ ...prev, isLoading: false, error: msg }));
            toast.error(msg);
        }
    };


    // Hapus Komponen (Konfirmasi)
    const handleDeleteComponent = (component: AssessmentComponent) => {
        setDeleteComponentDialog({ isOpen: true, componentId: component.id, componentName: component.name, isLoading: false });
    };

    const confirmDeleteComponent = async () => {
        if (!deleteComponentDialog.componentId) return;
        setDeleteComponentDialog(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch(`/api/subjects/${subjectId}/components/${deleteComponentDialog.componentId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Gagal menghapus (${response.status})`);

            setSubjectDetails(prev => prev ? {
                ...prev,
                assessmentComponents: prev.assessmentComponents.filter(c => c.id !== deleteComponentDialog.componentId)
            } : null);
            setDeleteComponentDialog({ isOpen: false, componentId: null, componentName: null, isLoading: false });
            toast.success(`Komponen "${deleteComponentDialog.componentName}" berhasil dihapus.`);
        } catch (err) {
            console.error("[Detail Page] Delete component error:", err);
             const msg = err instanceof Error ? err.message : "Gagal menghapus komponen";
            setDeleteComponentDialog(prev => ({ ...prev, isLoading: false, error: msg }));
            toast.error(msg);
        }
    };

    // --- Render Logic ---
    if (isLoading) return <div className="container mx-auto p-4 text-center"><Loader2 className="inline-block animate-spin" /> Memuat...</div>;
    if (error) return <div className="container mx-auto p-4 text-red-600">Error: {error}</div>;
    if (!subjectDetails) return <div className="container mx-auto p-4">Data mata pelajaran tidak ditemukan.</div>;

    // Hitung total bobot komponen
    const totalWeight = subjectDetails.assessmentComponents.reduce((sum, comp) => sum + (Number(comp.weight) || 0), 0);

    return (
        <div className="container mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">{subjectDetails.name}</h1>

            {/* Kartu Capaian Kompetensi */}
            <Card>
                <CardHeader>
                    <CardTitle>Capaian Pembelajaran (CP)</CardTitle>
                    <CardDescription>Deskripsi pengetahuan dan keterampilan yang diharapkan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <EditableOutcome
                        type="pengetahuan"
                        initialDescription={subjectDetails.outcomes.pengetahuan}
                        subjectId={subjectId}
                        onSaveSuccess={handleOutcomeSaveSuccess}
                    />
                    <hr />
                    <EditableOutcome
                        type="keterampilan"
                        initialDescription={subjectDetails.outcomes.keterampilan}
                        subjectId={subjectId}
                        onSaveSuccess={handleOutcomeSaveSuccess}
                    />
                </CardContent>
            </Card>

            {/* Kartu Komponen Penilaian */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Komponen Penilaian</CardTitle>
                        <CardDescription>Daftar komponen yang digunakan untuk penilaian akhir.</CardDescription>
                    </div>
                     <Dialog open={addComponentDialog.isOpen} onOpenChange={(open) => setAddComponentDialog({ isOpen: open, isLoading: false })}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" /> Tambah Komponen
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <form onSubmit={handleAddComponentSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Tambah Komponen Penilaian Baru</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="add-comp-name" className="text-right">Nama</Label>
                                        <Input id="add-comp-name" name="name" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="add-comp-weight" className="text-right">Bobot (%)</Label>
                                        <Input id="add-comp-weight" name="weight" type="number" min="0.01" step="any" className="col-span-3" required />
                                    </div>
                                     {addComponentDialog.error && <p className="col-span-4 text-sm text-red-600 text-center">{addComponentDialog.error}</p>}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline" disabled={addComponentDialog.isLoading}>Batal</Button></DialogClose>
                                    <Button type="submit" disabled={addComponentDialog.isLoading}>
                                        {addComponentDialog.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end items-center mb-2 text-sm font-medium">
                        <div className={`flex items-center gap-1 ${totalWeight !== 100 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                            <Scale className="h-4 w-4" />
                            Total Bobot: {totalWeight}% {totalWeight !== 100 && '(Tidak 100%)'}
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Komponen</TableHead>
                                <TableHead className="w-[100px] text-right">Bobot (%)</TableHead>
                                <TableHead className="w-[120px] text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjectDetails.assessmentComponents.length === 0 && (
                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Belum ada komponen penilaian.</TableCell></TableRow>
                            )}
                            {subjectDetails.assessmentComponents.map((comp) => (
                                <TableRow key={comp.id}>
                                    <TableCell className="font-medium">{comp.name}</TableCell>
                                    <TableCell className="text-right">{comp.weight}%</TableCell>
                                    <TableCell className="text-center space-x-1">
                                        {/* Tombol Edit */}
                                         <Dialog open={editComponentDialog.isOpen && editComponentDialog.data?.id === comp.id} onOpenChange={(open) => !open && setEditComponentDialog({ isOpen: false, data: null, isLoading: false })}>
                                            <DialogTrigger asChild>
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditComponentDialog({ isOpen: true, data: comp, isLoading: false })}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <form onSubmit={handleEditComponentSubmit}>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Komponen Penilaian</DialogTitle>
                                                        <DialogDescription>Ubah nama atau bobot untuk komponen "{comp.name}".</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="edit-comp-name" className="text-right">Nama</Label>
                                                            <Input id="edit-comp-name" name="name" defaultValue={comp.name} className="col-span-3" required />
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label htmlFor="edit-comp-weight" className="text-right">Bobot (%)</Label>
                                                            <Input id="edit-comp-weight" name="weight" type="number" min="0.01" step="any" defaultValue={comp.weight} className="col-span-3" required />
                                                        </div>
                                                         {editComponentDialog.error && <p className="col-span-4 text-sm text-red-600 text-center">{editComponentDialog.error}</p>}
                                                    </div>
                                                    <DialogFooter>
                                                        <DialogClose asChild><Button type="button" variant="outline" disabled={editComponentDialog.isLoading}>Batal</Button></DialogClose>
                                                        <Button type="submit" disabled={editComponentDialog.isLoading}>
                                                            {editComponentDialog.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Simpan Perubahan
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                        {/* Tombol Hapus */}
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteComponent(comp)}>
                                            <Trash2 className="h-4 w-4" />
                                             <span className="sr-only">Hapus</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Dialog Konfirmasi Hapus Komponen */}
            <Dialog open={deleteComponentDialog.isOpen} onOpenChange={(open) => !open && setDeleteComponentDialog({ isOpen: false, componentId: null, componentName: null, isLoading: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Yakin ingin menghapus komponen <strong className='mx-1'>"{deleteComponentDialog.componentName}"</strong>? Ini juga akan menghapus semua nilai siswa terkait.
                        </DialogDescription>
                         {deleteComponentDialog.error && <p className="text-sm text-red-600 mt-2">{deleteComponentDialog.error}</p>}
                    </DialogHeader>
                    <DialogFooter>
                        <Button disabled={deleteComponentDialog.isLoading}>Batal</Button>
                        <Button onClick={confirmDeleteComponent} disabled={deleteComponentDialog.isLoading} className="bg-destructive hover:bg-destructive/90">
                            {deleteComponentDialog.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Ya, Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}