"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, MailIcon, KeyRound } from "lucide-react"
import { useStackApp } from "@stackframe/stack"
import { useState } from "react"
// import { useRouter } from "next/router"

export function LupaPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const onSubmitSendLink = useStackApp();

  // const route = useRouter()
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [nonce, setNonce] = useState(''); // State untuk menyimpan nonce

  const verifyOtp = async () => {
    try {
      const codeToVerify = otp.toLowerCase() + nonce.toLowerCase();
      console.log(codeToVerify)
      const result = await onSubmitSendLink.signInWithMagicLink(codeToVerify);
      // route.push("/")
      if (result?.status === 'error') {
      console.error("signInWithMagicLink error:", result.error);
      setVerifyError(`Error: ${result.error?.message || 'Unknown error'}`);
        if (result.error.errorCode === 'VERIFICATION_CODE_NOT_FOUND'){
          setVerifyError("Kode verifikasi tidak ditemukan. Pastikan kode yang anda masukan benar.");
        }
      } else {
        setVerifySuccess('OTP berhasil diverifikasi.');
      }
    } catch (err) {
      setVerifyError(`An unexpected error occurred`);
      console.error("signInWithMagicLink catch error:", err);
    }
  };

  async function onSubmit() {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      const sendLink = await onSubmitSendLink.sendMagicLinkEmail(email);

      // Cek status response
      if (sendLink?.status === 'ok') {
        // Mengambil nilai nonce dari data response
        const newNonce = sendLink.data?.nonce;
        setNonce(newNonce); // Set state nonce
        setShowOtpForm(true); // Tampilkan form OTP
        console.log("New Nonce from API:", newNonce); 
        setSuccess(`Kode OTP berhasil dikirim ke email.`);
        // setSuccess(`Kode OTP berhasil dikirim ke email. ${newNonce}`);
      } else {
        setError(`Error: ${sendLink?.error?.message || 'Unknown error'}`); // pesan error
        console.error("Error:", sendLink?.error?.message);
      }
    } catch (error) {
      setError(`An unexpected error occurred`); // pesan error
      console.error("Failed to send code:", error);
    }
  }

  return (
    <form className={cn("flex flex-col gap-6 bg-background", className)} {...props} onSubmit={(e) => { e.preventDefault(); showOtpForm ? verifyOtp() : onSubmit(); }}>

      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <a href="/masuk" className="flex pl-2 pr-4 py-3 border border-black/30 rounded-full gap-2 font-medium text-md"><ChevronLeft></ChevronLeft> Kembali</a>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Masuk dengan Tautan
        </h1>
        <p className="text-muted-foreground text-sm text-balance font-plus-jakarta">
          {showOtpForm ? "Masukkan kode OTP yang dikirim ke email anda" : "Anda akan dikirimi kode OTP ke email"}
        </p>
        <p className="text-primary font-bold text-sm text-balance font-plus-jakarta">
          {error || verifyError}
        </p>
        <p className="text-[oklch(0.61_0.1998_146)] font-bold text-sm text-balance font-plus-jakarta">
          {success || verifySuccess}
        </p>
      </div>
      <div className="grid gap-6">
        {showOtpForm ? (
          <div className="grid gap-3">
            <Label htmlFor="otp">Kode OTP</Label>
            <Input
              className="h-12 "
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              placeholder="123456"
              required />
          </div>
        ) : (
          <div className="grid gap-3">
            <Label htmlFor="email">Email</Label>
            <Input
              className="h-12 "
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="m@example.com"
              required />
          </div>
        )}
        <Button type="submit" className="w-full font-bold">
          {showOtpForm ? <KeyRound /> : <MailIcon />}
          {showOtpForm ? "Verifikasi OTP" : "Kirim Kode OTP"}
        </Button>
      </div>
    </form>
  )
}