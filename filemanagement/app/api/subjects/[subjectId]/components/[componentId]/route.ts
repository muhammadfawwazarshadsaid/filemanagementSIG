// app/api/subjects/[subjectId]/components/[componentId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { dummySubjectComponents, dummyInitialGrades } from '../../gradedata/route';
// Pastikan path impor ini benar sesuai struktur proyek Anda

// Tipe data (konsisten)
interface AssessmentComponent { id: string; name: string; weight: number; }
interface UpdateComponentPayload {
    name: string;
    weight?: number | string | null;
}

// ========================================
//  Handler PUT (Untuk Edit Komponen)
// ========================================
export async function PUT(
    request: NextRequest,
    { params }: { params: { subjectId: string; componentId: string } }
) {
    const { subjectId, componentId } = params;
    console.log(`[API PUT /api/subjects/${subjectId}/components/${componentId}] Handling request...`); // Log saat request masuk
    if (!subjectId || !componentId) {
        return NextResponse.json({ message: 'Subject ID dan Component ID diperlukan' }, { status: 400 });
    }

    try {
        const body: UpdateComponentPayload = await request.json();
        const { name, weight } = body;
        console.log(`[API PUT] Received payload:`, body); // Log payload

        // Validasi input
        if (!name || typeof name !== 'string' || name.trim() === '') {
            console.warn('[API PUT] Invalid name:', name);
            return NextResponse.json({ message: 'Nama komponen wajib diisi' }, { status: 400 });
        }
        if (weight === undefined || weight === null || weight === '') {
            console.warn('[API PUT] Invalid weight (missing):', weight);
             return NextResponse.json({ message: 'Bobot (%) komponen wajib diisi' }, { status: 400 });
        }
        const numWeight = Number(weight);
        if (isNaN(numWeight) || numWeight <= 0) {
            console.warn('[API PUT] Invalid weight (value):', weight);
            return NextResponse.json({ message: 'Bobot (%) harus angka positif' }, { status: 400 });
        }

        // Cari dan update komponen di state dummy
        let updatedComponent: AssessmentComponent | null = null;
        if (dummySubjectComponents[subjectId]) {
            const componentIndex = dummySubjectComponents[subjectId].findIndex(comp => comp.id === componentId);

            if (componentIndex !== -1) {
                // Komponen ditemukan, lakukan update
                dummySubjectComponents[subjectId][componentIndex] = {
                    ...dummySubjectComponents[subjectId][componentIndex],
                    name: name.trim(),
                    weight: numWeight,
                };
                updatedComponent = dummySubjectComponents[subjectId][componentIndex];
                 console.log(`[API PUT] Component ${componentId} updated successfully.`);
            } else {
                 console.warn(`[API PUT] Component ${componentId} not found in subject ${subjectId}.`);
            }
        } else {
             console.warn(`[API PUT] Subject ${subjectId} not found in dummySubjectComponents.`);
        }

        if (!updatedComponent) {
            // Jika komponen tidak ditemukan
            return NextResponse.json({ message: 'Komponen tidak ditemukan' }, { status: 404 });
        }

        await new Promise(resolve => setTimeout(resolve, 50)); // Delay kecil

        // Kembalikan komponen yang sudah diupdate
        return NextResponse.json(updatedComponent, { status: 200 });

    } catch (error: any) {
        if (error instanceof SyntaxError) {
             console.error(`[API PUT /api/subjects/${subjectId}/components/${componentId}] Invalid JSON:`, error);
            return NextResponse.json({ message: 'Format data JSON tidak valid' }, { status: 400 });
        }
        console.error(`[API PUT /api/subjects/${subjectId}/components/${componentId}] Internal Server Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal saat update komponen' }, { status: 500 });
    }
}

// ========================================
//  Handler DELETE (Untuk Hapus Komponen)
// ========================================
export async function DELETE(
    request: NextRequest,
    { params }: { params: { subjectId: string; componentId: string } }
) {
    const { subjectId, componentId } = params;
    console.log(`[API DELETE /api/subjects/${subjectId}/components/${componentId}] Handling request...`);
    if (!subjectId || !componentId) {
        return NextResponse.json({ message: 'Subject ID dan Component ID diperlukan' }, { status: 400 });
    }
    try {
        let componentFound = false;
        if (dummySubjectComponents[subjectId]) {
            const initialLength = dummySubjectComponents[subjectId].length;
            dummySubjectComponents[subjectId] = dummySubjectComponents[subjectId].filter(comp => comp.id !== componentId);
            componentFound = dummySubjectComponents[subjectId].length < initialLength;
        }

        if (!componentFound) {
             console.warn(`[API DELETE] Component ${componentId} not found for subject ${subjectId}.`);
            return NextResponse.json({ message: 'Komponen tidak ditemukan' }, { status: 404 });
        }

        // Hapus nilai terkait dari dummyInitialGrades
        let gradesDeletedCount = 0;
        for (const studentId in dummyInitialGrades) {
            if (dummyInitialGrades[studentId]?.[componentId] !== undefined) {
                delete dummyInitialGrades[studentId][componentId];
                gradesDeletedCount++;
            }
        }
        console.log(`[API DELETE] Component ${componentId} removed. Deleted ${gradesDeletedCount} grade entries.`);
        await new Promise(resolve => setTimeout(resolve, 50));

        // Return 200 OK dengan pesan sukses
        return NextResponse.json({ message: `Komponen dan nilai terkait berhasil dihapus` }, { status: 200 });

    } catch (error) {
        console.error(`[API DELETE /api/subjects/${subjectId}/components/${componentId}] Internal Server Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal saat hapus komponen' }, { status: 500 });
    }
}