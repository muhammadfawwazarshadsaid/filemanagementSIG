"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff } from "lucide-react";
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import { useState, useEffect } from "react";

export function SelesaikanPendaftaranForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const app = useStackApp();
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorName, setErrorName] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await app.getUser();
        setUserData(currentUser);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [app]);

  useEffect(() => {
    if (step === 1) {
      setProgress(33);
    } else if (step === 2) {
      setProgress(66);
    } else {
      setProgress(100);
    }
  }, [step]);

  const onSubmit = async () => {
    if (step === 1) {
      if (!name) {
        setErrorName("Mohon masukkan nama Anda");
        return;
      }
      if (!email) {
        setErrorEmail("Mohon masukkan email Anda");
        return;
      }
      if (!password) {
        setErrorPassword("Mohon masukkan password Anda");
        return;
      }
      if (user && !userData?.displayName) {
        const setname: string = name;
        user.setDisplayName(setname);
      }
      if (user && !userData?.hasPassword) {
        const setpassword: string = password;
        user.setPassword({ password: setpassword });
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
    }
  };

  if (isLoading) {
    return <p className="flex items-center justify-center">Loading...</p>;
  }

  return (
    <form
      className={cn("flex flex-col gap-6 bg-background", className)}
      {...props}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Selesaikan Pendaftaran
        </h1>
        <p className="text-primary font-bold text-sm text-balance font-plus-jakarta">
          {error}
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="grid gap-6">
        {step === 1 && (
          <>
            {/* Konten Langkah 1 (Email, Nama, Password) */}
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              {userData && userData.primaryEmail ? (
                <p className="font-bold">{userData!.primaryEmail}</p>
              ) : (
                <>
                  <Input
                    className="h-12"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="m@example.com"
                  />
                  <p className="text-primary font-bold text-xs text-balance font-plus-jakarta">
                    {errorEmail}
                  </p>
                </>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="name">Nama</Label>
              {userData && userData.displayName ? (
                <p className="font-bold">{userData!.displayName}</p>
              ) : (
                <>
                  <Input
                    className="h-12"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="name"
                    placeholder="Yanto"
                  />
                  <p className="text-primary font-bold text-xs text-balance font-plus-jakarta">
                    {errorName}
                  </p>
                </>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Buat Password Baru</Label>
              {userData && userData.hasPassword ? (
                <div className="font-bold flex items-center gap-2">
                  Sudah diatur{" "}
                  <div className="p-1 bg-[oklch(0.61_0.1998_146)] rounded-full w-6 text-white">
                    <Check size={16}></Check>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <div>
            {/* Konten Langkah 2 */}
            <p>Konten Langkah 2: Tambahkan konten untuk langkah kedua di sini.</p>
            {/* Contoh konten: */}
            <p>Masukkan informasi tambahan:</p>
            <Input placeholder="Alamat" />
            <Input placeholder="Nomor Telepon" />
          </div>
        )}

        {step === 3 && (
          <div>
            {/* Konten Langkah 3 */}
            <p>Konten Langkah 3: Tambahkan konten untuk langkah ketiga di sini.</p>
            {/* Contoh konten: */}
            <p>Konfirmasi pendaftaran:</p>
            <p>Nama: {name}</p>
            <p>Email: {email}</p>
            <p>Password: {password}</p>
          </div>
        )}

        <Button onClick={onSubmit} className="w-full font-bold">
          {step === 3 ? "Lanjutkan" : "Selanjutnya"}
        </Button>
      </div>
    </form>
  );
}