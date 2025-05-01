"use client" // Pastikan ini adalah Client Component

import React, { useState, useEffect } from "react"; // Impor hook yang diperlukan
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // 1. Dapatkan tema dari next-themes
  const { theme = "system" } = useTheme(); // Default ke "system" jika undefined

  // 2. State untuk memastikan komponen sudah mount di client
  const [mounted, setMounted] = useState(false);

  // 3. Set mounted menjadi true hanya di client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // 4. Tentukan tema untuk Sonner (Sonner menerima 'light', 'dark', 'system')
  //    Kita bisa langsung meneruskan nilai dari useTheme karena Sonner mendukungnya.
  //    Namun, kita bungkus dalam pengecekan `mounted` untuk menghindari hydration error.
  const sonnerTheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'system';

  // 5. Jangan render Sonner di server atau sebelum hydration selesai
  if (!mounted) {
    // Mengembalikan null atau placeholder untuk menghindari mismatch
    // Atau bisa juga render Sonner dengan tema default TAPI cek `mounted` lebih aman
    return null;
  }

  // 6. Render Sonner setelah mounted dengan tema yang sudah ditentukan
  return (
    <Sonner
      // Gunakan tema yang sudah dipastikan ('light', 'dark', atau 'system')
      theme={sonnerTheme as NonNullable<ToasterProps["theme"]>} // Cast setelah divalidasi/ditentukan
      position="top-center" // Posisi yang Anda inginkan
      className="toaster group" // ClassName untuk Toaster container
      toastOptions={{
        classNames: {
          // Styling untuk toast individual
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-background dark:group-[.toaster]:text-foreground", // Gunakan variabel CSS tema
          description: "group-[.toast]:text-muted-foreground", // Warna deskripsi
          // Styling untuk tombol (sesuaikan dengan style guide Anda)
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground", // Tombol Aksi Utama
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground", // Tombol Batal/Sekunder
          // Anda bisa menambahkan styling untuk icon, loader, dll. jika perlu
          // error: "...",
          // success: "...",
          // warning: "...",
          // info: "...",
        },
      }}
      {...props} // Teruskan props lainnya
    />
  )
}

export { Toaster }