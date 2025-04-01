"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { ChevronLeft, Eye, EyeClosed, EyeOff, LucideEye, MailIcon } from "lucide-react"
import { useStackApp } from "@stackframe/stack"
import { useState } from "react"

export function LupaPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const onSubmitSendLink = useStackApp();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const onSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    try {
      const result = await onSubmitSendLink.sendMagicLinkEmail(email);
      if (result?.status === 'error') {
        setError(`Error: ${result.error.message}`);
      } else {
        setSuccess('Tautan masuk berhasil dikirim ke email.');
      }
    } catch (err) {
      setError(`An unexpected error occurred`);
    }
  };

  return (
    <form className={cn("flex flex-col gap-6 bg-background", className)} {...props} onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      
      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <a href="/masuk" className="flex pl-2 pr-4 py-3 border border-black/30 rounded-full gap-2 font-medium text-md"><ChevronLeft></ChevronLeft> Kembali</a>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Lupa Password
        </h1>
        <p className="text-muted-foreground text-sm text-balance font-plus-jakarta">
          Anda akan dikirimi tautan masuk ke email
        </p>
        <p className="text-primary font-bold text-sm text-balance font-plus-jakarta">
          {error}
        </p>
        <p className="text-[oklch(0.61_0.1998_146)] font-bold text-sm text-balance font-plus-jakarta">
          {success}
        </p>
      </div>
      <div className="grid gap-6">
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
        <Button type="submit" className="w-full font-bold">
          <MailIcon></MailIcon>
          Kirim Tautan Masuk
        </Button>
        
      </div>
      {/* <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="#" className="underline underline-offset-4">
          Sign up
        </a>
      </div> */}
    </form>
  )
}
