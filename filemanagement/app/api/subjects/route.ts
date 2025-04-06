import { NextRequest, NextResponse } from 'next/server';
// Tidak perlu import 'headers' karena kita hardcode token

// Ambil URL base Django API dari environment variable
const DJANGO_API_URL = "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
    // Pastikan base URL Django tersedia
    if (!DJANGO_API_URL) {
         console.error("DJANGO_API_BASE_URL environment variable is not set.");
         return NextResponse.json({ message: 'Konfigurasi server backend tidak ditemukan.' }, { status: 500 });
    }
    const djangoEndpoint = `${DJANGO_API_URL}/api/nilai/subjects/`;
    console.log(`[Next API GET /api/subjects] Forwarding to: ${djangoEndpoint} with hardcoded token`);

    try {
        // Siapkan header untuk dikirim ke Django
        const djangoHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            // Tambahkan header Authorization dengan token hardcode
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzOTg2NTgzLCJpYXQiOjE3NDM5MDAxODMsImp0aSI6IjA1NTZhZDY2OGRkNjQxMzY4YzM0MjViZmJlMGExNmE0IiwidXNlcl9pZCI6MjAsImVtYWlsIjoiZGVmYXVsdGluQGdtYWlsLmNvbSIsInJvbGUiOiJ0ZWFjaGVyIn0.TLG6POTvkiN2-b5iDNUOoZNIYfVRwpzOuxFxfzPVbMM`
        };

        // Lakukan fetch ke Django
        const res = await fetch(djangoEndpoint, {
            method: 'GET',
            headers: djangoHeaders,
            cache: 'no-store', // Selalu ambil data terbaru
        });

        // Handle respons dari Django
        if (!res.ok) {
            let errorData = { message: `Gagal mengambil summary dari backend: ${res.statusText}` };
            try { errorData = await res.json(); } catch (e) {}
            console.error(`[Next API GET /api/subjects] Error from Django: ${res.status}`, errorData);
            // Jika error dari Django 401/403, berarti token hardcode salah/expired
            return NextResponse.json(errorData, { status: res.status });
        }

        // Jika sukses, parse data dan kirim ke frontend
        const data = await res.json();
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        // Handle error jika fetch ke Django gagal (misal Django mati / URL salah)
        console.error(`[Next API GET /api/subjects] Fetch error:`, error);
        return NextResponse.json({ message: 'Terjadi kesalahan saat menghubungi server backend.' }, { status: 503 }); // 503 Service Unavailable
    }
}

// Anda bisa menambahkan handler POST, PUT, DELETE jika diperlukan untuk /api/subjects
// Tapi berdasarkan konteks error, sepertinya hanya GET yang dipanggil frontend saat ini.