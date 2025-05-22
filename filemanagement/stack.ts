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
            'https://www.googleapis.com/authdrive.readonly',
            'https://www.googleapis.com/auth/drive',
        ]
    },
    urls: {
      afterSignIn: '/selesaikanpendaftaran', // atau '/' jika pendaftaran selesai
    },

});

// Baris ini sepertinya untuk demo/debug, biarkan saja jika masih relevan
(stackServerApp as any).__DEMO_ENABLE_SLIGHT_FETCH_DELAY = true;