"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { Eye, EyeClosed, EyeOff, LucideEye } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  return (
    <form className={cn("flex flex-col gap-6 bg-background", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Masuk Akun ke Portal
        </h1>
        <p className="text-muted-foreground text-sm text-balance font-plus-jakarta">
          Masukkan email dan password untuk masuk ke portal
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input className="h-12 " id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Lupa Password?
            </a>
          </div>
          {/* Use the Input component for the password field */}
          <div className="relative">
            <Input
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Masukkan Password"
              className="h-12"
              required
            />
            {/* Eye icon to toggle password visibility */}
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
        </div>
        <Button type="submit" className="text-white w-full text-bold">
          Login
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Atau Lanjutkan Dengan
          </span>
        </div>
        <Button variant="outline" className="w-full">
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
