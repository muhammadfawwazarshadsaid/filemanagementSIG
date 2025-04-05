// app/api/subjects/[subjectId]/components/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Impor state dummy dari lokasi yang benar
import { v4 as uuidv4 } from 'uuid';
import { dummySubjectComponents } from '../gradedata/route';

interface NewComponentData {
    name: string;
    weight?: number | string | null; // Terima bobot
}
// Tipe ini harus konsisten
interface AssessmentComponent { id: string; name: string; weight: number; }

export async function POST(
    request: NextRequest,
    { params }: { params: { subjectId: string } }
) {
    const subjectId = params.subjectId;
    console.log(`[API POST /api/subjects/${subjectId}/components] Add Component`);
    if (!subjectId) return NextResponse.json({ message: 'Subject ID diperlukan' }, { status: 400 });

    try {
        const body: NewComponentData = await request.json();
        const { name, weight } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ message: 'Nama komponen wajib diisi' }, { status: 400 });
        }
        if (weight === undefined || weight === null || weight === '') {
            return NextResponse.json({ message: 'Bobot (%) komponen wajib diisi' }, { status: 400 });
        }
        const numWeight = Number(weight);
        if (isNaN(numWeight) || numWeight <= 0) {
            return NextResponse.json({ message: 'Bobot (%) harus angka positif' }, { status: 400 });
        }

        const newComponent: AssessmentComponent = {
            id: `comp-${uuidv4().substring(0, 8)}`,
            name: name.trim(),
            weight: numWeight, // Simpan bobot
        };

        if (!dummySubjectComponents[subjectId]) { dummySubjectComponents[subjectId] = []; }
        dummySubjectComponents[subjectId].push(newComponent);

        console.log(`[API POST /api/subjects/${subjectId}/components] Component added:`, newComponent);
        await new Promise(resolve => setTimeout(resolve, 150));

        return NextResponse.json(newComponent, { status: 201 }); // Kembalikan komponen yg baru dibuat

    } catch (error: any) {
        if (error instanceof SyntaxError) return NextResponse.json({ message: 'Format JSON tidak valid' }, { status: 400 });
        console.error(`[API POST /api/subjects/${subjectId}/components] Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal' }, { status: 500 });
    }
}