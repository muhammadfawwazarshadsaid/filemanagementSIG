import { GoogleAuth } from 'google-auth-library';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Tipe data untuk response sukses.
 * Access token bisa null atau undefined jika proses auth gagal di sisi Google.
 */
type TokenResponse = {
    accessToken: string | null | undefined;
};

/**
 * Tipe data untuk response error.
 */
type ErrorResponse = {
    error: string;
};

/**
 * Handler untuk API route /api/get-gcp-token.
 * Hanya mengizinkan metode GET.
 * Mengambil access token Google Cloud menggunakan kredensial service account
 * yang disimpan di environment variable (Base64 encoded).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TokenResponse | ErrorResponse> // Response bisa berupa token atau error
) {
    // 1. Hanya izinkan metode GET
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    try {
        // 2. Ambil Kredensial Service Account dari Environment Variable (Base64)
        const credsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
        if (!credsBase64) {
            console.error('[API Error] Environment variable GOOGLE_APPLICATION_CREDENTIALS_BASE64 not set.');
            return res.status(500).json({ error: 'Server configuration error: Service account credentials missing.' });
        }

        // 3. Decode Base64 menjadi string JSON
        let credsJsonString: string;
        try {
            credsJsonString = Buffer.from(credsBase64, 'base64').toString('utf-8');
        } catch (e) {
             console.error('[API Error] Failed to decode Base64 credentials:', e);
             // Error ini biasanya karena string Base64 tidak valid
             return res.status(500).json({ error: 'Server configuration error: Invalid Base64 encoding for credentials.' });
        }

        // 4. Parse string JSON menjadi objek JavaScript
        let credentials;
        try {
             // Kita tidak mendefinisikan tipe spesifik untuk credentials di sini
             // karena strukturnya kompleks dan `google-auth-library` akan menanganinya.
             credentials = JSON.parse(credsJsonString);
        } catch (e) {
            console.error('[API Error] Failed to parse credentials JSON:', e);
            // Error ini biasanya karena format JSON tidak valid setelah decode
            return res.status(500).json({ error: 'Server configuration error: Invalid JSON format for credentials.' });
        }

        // 5. Ambil Scopes dari Environment Variable
        const scopesEnv = process.env.GOOGLE_API_SCOPES;
        if (!scopesEnv || scopesEnv.trim() === '') {
            console.error('[API Error] Environment variable GOOGLE_API_SCOPES not set or is empty.');
            return res.status(500).json({ error: 'Server configuration error: API Scopes missing or empty.' });
        }
        // Pisahkan scopes jika ada lebih dari satu (dipisahkan spasi)
        const scopes: string[] = scopesEnv.split(' ').filter(s => s.trim() !== ''); // filter string kosong

        // 6. Validasi apakah ada scope setelah diproses
        if (scopes.length === 0) {
             console.error('[API Error] No valid scopes found after processing GOOGLE_API_SCOPES.');
             return res.status(500).json({ error: 'Server configuration error: No valid API Scopes provided.' });
        }

        console.log(`[API Info] Requesting token with scopes: ${scopes.join(', ')}`);

        // 7. Inisialisasi GoogleAuth dengan kredensial dan scopes
        const auth = new GoogleAuth({
            credentials,
            scopes: scopes,
        });

        // 8. Dapatkan Access Token dari Google
        // Metode ini menangani pembuatan dan penandatanganan JWT serta pertukaran dengan token akses
        const accessToken = await auth.getAccessToken();

        // 9. Kirim Access Token sebagai Response Sukses
        console.log('[API Info] Successfully obtained access token.');
        res.status(200).json({ accessToken });

    } catch (error: unknown) { // Tangkap semua jenis error
        console.error('[API Error] Failed to get GCP access token:', error);

        let errorMessage = 'An unexpected error occurred while trying to get the access token.';
        // Coba dapatkan pesan error yang lebih spesifik
        if (error instanceof Error) {
            // Error dari google-auth-library atau error JS lainnya
            errorMessage = `Failed to get access token: ${error.message}`;
        } else if (typeof error === 'string') {
             // Jika error yang dilempar berupa string (jarang terjadi)
            errorMessage = error;
        }

        // Kirim response error
        res.status(500).json({ error: errorMessage });
    }
}