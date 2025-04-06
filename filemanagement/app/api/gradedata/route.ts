// Lokasi: app/api/gradedata/route.ts
import { NextRequest, NextResponse } from 'next/server';
// ... impor lain jika perlu ...

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';

// Handler GET
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    // ... (validasi subjectId, get token, dll) ..
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzOTg2NTgzLCJpYXQiOjE3NDM5MDAxODMsImp0aSI6IjA1NTZhZDY2OGRkNjQxMzY4YzM0MjViZmJlMGExNmE0IiwidXNlcl9pZCI6MjAsImVtYWlsIjoiZGVmYXVsdGluQGdtYWlsLmNvbSIsInJvbGUiOiJ0ZWFjaGVyIn0.TLG6POTvkiN2-b5iDNUOoZNIYfVRwpzOuxFxfzPVbMM";

    try {
        // --- PERBAIKI URL DI SINI ---
        const djangoUrl = `${DJANGO_API_URL}/api/nilai/subjects/${subjectId}/gradedata/`; // <<< HAPUS '}' di akhir
        // ---------------------------
        console.log(`[API Route /api/gradedata] Forwarding GET request to Django: ${djangoUrl}`); // URL yg benar akan tercetak

        const djangoHeaders: HeadersInit = {'Content-Type': 'application/json','Authorization': `Bearer ${token}`};
        const response = await fetch(djangoUrl, { method: 'GET', headers: djangoHeaders, cache: 'no-store' });

        
         // Cek jika Django merespons error
         if (!response.ok) {
             let errorData;
             try {
                 errorData = await response.json();
             } catch (e) {
                errorData = { message: `Django API error: ${response.status} ${response.statusText}` };
             }
             console.error("[API Route /api/gradedata] Error from Django POST:", errorData);
             return NextResponse.json(errorData, { status: response.status });
         }

         // Jika sukses, teruskan respons dari Django
         const data = await response.json();
         console.log("[API Route /api/gradedata] Successfully posted data to Django.");
         return NextResponse.json(data, { status: response.status }); // Biasanya 200 atau 201

     } catch (error) {
         console.error("[API Route /api/gradedata] Internal server error during POST:", error);
         if (error instanceof SyntaxError) {
              return NextResponse.json({ message: "Format JSON pada request body tidak valid." }, { status: 400 });
         }
         return NextResponse.json({ message: "Terjadi kesalahan pada server Next.js saat menyimpan." }, { status: 500 });
     }
}

// Handler POST
export async function POST(request: NextRequest) {
     const { searchParams } = new URL(request.url);
     const subjectId = searchParams.get('subjectId');
     // ... (validasi subjectId, get token, dll) ...
     const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzOTg2NTgzLCJpYXQiOjE3NDM5MDAxODMsImp0aSI6IjA1NTZhZDY2OGRkNjQxMzY4YzM0MjViZmJlMGExNmE0IiwidXNlcl9pZCI6MjAsImVtYWlsIjoiZGVmYXVsdGluQGdtYWlsLmNvbSIsInJvbGUiOiJ0ZWFjaGVyIn0.TLG6POTvkiN2-b5iDNUOoZNIYfVRwpzOuxFxfzPVbMM"; // Ganti dengan token atau logic get token

     try {
         const body = await request.json();
         // --- PERBAIKI URL DI SINI ---
        const djangoUrl = `${DJANGO_API_URL}/api/nilai/subjects/${subjectId}/gradedata/`; // <<< HAPUS '}' di akhir
         // ---------------------------
         console.log(`[API Route /api/gradedata] Forwarding POST request to Django: ${djangoUrl}`);

         const djangoHeaders: HeadersInit = {'Content-Type': 'application/json','Authorization': `Bearer ${token}`};
         const response = await fetch(djangoUrl, { method: 'POST', headers: djangoHeaders, body: JSON.stringify(body) });

         
         // Cek jika Django merespons error
         if (!response.ok) {
             let errorData;
             try {
                 errorData = await response.json();
             } catch (e) {
                errorData = { message: `Django API error: ${response.status} ${response.statusText}` };
             }
             console.error("[API Route /api/gradedata] Error from Django POST:", errorData);
             return NextResponse.json(errorData, { status: response.status });
         }

         // Jika sukses, teruskan respons dari Django
         const data = await response.json();
         console.log("[API Route /api/gradedata] Successfully posted data to Django.");
         return NextResponse.json(data, { status: response.status }); // Biasanya 200 atau 201

     } catch (error) {
         console.error("[API Route /api/gradedata] Internal server error during POST:", error);
         if (error instanceof SyntaxError) {
              return NextResponse.json({ message: "Format JSON pada request body tidak valid." }, { status: 400 });
         }
         return NextResponse.json({ message: "Terjadi kesalahan pada server Next.js saat menyimpan." }, { status: 500 });
     }
}