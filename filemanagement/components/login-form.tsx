"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { Eye, EyeClosed, EyeOff, LucideEye } from "lucide-react"
import { useStackApp, useUser } from "@stackframe/stack"
import { useState } from "react"
import Cookies from "js-cookie";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const oauthLogin = useStackApp();
  const onSubmitLogin = useStackApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const onSubmit = async () => {
    if (!email) {
      setErrorEmail('Mohon masukkan email Anda');
      return;
    }
    if (!password) {
      setErrorPassword('Mohon masukkan password Anda');
      return;
    }
    // This will redirect to app.urls.afterSignIn if successful.
    // You can customize the redirect URL in the StackServerApp constructor.
    const result = await onSubmitLogin.signInWithCredential({ email, password });
    // It's better to handle each error code separately, but for simplicity,
    // we'll just display the error message directly here.
    if (result.status === 'error') {
      setError("Email atau password salah");
    }
    // const user = useUser({ or: 'redirect' });
    // const accessToken = String(user.currentSession.getTokens)
    // Cookies.set("has_password", String(user?.hasPassword), { expires: 7 });
    // Cookies.set("auth_token", accessToken, { expires: 7 });
  };
  
  const signInWithAuthGoogle = async () => {
    await oauthLogin.signInWithOAuth('google');
    // const user = useUser({ or: 'redirect' });
    // const account = user.useConnectedAccount('google', { or: 'redirect'});
    // const { accessToken } = account.useAccessToken();
    // Cookies.set("has_password", String(user?.hasPassword), { expires: 7 });
    // Cookies.set("auth_token", accessToken, { expires: 7 });
  }
  const signInWithAuthMicrosoft = async () => {
    await oauthLogin.signInWithOAuth('microsoft');
    // const user = useUser({ or: 'redirect' });
    // // const account = user.useConnectedAccount('microsoft', { or: 'redirect', scopes: ['https://graph.microsoft.com/.default'] });
    // const account = user.useConnectedAccount('microsoft', { or: 'redirect'});
    // const { accessToken } = account.useAccessToken();
    
    // Cookies.set("has_password", String(user?.hasPassword), { expires: 7 });
    // Cookies.set("auth_token", accessToken, { expires: 7 });
  }


  return (
    <form className={cn("flex flex-col gap-6 bg-background", className)} {...props} onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      
      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Akses Portal Manajemen Berkas
        </h1>
        <p className="text-muted-foreground  text-sm">Admin memberikan email dan password Google untuk masuk.</p>
        <p className="text-primary font-bold text-sm text-balance font-plus-jakarta">
          {error}
        </p>
      </div>
      <div className="grid gap-6">
        <div>
          <Button variant="outline" type="button" className="w-full mb-2" onClick={signInWithAuthGoogle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="705.6" height="720" viewBox="0 0 186.69 190.5">
              <g transform="translate(1184.583 765.171)">
                <path clipPath="none" mask="none" d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z" fill="#4285f4"/>
                <path clipPath="none" mask="none" d="M-1142.714-651.791l-6.972 5.337-24.679 19.223h0c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.34-39.226z" fill="#34a853"/>
                <path clipPath="none" mask="none" d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z" fill="#fbbc05"/>
                <path d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.533-22.514 28.575-39.226 53.34-39.226z" fill="#ea4335" clipPath="none" mask="none"/>
              </g>
            </svg>
            Masuk dengan Google
          </Button>
          {/* <Button variant="outline" type="button" className="w-full" onClick={signInWithAuthMicrosoft}>
            <img src="/microsoft.png" alt="Microsoft Logo" width="16" height="16" />
            Masuk dengan Microsoft
          </Button> */}

        </div>
        {/* <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Atau Masuk Dengan
          </span>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            className="h-12 "
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="m@example.com"
            />
            <p className="text-primary font-bold text-xs text-balance font-plus-jakarta">
              {errorEmail}
            </p>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/lupapassword"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Kirim Tautan Masuk Email
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Masukkan Password"
              className="h-12"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground"
            >
              {isPasswordVisible ? (
                <Eye size={16}></Eye>
              ) : (
                <EyeOff size={16}></EyeOff>
              )}
            </button>
          </div>
          <p className="text-primary font-bold text-xs text-balance font-plus-jakarta">
            {errorPassword}
          </p>
        </div>
        <Button type="submit" className="w-full font-bold">
          Masuk
        </Button> */}
        

        <div className="flex text-muted-foreground  text-sm justify-center">
          Belum ada akun?
            <a
              href="/daftar"
              className="ml-2 text-black underline-offset-4 hover:underline"
            >
              Daftar (Setup Akun Mandiri)
          </a>
        </div>
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
