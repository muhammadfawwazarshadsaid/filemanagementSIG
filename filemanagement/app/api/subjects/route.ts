// app/api/guru/mata-pelajaran/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AssessmentComponent, taughtClassesDb } from './dummy';

// Definisikan TaughtClassSummary jika belum ada di dummy-data/schema
interface TaughtClassSummary {
    id: string; subjectId: string; name: string; academicYear: string;
    totalWeight: number; componentCount: number; studentCount: number;
    status: 'Terisi Penuh' | 'Dalam Proses' | 'Belum Dimulai';
    components: AssessmentComponent[];
}


export async function GET(request: NextRequest) {
    console.log("[API GET /api/guru/mata-pelajaran] Fetching subject list summary...");

    try {
        // Sekarang bisa langsung akses taughtClassesDb yang diimpor
        const summaryList: TaughtClassSummary[] = taughtClassesDb.map(taughtClass => {
            const components = taughtClass.components || [];
            const componentCount = components.length;
            const totalWeight = components.reduce((sum, comp) => sum + (Number(comp.weight) || 0), 0);
            const studentCount = taughtClass.studentIds.length;

            // Hitung Status Pengisian Nilai
            let status: TaughtClassSummary['status'] = 'Belum Dimulai';
            let filledCount = 0;
            const totalPossibleEntries = studentCount * componentCount;

            if (totalPossibleEntries > 0) {
                taughtClass.studentIds.forEach(studentId => {
                    components.forEach(component => {
                        if (taughtClass.grades[studentId]?.[component.id] != null) {
                            filledCount++;
                        }
                    });
                });
                if (filledCount === totalPossibleEntries) status = 'Terisi Penuh';
                else if (filledCount > 0) status = 'Dalam Proses';
            }

            return {
                id: taughtClass.id, subjectId: taughtClass.subjectId, name: taughtClass.subjectName,
                academicYear: taughtClass.academicYear, totalWeight: totalWeight,
                componentCount: componentCount, studentCount: studentCount, status: status,
                components: components
            };
        });

        await new Promise(resolve => setTimeout(resolve, 50)); // Delay simulasi

        console.log("[API GET /api/guru/mata-pelajaran] Summary generated:", summaryList.length);
        return NextResponse.json(summaryList, { status: 200 });

    } catch (error) {
        console.error("[API GET /api/guru/mata-pelajaran] Error:", error);
        return NextResponse.json({ message: 'Kesalahan Server Internal' }, { status: 500 });
    }
}