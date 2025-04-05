// app/api/subjects/[subjectId]/details/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Impor state dummy dari lokasi yang benar
import { dummySubjectComponents } from '@/app/api/subjects/[subjectId]/gradedata/route';
import { dummySubjectOutcomes } from '../outcomes/route';

// Tipe data komponen harus konsisten
interface AssessmentComponent { id: string; name: string; weight: number; }

export async function GET(
    request: NextRequest,
    { params }: { params: { subjectId: string } }
) {
    // !! Ambil subjectId dari URL, BUKAN dari context.params !!
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const subjectId = segments[3];
    console.log(`[API GET /api/subjects/${subjectId}/details]`);
    if (!subjectId) {
        return NextResponse.json({ message: 'Subject ID diperlukan' }, { status: 400 });
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 150)); // Simulate delay

        // Ambil data dari state dummy
        const subjectName = subjectId.charAt(0).toUpperCase() + subjectId.slice(1); // Nama dummy
        const outcomes = dummySubjectOutcomes[subjectId] || dummySubjectOutcomes['default'];
        const components: AssessmentComponent[] = dummySubjectComponents[subjectId] || dummySubjectComponents['default'] || [];

        // Gabungkan dalam satu respons
        const responseData = {
            id: subjectId,
            name: `Mata Pelajaran ${subjectName}`, // Nama lebih lengkap
            outcomes: outcomes,
            assessmentComponents: components,
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`[API GET /api/subjects/${subjectId}/details] Error:`, error);
        return NextResponse.json({ message: 'Kesalahan Server Internal' }, { status: 500 });
    }
}