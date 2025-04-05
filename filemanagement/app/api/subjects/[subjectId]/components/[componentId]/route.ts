// app/api/subjects/[subjectId]/components/[componentId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Import state dummy
import { dummySubjectComponents, dummyInitialGrades } from '../../gradedata/route'; // Adjust path if needed

// Types
interface AssessmentComponent { id: string; name: string; weight: number; }
interface UpdateComponentPayload { name: string; weight?: number | string | null; }

// ========================================
//  Handler PUT (Edit Komponen In-Memory)
// ========================================
export async function PUT(
    request: NextRequest,
    context: { params: { subjectId: string; componentId: string } }
) {
    // Initialize IDs inside try block after parsing
    let subjectId: string | undefined;
    let componentId: string | undefined;

    try {
        // Parse IDs from URL first
        const pathname = request.nextUrl.pathname;
        const segments = pathname.split('/');
        if (segments.length > 5) {
            subjectId = segments[3];
            componentId = segments[5];
        }

        // Validate parsed IDs early
        if (!subjectId || !componentId) {
             console.error("[API PUT] Failed to parse IDs from URL:", pathname);
             throw new Error('Subject ID atau Component ID tidak valid di URL'); // Throw error to be caught below
        }
        console.log(`[API PUT /api/subjects/${subjectId}/components/${componentId}] Handling request (URL Parsing)...`);


        const body: UpdateComponentPayload = await request.json();
        const { name, weight } = body;
        console.log(`[API PUT] Received payload:`, body);

        // --- Start core logic ---
        // Validation
        if (!name || typeof name !== 'string' || name.trim() === '') { return NextResponse.json({ message: 'Nama wajib' }, { status: 400 }); }
        if (weight === undefined || weight === null || weight === '') { return NextResponse.json({ message: 'Bobot wajib' }, { status: 400 }); }
        const numWeight = Number(weight);
        if (isNaN(numWeight) || numWeight <= 0) { return NextResponse.json({ message: 'Bobot > 0' }, { status: 400 }); }

        // Find and update in memory
        let updatedComponent: AssessmentComponent | null = null;
        let componentFound = false;
        if (dummySubjectComponents[subjectId]) {
            const index = dummySubjectComponents[subjectId].findIndex(c => c.id === componentId);
            if (index !== -1) {
                dummySubjectComponents[subjectId][index] = { ...dummySubjectComponents[subjectId][index], name: name.trim(), weight: numWeight };
                updatedComponent = dummySubjectComponents[subjectId][index];
                componentFound = true;
                console.log(`[API PUT] Component ${componentId} updated successfully.`);
            }
        }

        if (!componentFound) { return NextResponse.json({ message: 'Komponen tidak ditemukan' }, { status: 404 }); }
        // --- End core logic ---

        return NextResponse.json(updatedComponent, { status: 200 });

    } catch (error: any) {
        // Log IDs if available, otherwise use context or 'unknown'
        const logSubjectId = subjectId || context.params?.subjectId || 'unknown';
        const logComponentId = componentId || context.params?.componentId || 'unknown';
        if (error instanceof SyntaxError) { console.error(`[API PUT /api/subjects/${logSubjectId}/components/${logComponentId}] Invalid JSON:`, error); return NextResponse.json({ message: 'Format data JSON tidak valid' }, { status: 400 }); }
        console.error(`[API PUT /api/subjects/${logSubjectId}/components/${logComponentId}] Internal Server Error:`, error);
        return NextResponse.json({ message: error.message || 'Kesalahan Server Internal saat update komponen' }, { status: 500 });
    }
}

// ========================================
//  Handler DELETE (Hapus Komponen In-Memory)
// ========================================
export async function DELETE(
    request: NextRequest,
    context: { params: { subjectId: string; componentId: string } }
) {
    let subjectId: string | undefined;
    let componentId: string | undefined;

    try {
         // Parse IDs from URL first
         const pathname = request.nextUrl.pathname;
         const segments = pathname.split('/');
         if (segments.length > 5) {
             subjectId = segments[3];
             componentId = segments[5];
         }

         // Validate parsed IDs early
         if (!subjectId || !componentId) {
              console.error("[API DELETE] Failed to parse IDs from URL:", pathname);
              throw new Error('Subject ID atau Component ID tidak valid di URL');
         }
         console.log(`[API DELETE /api/subjects/${subjectId}/components/${componentId}] Handling request (URL Parsing)...`);

        // --- Start core logic ---
        let componentFound = false;
        if (dummySubjectComponents[subjectId]) {
            const initialLength = dummySubjectComponents[subjectId].length;
            dummySubjectComponents[subjectId] = dummySubjectComponents[subjectId].filter(comp => comp.id !== componentId);
            componentFound = dummySubjectComponents[subjectId].length < initialLength;
        }

        if (!componentFound) { return NextResponse.json({ message: 'Komponen tidak ditemukan' }, { status: 404 }); }

        let gradesDeletedCount = 0;
        for (const studentId in dummyInitialGrades) { if (dummyInitialGrades[studentId]?.[componentId] !== undefined) { delete dummyInitialGrades[studentId][componentId]; gradesDeletedCount++; } }
        console.log(`[API DELETE] Component ${componentId} removed. Deleted ${gradesDeletedCount} grade entries.`);
        // --- End core logic ---

        return NextResponse.json({ message: `Komponen dan nilai terkait berhasil dihapus.` }, { status: 200 });

    } catch (error: any) {
        const logSubjectId = subjectId || context.params?.subjectId || 'unknown';
        const logComponentId = componentId || context.params?.componentId || 'unknown';
        console.error(`[API DELETE /api/subjects/${logSubjectId}/components/${logComponentId}] Internal Server Error:`, error);
        return NextResponse.json({ message: error.message || 'Kesalahan Server Internal saat hapus komponen' }, { status: 500 });
    }
}