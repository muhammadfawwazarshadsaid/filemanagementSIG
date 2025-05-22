// Di file stack.ts (atau file konfigurasi server Anda)
import "server-only"; // Bagus, memastikan ini hanya berjalan di server

import { StackServerApp } from "@stackframe/stack"; // Lebih baik gunakan /server import jika tersedia

export const stackServerApp = new StackServerApp({
    // Pengaturan Anda yang sudah ada:
    tokenStore: "nextjs-cookie",

    // --- TAMBAHKAN KONFIGURASI INI ---
    /**
     * Meminta scope tambahan saat pengguna sign-in/sign-up via OAuth.
     * Ini untuk menghindari permintaan izin kedua kali saat fitur terkait digunakan.
     */
    oauthScopesOnSignIn: {
        google: [
            // Scope standar yang biasanya diperlukan:
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'openid',

            // Scope TAMBAHAN yang kita inginkan untuk Google Drive:
            // Pilih sesuai kebutuhan:
            // 'https://www.googleapis.com/auth/drive.readonly', // Hanya baca
            // 'https://www.googleapis.com/auth/drive.file', // Akses per-file
            'https://www.googleapis.com/auth/drive', // Akses penuh
        ],
        // Tambahkan provider lain jika perlu
        // microsoft: ['User.Read', 'Files.ReadWrite.AppFolder'],
    },
    // ------------------------------------

    // Opsional: Tambahkan URL redirect jika perlu
    urls: {
      afterSignIn: '/sambungkan-google',
    },

});

// Baris ini sepertinya untuk demo/debug, biarkan saja jika masih relevan
(stackServerApp as any).__DEMO_ENABLE_SLIGHT_FETCH_DELAY = true;