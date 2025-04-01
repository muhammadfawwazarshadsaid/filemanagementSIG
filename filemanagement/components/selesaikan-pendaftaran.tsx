// PASTIKAN INI ADA DI BARIS PALING ATAS FILE
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react"; // Tambahkan useCallback
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"; // Tambahkan Loader2
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";

// Definisikan tipe props jika diperlukan
interface SelesaikanPendaftaranFormProps extends React.ComponentProps<"div"> { // Ganti form ke div jika submit dikontrol tombol
  // Tambahkan props kustom jika ada
}

// Definisikan jumlah langkah
const TOTAL_STEPS = 3;
// Definisikan kunci metadata (sesuaikan jika backend Anda berbeda)
const METADATA_ALAMAT_KEY = 'alamat_pendaftaran';
const METADATA_SYARAT_KEY = 'syarat_disetujui';

export function SelesaikanPendaftaranForm({
  className,
  ...props
}: SelesaikanPendaftaranFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const app = useStackApp();
  const user = useUser(); // Gunakan useUser untuk interaksi user yang sudah login
  const router = useRouter();

  // State untuk data pengguna dan status loading
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading data awal
  const [isSavingStep, setIsSavingStep] = useState(false); // Loading saat menyimpan step

  // State untuk input form
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Email tetap di-fetch
  const [password, setPassword] = useState('');
  const [alamat, setAlamat] = useState('');
  const [setujuSyarat, setSetujuSyarat] = useState(false);

  // State untuk pesan error dan sukses
  const [stepError, setStepError] = useState(''); // Error validasi / simpan step
  const [errorName, setErrorName] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorAlamat, setErrorAlamat] = useState('');
  const [errorSyarat, setErrorSyarat] = useState('');
  const [finalSuccessMessage, setFinalSuccessMessage] = useState(''); // Pesan sukses di akhir

  // Toggle password visibility
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  // --- Fungsi untuk menentukan step awal ---
  const determineInitialStep = useCallback((currentUser: CurrentUser | null) => {
    if (!currentUser) return 1; // Jika tidak ada user, mulai dari 1

    // Cek kelengkapan Step 1 (Nama & Password jika diperlukan)
    const isStep1Complete = !!(currentUser.displayName && currentUser.hasPassword);
    if (!isStep1Complete) return 1;

    // Cek kelengkapan Step 2 (Alamat dari metadata)
    const isStep2Complete = !!currentUser.metadata?.[METADATA_ALAMAT_KEY];
    if (!isStep2Complete) return 2;

    // Cek kelengkapan Step 3 (Persetujuan Syarat dari metadata)
    const isStep3Complete = !!currentUser.metadata?.[METADATA_SYARAT_KEY];
    if (!isStep3Complete) return 3;

    // Jika semua sudah lengkap
    return TOTAL_STEPS + 1; // Angka di luar jangkauan untuk menandakan selesai

  }, []); // Tidak ada dependensi karena hanya menggunakan argumen

  // --- Fetch data user awal dan tentukan step awal ---
  useEffect(() => {
    let isMounted = true; // Flag untuk mencegah update state jika komponen unmount

    async function fetchAndInitialize() {
      setIsLoading(true);
      setStepError('');
      setFinalSuccessMessage('');
      try {
        const currentUser = await app.getUser();
        if (!isMounted) return; // Hentikan jika komponen sudah unmount

        setUserData(currentUser);

        if (currentUser) {
          // Pre-fill data dari currentUser
          if (currentUser.primaryEmail) setEmail(currentUser.primaryEmail);
          if (currentUser.displayName) setName(currentUser.displayName); // Tetap isi, tapi field mungkin disabled

          // Pre-fill data dari metadata
          if (currentUser.metadata?.[METADATA_ALAMAT_KEY]) {
            setAlamat(currentUser.metadata[METADATA_ALAMAT_KEY]);
          }
          if (currentUser.metadata?.[METADATA_SYARAT_KEY]) {
            setSetujuSyarat(true); // Tandai checkbox jika sudah disetujui
          }

          // Tentukan langkah awal
          const initialStep = determineInitialStep(currentUser);

          if (initialStep > TOTAL_STEPS) {
            // Jika semua sudah selesai, tampilkan pesan sukses & tombol lanjut
            setFinalSuccessMessage("Pendaftaran Anda sudah lengkap.");
            // Kita tidak set currentStep di sini, biarkan render kondisi selesai
          } else {
            setCurrentStep(initialStep);
          }

        } else {
           // Handle jika user tidak ditemukan (mungkin redirect ke login?)
           console.error("Pengguna tidak ditemukan.");
           // router.push('/login'); // Contoh redirect
           setCurrentStep(1); // Default ke step 1 jika tidak ada user
        }
      } catch (error) {
        console.error("Error getting user:", error);
        if (isMounted) {
          setStepError("Gagal memuat data pengguna."); // Tampilkan error di area step
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAndInitialize();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [app, determineInitialStep]); // Sertakan dependensi

  // --- Fungsi untuk menyimpan data step saat ini ---
  const saveCurrentStepData = async (): Promise<boolean> => {
     if (!user) {
       setStepError("Sesi pengguna tidak valid untuk menyimpan data.");
       return false;
     }

     setIsSavingStep(true);
     setStepError(''); // Reset error sebelum mencoba menyimpan
     let success = false;
     const currentMetadata = userData?.metadata || {}; // Ambil metadata saat ini

     try {
       const tasks = [];
       // Simpan data Step 1
       if (currentStep === 1) {
         // Hanya update jika nama diubah ATAU password baru diinput & user belum punya password
         const shouldUpdateName = name && name !== userData?.displayName;
         const shouldUpdatePassword = password && !userData?.hasPassword;

         if (shouldUpdateName) {
            console.log("Menyimpan Nama:", name);
           tasks.push(user.setDisplayName(name));
         }
         if (shouldUpdatePassword) {
            console.log("Menyimpan Password...");
           tasks.push(user.setPassword({ password }));
         }
       }
       // Simpan data Step 2 (Alamat ke metadata)
       else if (currentStep === 2) {
         if (alamat && alamat !== currentMetadata[METADATA_ALAMAT_KEY]) { // Hanya simpan jika ada perubahan
            console.log("Menyimpan Alamat:", alamat);
            const newMetadata = { ...currentMetadata, [METADATA_ALAMAT_KEY]: alamat };
            tasks.push(user.setMetadata(newMetadata));
         }
       }
       // Simpan data Step 3 (Persetujuan ke metadata)
       else if (currentStep === 3) {
         if (setujuSyarat && !currentMetadata[METADATA_SYARAT_KEY]) { // Hanya simpan jika disetujui dan belum tersimpan
            console.log("Menyimpan Persetujuan Syarat...");
           const newMetadata = { ...currentMetadata, [METADATA_SYARAT_KEY]: true };
           tasks.push(user.setMetadata(newMetadata));
         }
       }

       if (tasks.length > 0) {
         await Promise.all(tasks);
         // Refresh data user setelah menyimpan untuk mendapatkan state terbaru
         const updatedUser = await app.getUser(); // Re-fetch user data
         setUserData(updatedUser); // Update state userData
          // Pre-fill ulang field berdasarkan data terbaru jika diperlukan (misal, nama jadi disabled)
          if (updatedUser) {
              if (updatedUser.displayName && !name) setName(updatedUser.displayName);
              if (updatedUser.metadata?.[METADATA_ALAMAT_KEY] && !alamat) setAlamat(updatedUser.metadata[METADATA_ALAMAT_KEY]);
              if (updatedUser.metadata?.[METADATA_SYARAT_KEY] && !setujuSyarat) setSetujuSyarat(true);
          }
         console.log(`Data untuk Step ${currentStep} berhasil disimpan.`);
         success = true;
       } else {
         console.log(`Tidak ada data baru untuk disimpan di Step ${currentStep}.`);
         success = true; // Anggap sukses jika tidak ada yang perlu disimpan
       }

     } catch (err: any) {
       console.error(`Error saving data for step ${currentStep}:`, err);
       setStepError(err.message || `Gagal menyimpan data untuk langkah ${currentStep}.`);
       success = false;
     } finally {
       setIsSavingStep(false);
     }
     return success;
  };


  // --- Logika Navigasi Step ---
  const handleNextStep = async () => {
    setStepError(''); // Reset error langkah
    setErrorName('');
    setErrorPassword('');
    setErrorAlamat('');
    setErrorSyarat('');

    let isValid = true;

    // Validasi Step 1
    if (currentStep === 1) {
      // Nama wajib diisi jika belum ada di profil
      if (!name && !userData?.displayName) {
        setErrorName('Nama tidak boleh kosong.');
        isValid = false;
      }
       // Password wajib diisi jika belum ada di profil
      if (!password && !userData?.hasPassword) {
        setErrorPassword('Password tidak boleh kosong.');
        isValid = false;
      }
    }

    // Validasi Step 2
    if (currentStep === 2) {
      if (!alamat) {
          setErrorAlamat('Alamat tidak boleh kosong.');
          isValid = false;
      }
    }

    // Validasi Step 3
    if (currentStep === 3) {
      if (!setujuSyarat) {
          setErrorSyarat('Anda harus menyetujui syarat dan ketentuan.');
          isValid = false;
      }
    }

    if (!isValid) {
        setStepError("Mohon periksa kembali isian pada langkah ini.");
        return; // Hentikan proses jika tidak valid
    }

    // --- Simpan data langkah saat ini ---
    const saveSuccess = await saveCurrentStepData();

    if (saveSuccess) {
      // Pindah ke langkah berikutnya jika bukan langkah terakhir
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
        // Reset password field setelah berhasil disimpan & pindah step (jika diinginkan)
        if (currentStep === 1 && password) {
            setPassword('');
        }
      } else {
        // Jika di langkah terakhir dan berhasil simpan
        console.log("Semua langkah selesai dan disimpan.");
        setFinalSuccessMessage('Pendaftaran berhasil diselesaikan!');
        // State akan memicu render komponen sukses
      }
    }
    // Jika save gagal, error akan ditampilkan oleh saveCurrentStepData
  };

  const handlePreviousStep = () => {
    setStepError(''); // Reset error langkah
    setErrorName('');
    setErrorPassword('');
    setErrorAlamat('');
    setErrorSyarat('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // --- Komponen Step Progress Indicator --- (Sama seperti sebelumnya)
  const StepProgress = () => (
    <div className="flex justify-center items-center space-x-4 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const stepNumber = index + 1;
        // Tentukan status berdasarkan step saat ini dan data user
        let isCompleted = false;
        if (stepNumber === 1) isCompleted = !!(userData?.displayName && userData?.hasPassword);
        else if (stepNumber === 2) isCompleted = !!userData?.metadata?.[METADATA_ALAMAT_KEY];
        else if (stepNumber === 3) isCompleted = !!userData?.metadata?.[METADATA_SYARAT_KEY];
        // Step aktif adalah step saat ini YANG BELUM selesai
        const isActive = stepNumber === currentStep && !isCompleted;
        // Step dianggap completed jika data sudah ada, meskipun user berada di step tsb
        const isTrulyCompleted = stepNumber < currentStep || isCompleted;


        return (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center">
                <div
                 className={cn(
                   "w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold transition-colors duration-300",
                   isActive ? "bg-blue-600 border-blue-600 text-white" : "",
                   isTrulyCompleted ? "bg-green-500 border-green-500 text-white" : "",
                   !isActive && !isTrulyCompleted ? "border-gray-300 text-gray-500" : ""
                 )}
               >
                 {isTrulyCompleted ? <Check size={16} /> : stepNumber}
               </div>
               <span className={cn("text-xs mt-1", isActive ? "font-bold text-blue-700" : "text-gray-500", isTrulyCompleted ? "text-green-600" : "")}>
                 {stepNumber === 1 && "Profil"}
                 {stepNumber === 2 && "Alamat"}
                 {stepNumber === 3 && "Konfirmasi"}
               </span>
             </div>
            {stepNumber < TOTAL_STEPS && (
              <div
                className={cn(
                  "flex-1 h-1 transition-colors duration-300",
                  isTrulyCompleted ? "bg-green-500" : "bg-gray-300" // Garis hijau jika step *sebelumnya* selesai
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // --- Render Utama ---
  if (isLoading) {
    return <div className="flex justify-center items-center p-10">Memuat data & status pendaftaran...</div>;
  }

  // Kondisi jika SEMUA langkah sudah selesai (berdasarkan state sukses final)
   if (finalSuccessMessage) {
     return (
       <div className="flex flex-col items-center gap-4 p-6 text-center">
           <Check className="w-16 h-16 text-green-500" />
           <h2 className="text-2xl font-bold">Pendaftaran Selesai!</h2>
           <p className="text-green-600">{finalSuccessMessage}</p>
           <Button
             onClick={() => router.push('/')} // Arahkan ke halaman utama/dashboard
             className="mt-4 bg-blue-600 hover:bg-blue-700"
           >
             Lanjutkan ke Beranda
           </Button>
       </div>
     )
   }

  // Render form jika belum selesai semua
  return (
    <div className={cn("flex flex-col gap-6 bg-background", className)} {...props}>

      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Selesaikan Pendaftaran
        </h1>
        {/* Error global/final tidak lagi diperlukan di sini, error per step lebih relevan */}
      </div>

      {/* Step Progress Indicator */}
      <StepProgress />

       {/* Pesan Error Spesifik Step (validasi atau simpan) */}
       {stepError && <p className="text-red-500 text-center text-sm mb-4 font-semibold bg-red-100 p-2 rounded">{stepError}</p>}

      {/* --- Konten Step Dinamis --- */}
      <div className="grid gap-6">
        {/* --- Konten Step 1: Profil --- */}
        {currentStep === 1 && (
           <div className="grid gap-6 animate-fadeIn">
             {/* Field Email (Read-only) */}
             <div className="grid gap-3">
               <Label htmlFor="email">Email</Label>
               <p className="font-bold border p-3 rounded-md bg-gray-100 h-12 flex items-center text-gray-700">
                 {email || "Memuat..."}
               </p>
             </div>
             {/* Field Nama */}
             <div className="grid gap-3">
               <Label htmlFor="name">Nama</Label>
               {userData?.displayName ? (
                 <p className="font-bold border p-3 rounded-md bg-gray-100 h-12 flex items-center">
                   {userData.displayName}
                 </p>
               ) : (
                 <>
                   <Input className="h-12" id="name" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Nama Lengkap Anda" disabled={isSavingStep} aria-describedby="name-error"/>
                   {errorName && <p id="name-error" className="text-red-600 font-bold text-xs">{errorName}</p>}
                 </>
               )}
             </div>
             {/* Field Password */}
             <div className="grid gap-3">
               <Label htmlFor="password">Password</Label>
               {userData?.hasPassword ? (
                  <p className="font-bold flex items-center gap-2 text-green-600">Password sudah diatur <span className="p-1 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-white"><Check size={16} /></span></p>
               ) : (
                 <>
                   <div className="relative">
                     <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type={isPasswordVisible ? "text" : "password"} placeholder="Buat Password Baru" className="h-12 pr-10" disabled={isSavingStep} aria-describedby="password-error"/>
                     <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900" aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}>
                       {isPasswordVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                     </button>
                   </div>
                   {errorPassword && <p id="password-error" className="text-red-600 font-bold text-xs">{errorPassword}</p>}
                 </>
               )}
             </div>
           </div>
         )}

        {/* --- Konten Step 2: Alamat --- */}
         {currentStep === 2 && (
           <div className="grid gap-6 animate-fadeIn">
             <h2 className="text-xl font-semibold mb-2 text-center">Informasi Alamat</h2>
             <div className="grid gap-3">
                 <Label htmlFor="alamat">Alamat Lengkap</Label>
                 <Input
                   id="alamat"
                   value={alamat}
                   onChange={(e) => setAlamat(e.target.value)}
                   placeholder="Masukkan alamat lengkap Anda"
                   className="h-12"
                   disabled={isSavingStep} // Disable saat menyimpan
                   aria-describedby="alamat-error"
                 />
                 {errorAlamat && <p id="alamat-error" className="text-red-600 font-bold text-xs">{errorAlamat}</p>}
             </div>
             {/* Tambahkan field lain jika perlu */}
           </div>
         )}

        {/* --- Konten Step 3: Konfirmasi --- */}
         {currentStep === 3 && (
           <div className="grid gap-6 animate-fadeIn">
             <h2 className="text-xl font-semibold mb-2 text-center">Konfirmasi & Persetujuan</h2>
             {/* Tampilkan ringkasan data */}
             <div className="space-y-2 border p-4 rounded-md bg-gray-50 text-sm">
                 <p><strong>Nama:</strong> {name || userData?.displayName || '-'}</p>
                 <p><strong>Email:</strong> {email || '-'}</p>
                 <p><strong>Alamat:</strong> {alamat || '-'}</p>
                 <p><strong>Password:</strong> {userData?.hasPassword || password ? <span className="text-green-600">Akan diatur / Sudah diatur</span> : <span className="text-gray-500">Belum diatur</span>}</p>
             </div>
             <div className="flex items-start space-x-2">
                 <input
                   type="checkbox"
                   id="syarat"
                   checked={setujuSyarat}
                   onChange={(e) => setSetujuSyarat(e.target.checked)}
                   disabled={isSavingStep} // Disable saat menyimpan
                   className="mt-1"
                   aria-describedby="syarat-error"
                 />
                 <Label htmlFor="syarat" className="text-sm font-normal text-gray-700">
                   Saya menyetujui <a href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">syarat dan ketentuan</a> yang berlaku.
                 </Label>
             </div>
              {errorSyarat && <p id="syarat-error" className="text-red-600 font-bold text-xs">{errorSyarat}</p>}
           </div>
         )}
      </div>

      {/* --- Tombol Navigasi --- */}
      <div className="flex justify-between items-center mt-8">
        {/* Tombol Kembali */}
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviousStep}
          disabled={currentStep === 1 || isSavingStep} // Disable di step 1 atau saat loading
          className={cn(currentStep === 1 ? "invisible" : "")} // Sembunyikan di step 1
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>

        {/* Tombol Lanjut / Submit */}
        <Button
          type="button"
          onClick={handleNextStep} // Panggil handleNextStep
          disabled={isSavingStep} // Disable saat menyimpan
          className={cn(
            "bg-blue-600 hover:bg-blue-700 text-white", // Styling umum
            currentStep === TOTAL_STEPS ? "bg-green-600 hover:bg-green-700" : "" // Warna beda di step akhir
          )}
        >
          {isSavingStep ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : currentStep === TOTAL_STEPS ? (
            "Selesaikan Pendaftaran" // Teks tombol di step akhir
          ) : (
            <>Lanjutkan <ArrowRight className="ml-2 h-4 w-4" /></> // Teks tombol di step 1 & 2
          )}
        </Button>
      </div>

    </div> // End Wrapper Div
  );
}

// Jangan lupa tambahkan CSS untuk animasi jika belum ada di global CSS Anda
/* Contoh di file CSS global Anda:
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out forwards;
}
*/