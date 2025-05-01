"use client"; // Pastikan ini client component

import React, { useState, useEffect } from 'react'; // Impor hook
import Image from 'next/image'
import { LoginForm } from "@/components/login-form" // Asumsi path LoginForm benar
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// Impor komponen Dialog dari shadcn/ui
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter // Impor DialogFooter jika perlu tombol
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"; // Impor Button untuk tombol close
import { MailOpen } from 'lucide-react'; // Impor ikon MailOpen

export default function LoginPage() {
  // State untuk menyimpan ID workspace yang tertunda
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState<string | null>(null);
  // State untuk mengontrol visibilitas modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Cek sessionStorage saat komponen mount di client
  useEffect(() => {
    const pendingId = sessionStorage.getItem('pendingJoinWorkspaceId');
    if (pendingId) {
      console.log("Pending join detected:", pendingId); // Debug log
      setPendingWorkspaceId(pendingId);
      setIsInviteModalOpen(true); // Buka modal secara otomatis
      // ID tidak dihapus di sini, dihapus di page.tsx setelah join berhasil
    }
  }, []); // Hanya jalan sekali saat mount

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-white text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <div className="border-4 border-gray-200 rounded-lg">
                <Avatar className="h-8 w-8 ">
                  <AvatarImage src="/logo.png" alt="logo" />
                  <AvatarFallback className="">SIG</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs space-y-4">
            {/* Render Login Form - Pesan info sekarang ada di modal */}
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        {/* Gambar Placeholder */}
        <img
          src="/placeholder.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>

      {/* --- [BARU] Render Modal Undangan --- */}
      {/* Modal hanya dirender jika pendingWorkspaceId ada,
          dan dikontrol oleh isInviteModalOpen */}
      {pendingWorkspaceId && (
          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader className="text-center sm:text-left">
                <DialogTitle className="flex items-center justify-center sm:justify-start gap-2">
                   <MailOpen className="h-5 w-5 text-blue-600" /> {/* Ikon diberi warna */}
                   Terima Undangan
                </DialogTitle>
                <DialogDescription className="pt-2">
                  Rekan Anda sudah mengundang Anda untuk bergabung ke workspace. Silakan masuk ke akun Anda, dan Anda akan otomatis ditambahkan.
                </DialogDescription>
              </DialogHeader>
              {/* Anda bisa menambahkan detail lain jika perlu */}
              {/* <div className="grid gap-4 py-4">
                 Workspace ID: {pendingWorkspaceId}
              </div> */}
              <DialogFooter>
                <Button onClick={() => setIsInviteModalOpen(false)}>Mengerti</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      )}
       {/* --- Akhir Modal Undangan --- */}

    </div>
  )
}