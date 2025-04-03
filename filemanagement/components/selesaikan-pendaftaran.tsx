// src/components/SelesaikanPendaftaranForm.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Building2, Folder as FolderIcon, ChevronRight } from "lucide-react";
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import WorkspaceSelector from "./workspace-selector";
import FolderSelector from "./folder-selector"; // Pastikan path ini benar
import { supabase } from "@/lib/supabaseClient";

interface SelesaikanPendaftaranFormProps extends React.ComponentProps<"div"> {}

const TOTAL_STEPS = 3;

export function SelesaikanPendaftaranForm({
    className,
    ...props
}: SelesaikanPendaftaranFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const app = useStackApp();
    const user = useUser();
    const router = useRouter();

    const [userData, setUserData] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingStep, setIsSavingStep] = useState(false);

    // KEMBALIKAN STATE untuk status penyelesaian step (jika diperlukan untuk validasi/visual)
    const [isWorkspaceAdded, setIsWorkspaceAdded] = useState(false); // Status apakah workspace *sudah ada*
    const [hasFolderInWorkspace, setHasFolderInWorkspace] = useState(false); // Status apakah folder *sudah dipilih*

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [stepError, setStepError] = useState('');
    const [errorName, setErrorName] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [finalSuccessMessage, setFinalSuccessMessage] = useState('');

    const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

    // Callback dari WorkspaceSelector untuk tahu jika ada workspace
     const handleWorkspacesChange = useCallback((count: number) => {
        const hasWs = count > 0;
        setIsWorkspaceAdded(hasWs);
        // Reset error jika user mulai menambahkan workspace di step 2
        if (currentStep === 2 && hasWs && stepError.includes('workspace')) {
            setStepError('');
        }
    }, [currentStep, stepError]);

  // Ganti nama dan perbaiki parameter (menerima boolean, bukan count)
  const handleFolderExistenceChange = useCallback((hasFolders: boolean) => {
      console.log("SelesaikanPendaftaranForm received hasFolders:", hasFolders); // Debug
      setHasFolderInWorkspace(hasFolders); // Update state induk
      // Reset error jika folder sekarang ada
      if (currentStep === 3 && hasFolders && stepError.includes('folder')) {
          setStepError('');
      }
  }, [currentStep, stepError]); // Hapus hasFolderInWorkspace dari dependencies jika ada

    useEffect(() => {
        // --- Logika useEffect untuk menentukan step awal ---
        // (Menggunakan pengecekan workspace existence dari Supabase)
        let isMounted = true;
        if (!isLoading && isMounted) { return; }
        console.log(">>> FORM UseEffect: Running fetchAndInitialize...");

        async function checkWorkspaceExists(userId: string): Promise<boolean> {
            try { const { error, count } = await supabase.from('workspace').select('id', { count: 'exact', head: true }).eq('user_id', userId); if (error) { console.error(">>> Supabase error:", error); if(isMounted) setStepError("Gagal cek workspace."); return false; } setIsWorkspaceAdded((count ?? 0) > 0); /* Update state based on DB */ return (count ?? 0) > 0; } catch (err) { console.error(">>> Exception checking workspace:", err); if(isMounted) setStepError("Error cek workspace."); return false; }
        }

      
        // Fungsi ini sekarang membutuhkan userId DAN workspaceId
        async function checkFoldersExistInWorkspace(userId: string, workspaceId: string | null): Promise<boolean> {
            // Jika tidak ada workspaceId yang diberikan, anggap tidak ada folder di dalamnya
            if (!workspaceId) {
                console.warn("checkFoldersExistInWorkspace: workspaceId tidak disediakan.");
                // Update state jika perlu (sesuaikan dengan nama state setter Anda)
                if (isMounted) setHasFolderInWorkspace(false); // Nama state setter mungkin perlu disesuaikan
                return false;
            }

            console.log(`Mengecek folder untuk user ${userId} di workspace ${workspaceId}`); // Log untuk debug

            try {
                const { error, count } = await supabase
                    .from('folder') // Cek tabel folder
                    .select('id', { count: 'exact', head: true }) // Hitung baris saja
                    .eq('user_id', userId) // Filter berdasarkan user
                    .eq('workspace_id', workspaceId); // **TAMBAHKAN FILTER BERDASARKAN WORKSPACE**

                if (error) {
                    console.error(">>> Supabase error cek folder di workspace:", error);
                    if(isMounted) setStepError("Gagal cek folder di workspace."); // Perbaiki pesan error
                    return false;
                }

                const foldersExist = (count ?? 0) > 0;
                console.log(`Folder ditemukan di workspace ${workspaceId}: ${foldersExist}`); // Log hasil

                // Update state yang relevan (pastikan nama state setter benar)
                if (isMounted) setHasFolderInWorkspace(foldersExist); // Gunakan hasil pengecekan

                return foldersExist;

            } catch (err) {
                console.error(">>> Exception saat cek folder di workspace:", err); // Perbaiki pesan error
                if(isMounted) setStepError("Error cek folder di workspace."); // Perbaiki pesan error
                return false;
            }
        }
      
        async function fetchAndInitialize() {
            setStepError(''); setFinalSuccessMessage(''); let determinedStep = 1;
            try {
                const currentUser = await app.getUser(); if (!isMounted) return; setUserData(currentUser);
                if (currentUser) {
                    if (currentUser.primaryEmail) setEmail(currentUser.primaryEmail); if (currentUser.displayName) setName(currentUser.displayName);
                    const isStep1Complete = !!(currentUser.displayName && currentUser.hasPassword);
                    if (!isStep1Complete) { determinedStep = 1; }
                    else {
                        const isStep2Complete = await checkWorkspaceExists(currentUser.id); if (!isMounted) return;
                        // Mulai di Step 3 jika profil & workspace lengkap
                        // Kita tidak bisa tahu status folder selection dari DB (belum disimpan)
                        determinedStep = isStep2Complete ? 3 : 2;
                    }
                } else { determinedStep = 1; }
            } catch (error) { console.error(">>> Error get user:", error); if (isMounted) setStepError("Gagal load user."); determinedStep = 1; }
            finally { if (isMounted) { setCurrentStep(determinedStep); setIsLoading(false); } }
        }
        if (isLoading) { fetchAndInitialize(); }
        return () => { isMounted = false; };
    }, [app, supabase, isLoading]); // Jangan lupa 'isLoading'


    const saveProfileData = async (): Promise<boolean> => {
         // ... (Fungsi saveProfileData tetap sama, hanya save nama/pass) ...
        if (!user) { setStepError("Sesi pengguna tidak valid."); return false; }
        setIsSavingStep(true); setStepError(''); let success = false;
        console.log(">>> saveProfileData: Attempting to save profile data...");
        try {
            const tasks = [];
            const shouldUpdateName = name && name !== userData?.displayName;
            const shouldUpdatePassword = password && !userData?.hasPassword;
            if (shouldUpdateName) tasks.push(user.setDisplayName(name));
            if (shouldUpdatePassword) tasks.push(user.setPassword({ password }));

            if (tasks.length > 0) {
                await Promise.all(tasks);
                console.log(">>> saveProfileData: Profile data saved successfully.");
                const updatedUser = await app.getUser(); setUserData(updatedUser);
                setPassword('');
            } else { console.log(">>> saveProfileData: No profile data changes to save."); }
            success = true;
        } catch (err: any) { console.error(`>>> saveProfileData: Error saving profile data:`, err); setStepError(err.message || `Gagal menyimpan data profil.`); success = false; }
        finally { setIsSavingStep(false); }
        return success;
    };

    const handleNextStep = async () => {
        setStepError(''); setErrorName(''); setErrorPassword('');
        let isValid = true;
        let saveSuccess = true;

        if (currentStep === 1) {
            // Validasi Step 1
            if (!name && !userData?.displayName) { setErrorName('Nama tidak boleh kosong.'); isValid = false; }
            if (!password && !userData?.hasPassword) { setErrorPassword('Password tidak boleh kosong.'); isValid = false; }
            if (isValid) {
                saveSuccess = await saveProfileData(); // Simpan data Step 1
            }
        } else if (currentStep === 2) {
            // Validasi Step 2 (Sebelum ke Step 3) - Optional tapi disarankan
             if (!isWorkspaceAdded) { // Cek state yg diupdate callback/useEffect
                 setStepError("Anda harus menambahkan atau memiliki setidaknya satu workspace.");
                 isValid = false;
             }
             // Tidak ada save data di sini
        } else if (currentStep === 3) {
            // Validasi Step 3 (Sebelum menyelesaikan)
            if (!hasFolderInWorkspace) { // Cek state yg diupdate callback
                setStepError("Anda harus memilih folder tujuan utama.");
                isValid = false;
            }
            // Tidak ada save data di sini
        }

        if (!isValid || !saveSuccess) {
             if (isValid && !saveSuccess && !stepError) { setStepError(`Gagal menyimpan data.`); }
             else if (!isValid && !stepError && !errorName && !errorPassword) { setStepError("Mohon lengkapi data atau pilihan pada langkah ini."); }
            return;
        }

        // Jika validasi & save (jika ada) OK
        if (currentStep < TOTAL_STEPS) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
        } else { // Jika di langkah terakhir (Step 3) dan valid
            console.log(">>> handleNextStep: Finishing on Step 3.");
            setFinalSuccessMessage('Pendaftaran berhasil diselesaikan!');
        }
    };

    const handlePreviousStep = () => {
        setStepError(''); setErrorName(''); setErrorPassword('');
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const StepProgress = () => (
        <div className="flex justify-center items-center space-x-4 mb-8">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                const stepNumber = index + 1;
                const isPastStep = stepNumber < currentStep; // Step sudah dilewati
                const isActive = stepNumber === currentStep;  // Step saat ini

                // Tentukan status selesai visual berdasarkan state
                let isVisuallyCompleted = isPastStep;
                if (isActive) {
                    if (stepNumber === 1) isVisuallyCompleted = !!(userData?.displayName && userData?.hasPassword);
                    else if (stepNumber === 2) isVisuallyCompleted = isWorkspaceAdded;
                    else if (stepNumber === 3) isVisuallyCompleted = hasFolderInWorkspace;
                } else if (isPastStep) {
                    // Jika sudah lewat, cek state penyelesaian sebelumnya
                     if (stepNumber === 1) isVisuallyCompleted = !!(userData?.displayName && userData?.hasPassword);
                     else if (stepNumber === 2) isVisuallyCompleted = isWorkspaceAdded;
                     // Step 3 tidak bisa dipastikan selesai jika hanya 'past step' tanpa state/DB check
                }


              return (
                    <React.Fragment key={stepNumber}>
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold transition-colors duration-300",
                                    isActive && !isVisuallyCompleted ? "bg-blue-600 border-blue-600 text-white" : "",
                                    isVisuallyCompleted ? "bg-green-500 border-green-500 text-white" : "",
                                    !isActive && !isVisuallyCompleted ? "border-gray-300 text-gray-500" : ""
                                )}
                            >
                                {isVisuallyCompleted ? <Check size={16} /> : stepNumber}
                            </div>
                            <span className={cn("text-xs mt-1", isActive && !isVisuallyCompleted ? "font-bold text-blue-700" : "text-gray-500", isVisuallyCompleted ? "text-green-600" : "")}>
                                {stepNumber === 1 && "Profil"}
                                {stepNumber === 2 && "Workspace"}
                                {stepNumber === 3 && "Konfirmasi"}
                            </span>
                        </div>
                        {stepNumber < TOTAL_STEPS && (
                            <div
                                className={cn(
                                    "flex-1 h-1 transition-colors duration-300",
                                    (stepNumber < currentStep || (stepNumber === currentStep && isVisuallyCompleted)) ? "bg-green-500" : "bg-gray-300"
                                )}
                            />
                        )}
                    </React.Fragment>
              );
    
            })}
        </div>
    );

     if (isLoading) { return <div className='flex items-center justify-center text-sm text-gray-500 py-6'><Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500" /> Memuat status pendaftaran...</div>; }
     if (finalSuccessMessage) { return ( <div className="flex flex-col items-center gap-4 p-6 text-center"> <Check className="w-16 h-16 text-green-500" /> <h2 className="text-2xl font-bold">Pendaftaran Selesai!</h2> <p className="text-green-600">{finalSuccessMessage}</p> <Button onClick={() => router.push('/')} className="mt-4 bg-black hover:bg-gray-800"> Lanjutkan ke Aplikasi</Button> </div> ); }


  return (
    <div className={cn("flex flex-col gap-6 bg-background", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center bg-background">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Selesaikan Pendaftaran
        </h1>
      </div>

      <StepProgress />

      {stepError && <p className="text-red-500 text-center text-sm mb-4 font-semibold bg-red-100 p-2 rounded">{stepError}</p>}

      <div className="">
        {currentStep === 1 && (
          <div className="grid gap-6 animate-fadeIn">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <p className="font-bold border p-3 rounded-md bg-gray-100 h-12 flex items-center text-gray-700">
                {email || "Memuat..."}
              </p>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="name">Nama</Label>
              {userData?.displayName ? (
                <p className="font-bold border p-3 rounded-md bg-gray-100 h-12 flex items-center">
                  {userData.displayName}
                </p>
              ) : (
                <>
                  <Input className="h-12" id="name" value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Nama Lengkap Anda" disabled={isSavingStep} aria-describedby="name-error" />
                  {errorName && <p id="name-error" className="text-red-600 font-bold text-xs">{errorName}</p>}
                </>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              {userData?.hasPassword ? (
                <p className="font-bold flex items-center gap-2 text-green-600">Password sudah diatur <span className="p-1 bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-white"><Check size={16} /></span></p>
              ) : (
                <>
                  <div className="relative">
                    <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} type={isPasswordVisible ? "text" : "password"} placeholder="Buat Password Baru" className="h-12 pr-10" disabled={isSavingStep} aria-describedby="password-error" />
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

        {currentStep === 2 && (
          <div className="animate-fadeIn">
              <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800">Buat Workspace Pertama Kali</h2>
              <div className="flex items-start text-sm p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                  <Building2 size={24} className="mr-3 mt-0.5 flex-shrink-0"/>
                  <span>Workspace mewakili folder utama (root) yang mewakili holding/unit/satuan kerja (misal: Semen Tonasa). </span>
              </div>
              <WorkspaceSelector />
          </div>
        )}
        {/* Step 3 */}
        {currentStep === 3 && (
              <div className="animate-fadeIn">
                  <h2 className="text-2xl font-semibold mb-2 text-center text-gray-800">Buat Folder Pertama Kali</h2>
                  {/* <p className="text-center text-gray-600 mb-6">Buat folder pertama di dalam workspace Anda.</p> */}
                  <div className="flex items-start text-sm p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                      <FolderIcon size={24} className="mr-3 mt-0.5 flex-shrink-0"/>
                      <span>Buat folder <span className="font-bold">dengan deskripsi & label</span> untuk mengorganisir pekerjaan Anda di dalam workspace yang dipilih.</span>
                  </div>
                  <FolderSelector onFolderExistenceChange={handleFolderExistenceChange} />
              </div>
        )}
        

        </div>

        {/* Tombol Navigasi */}
        <div className="flex justify-between items-center mt-10 border-t pt-6">
             <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1 || isSavingStep} className={cn(currentStep === 1 ? "invisible" : "", "px-16 border-gray-300 text-gray-700 hover:bg-gray-50")} >
                 <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
             </Button>
             <Button
                type="button"
                onClick={handleNextStep}
                // Disable jika saving ATAU jika di step 2 belum ada WS ATAU jika di step 3 belum pilih folder
                disabled={isSavingStep ||
                    (currentStep === 2 && !isWorkspaceAdded) ||
                    (currentStep === 3 && !hasFolderInWorkspace)
                }
                className={cn(
                    "text-white px-16 font-semibold",
                    // Logika Warna Tombol Utama
                    currentStep === TOTAL_STEPS
                       ? ((hasFolderInWorkspace) ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed") // Di Step 3: Hijau jika folder dipilih, Abu jika belum
                       : ((currentStep === 2 && !isWorkspaceAdded) ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800" ) // Di Step 1/2: Biru jika valid/siap, Abu jika belum
                )}
                title={ // **MODIFIKASI TOOLTIP:**
                    (currentStep === 2 && !isWorkspaceAdded) ? "Anda harus menambahkan/memiliki workspace" :
                    (currentStep === 3 && !hasFolderInWorkspace) ? "Anda harus memiliki/membuat setidaknya satu folder" : ""
                 }
             >
                 {isSavingStep ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> ) : currentStep === TOTAL_STEPS ? ( "Selesai" ) : ( <>Lanjutkan <ArrowRight className="ml-2 h-4 w-4 text-primary" /></> )}
             </Button>
       </div>
    </div>
  );
}