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

    const handleWorkspaceUpdate = useCallback((workspaceExists: boolean) => {
    console.log("SelesaikanPendaftaranForm received workspace update:", workspaceExists); // Debugging
    setIsWorkspaceAdded(workspaceExists);
    // Reset error jika workspace sekarang ada dan error sebelumnya terkait workspace
    if (currentStep === 2 && workspaceExists && stepError.includes('workspace')) {
       setStepError('');
    }
  }, [currentStep, stepError]); // Tambahkan dependensi yang relevan

    // Ganti nama dan perbaiki parameter (menerima boolean, bukan count)
    const handleFolderExistenceChange = useCallback((hasFolders: boolean) => {
        console.log("SelesaikanPendaftaranForm received hasFolders:", hasFolders); // Debug
        setHasFolderInWorkspace(hasFolders); // Update state induk
        // Reset error jika folder sekarang ada
        if (currentStep === 3 && hasFolders && stepError.includes('folder')) {
            setStepError('');
        }
    }, [currentStep, stepError]); // Hapus hasFolderInWorkspace dari dependencies jika ada


// --- useEffect untuk Upsert User ke Supabase ---
    useEffect(() => {
        const upsertUserToSupabase = async () => {
            // Pastikan user, id, dan email ada.
            // Mungkin user.displayName bisa null awalnya, handle itu.
            if (!user || !user.id || !user.primaryEmail) {
                console.log(">>> [Upsert Effect] User data not fully ready yet for upsert.");
                return;
            }

            console.log(`>>> [Upsert Effect] Preparing upsert for user: ${user.id}`);

            // Siapkan data, pastikan nama key cocok DENGAN NAMA KOLOM di DB
            // Perhatikan huruf besar/kecil jika nama kolom Anda camelCase (displayName)
            // Jika kolomnya lowercase (displayname), gunakan lowercase di sini.
            const userDataForSupabase = {
                id: user.id,
                // GANTI 'displayName' jika nama kolom di DB Anda adalah 'displayName' (camelCase)
                // GANTI 'displayname' jika nama kolom di DB Anda adalah 'displayname' (lowercase)
                displayname: user.displayName || null, // Kirim null jika display name belum ada
                // GANTI 'primaryEmail' jika nama kolom di DB Anda adalah 'primaryEmail' (camelCase)
                // GANTI 'primaryemail' jika nama kolom di DB Anda adalah 'primaryemail' (lowercase)
                primaryemail: user.primaryEmail
            };

            console.log(">>> [Upsert Effect] Data for Supabase:", JSON.stringify(userDataForSupabase, null, 2));


            try {
                // Panggilan UPSERT yang BENAR:
                const { data, error } = await supabase
                    .from('user') // Target tabel 'user'
                    .upsert(
                        userDataForSupabase, // Object data
                        {
                            onConflict: 'id' // Opsi: kolom yg dicek untuk konflik (harus PK/Unique)
                        }
                    )
                    .select() // select() bisa di-chain setelah upsert
                    .single(); // single() jika Anda mengharapkan 1 baris hasil

                // Hapus .eq('id', user.id) dari sini

                if (error) {
                    // Log error detail
                    console.error(">>> Gagal simpan user ke Supabase:", JSON.stringify(error, null, 2));
                    setStepError(`Gagal sinkronisasi pengguna: ${error.message}`); // Tampilkan pesan error umum
                } else {
                    console.log(">>> User berhasil di-upsert ke Supabase:", data);
                }
            } catch (err) {
                console.error(">>> Catch Block: Error upsert user to Supabase:", err);
                setStepError("Terjadi kesalahan saat menyimpan data pengguna.");
            }
        };

        // Panggil HANYA jika user SUDAH ada datanya
        if (user && user.id && user.primaryEmail) {
            upsertUserToSupabase();
        } else if(user) { // Jika user ada tapi belum lengkap
             console.log(">>> [Upsert Effect] User object exists, but id or email might be missing initially.");
        }

    }, [user, app]); // Dependency array sudah benar
    // --- Akhir useEffect untuk Upsert ---

    // useEffect kedua Anda (fetchAndInitialize) tetap sama...
    useEffect(() => {
        // ... (kode fetchAndInitialize Anda yang sudah ada) ...
    }, [app, supabase, isLoading]); // Pastikan dependency array ini juga benar

    useEffect(() => {
        // --- Logika useEffect untuk menentukan step awal ---
        // (Menggunakan pengecekan workspace existence dari Supabase)
        let isMounted = true;
        if (!isLoading && isMounted) { return; }
        console.log(">>> FORM UseEffect: Running fetchAndInitialize...");

        
        async function checkWorkspaceExists(userId: string): Promise<boolean> {
            try {
                const { error, count } = await supabase.from('workspace').select('id', { count: 'exact', head: true }).eq('user_id', userId);
                if (error) {
                    console.error(">>> Supabase error:", error);
                    if (isMounted) setStepError("Gagal cek workspace."); return false;
                } setIsWorkspaceAdded((count ?? 0) > 0); /* Update state based on DB */ return (count ?? 0) > 0;
            } catch (err) {
                console.error(">>> Exception checking workspace:", err);
                if (isMounted) setStepError("Error cek workspace."); return false;
            }
        }

        
        async function fetchAndInitialize() {
            if (!isMounted) return;
            setIsLoading(true);
            setStepError('');
            setFinalSuccessMessage('');

            try {
                // 1. Dapatkan User dari StackFrame
                const currentUser = await app.getUser();
                if (!isMounted) return;

                if (!currentUser) { /* Handle user null */ if(isMounted){setCurrentStep(1); setIsLoading(false);} return; }
                setUserData(currentUser); /* Set email/name */
                setEmail(currentUser.primaryEmail || '');

                if (!currentUser.displayName) { // Hanya jika nama di profil belum ada
                    const pendingName = sessionStorage.getItem('pendingSignupName');
                    if (pendingName) {
                        console.log("Nama ditemukan di sessionStorage:", pendingName);
                        if (isMounted) setName(pendingName); // Isi state nama DENGAN nilai dari sessionStorage
                        sessionStorage.removeItem('pendingSignupName'); // Hapus dari storage setelah digunakan
                        console.log("Nama dihapus dari sessionStorage.");
                    } else {
                       console.log("Nama tidak ditemukan di sessionStorage atau nama profil sudah ada.");
                       // Jika nama profil sudah ada karena proses lain, biarkan kosong di state inputan
                       // atau isi dengan currentUser.displayName jika ingin menampilkannya di input (read-only?)
                    }
                } else {
                     // Jika user sudah punya display name, set state name agar terisi/ter-disable di Step 1
                     // Atau kosongkan state 'name' jika input harus kosong walau profil sudah ada nama
                    if (isMounted) setName(currentUser.displayName); // Pilihan: Isi state 'name' jika sudah ada di profil
                    console.log("Pengguna sudah memiliki displayName:", currentUser.displayName);
                     // Hapus juga dari sessionStorage jika kebetulan masih ada (safety measure)
                    sessionStorage.removeItem('pendingSignupName');
                }
                
                // **BARU: Cek status onboarding DARI TABEL onboarding_status**
                console.log("Checking onboarding status from DB for user:", currentUser.id);
                const { data: statusData, error: statusError } = await supabase
                    .from('onboarding_status')
                    .select('is_completed')
                    .eq('user_id', currentUser.id)
                    .maybeSingle(); // Gunakan maybeSingle, karena row mungkin belum ada

                
                if (statusError) {
                    console.error(">>> Error fetching onboarding status:", statusError);
                    setStepError("Gagal memuat status pendaftaran.");
                    // Putuskan: lanjutkan ke step 1 atau stop? Lanjutkan saja.
                }

                // Jika onboarding sudah selesai (data ada dan is_completed true), redirect!
                const isCompleted = statusData?.is_completed === true;
                console.log("Onboarding completed status from DB:", isCompleted);

                if (isCompleted) {
                    console.log(">>> User already completed onboarding via DB flag. Redirecting to /");
                    router.push('/'); // Redirect ke halaman utama
                    return; // Hentikan eksekusi & loading
                }

                // --- Jika onboarding BELUM selesai, tentukan step awal ---
                console.log(">>> Onboarding not completed, determining starting step...");
                const isStep1Complete = !!(currentUser.displayName && currentUser.hasPassword);

                if (!isStep1Complete) {
                    if (isMounted) setCurrentStep(1);
                } else {
                    const isStep2Complete = await checkWorkspaceExists(currentUser.id);
                    
                    if (!isMounted) return;
                    setIsWorkspaceAdded(isStep2Complete); // Update state
                    if (isMounted) setCurrentStep(isStep2Complete ? 3 : 2); // Tentukan step
                }

            } catch (error: any) {
                console.error(">>> Error in fetchAndInitialize:", error);
                if (isMounted) { setStepError(`Gagal memuat status: ${error.message}`); setCurrentStep(1); }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        if (isLoading) { fetchAndInitialize(); }
            return () => { isMounted = false; };
    }, [app, supabase, isLoading]); // Jangan lupa 'isLoading'


    const saveProfileData = async (): Promise<boolean> => {
        if (!user || !user.id) { // Pastikan user dan user.id ada
             setStepError("Sesi pengguna tidak valid.");
             return false;
        }
        setIsSavingStep(true);
        setStepError('');
        let success = false;
        let stackFrameUpdateSuccess = false; // Flag untuk status update StackFrame

        console.log(">>> saveProfileData: Attempting to save profile data...");
        try {
            const tasks = [];
            const shouldUpdateName = name && name !== userData?.displayName;
            const shouldUpdatePassword = password && !userData?.hasPassword;

            // Siapkan task untuk StackFrame
            if (shouldUpdateName) {
                tasks.push(user.setDisplayName(name));
                console.log(">>> saveProfileData: Queued StackFrame displayName update.");
            }
            if (shouldUpdatePassword) {
                 tasks.push(user.setPassword({ password }));
                 console.log(">>> saveProfileData: Queued StackFrame password update.");
            }

            // Jalankan update ke StackFrame
            if (tasks.length > 0) {
                await Promise.all(tasks);
                console.log(">>> saveProfileData: StackFrame profile data saved successfully.");
                stackFrameUpdateSuccess = true; // Tandai update StackFrame berhasil
                // Refresh data user lokal dari StackFrame
                const updatedUser = await app.getUser();
                setUserData(updatedUser);
                setPassword(''); // Kosongkan field password setelah berhasil
            } else {
                console.log(">>> saveProfileData: No StackFrame profile data changes to save.");
                stackFrameUpdateSuccess = true; // Tidak ada yg diubah, anggap berhasil
            }

            // *** BARU: Update displayName di Supabase JIKA nama diubah di StackFrame ***
            if (stackFrameUpdateSuccess && shouldUpdateName) {
                console.log(`>>> saveProfileData: Attempting to update displayName in Supabase for user ${user.id}...`);
                const { error: supabaseUpdateError } = await supabase
                    .from('user') // Target tabel 'user'
                    .update({ displayName: name }) // Data yang diupdate
                    .eq('id', user.id); // Kondisi WHERE id = user.id

                if (supabaseUpdateError) {
                     console.error(">>> saveProfileData: Error updating displayName in Supabase:", supabaseUpdateError);
                     // Putuskan: Apakah error ini menggagalkan keseluruhan proses?
                     // Mungkin tampilkan warning tapi tetap anggap berhasil jika StackFrame OK?
                     // setStepError(`Gagal update nama di database: ${supabaseUpdateError.message}`);
                     // success = false; // Batalkan success jika update Supabase wajib
                } else {
                     console.log(">>> saveProfileData: Successfully updated displayName in Supabase.");
                     // Pastikan state 'name' sinkron jika diperlukan (meskipun setUserData di atas mungkin sudah cukup)
                }
            }

            // Jika semua proses (StackFrame & Supabase yg relevan) berhasil
            success = stackFrameUpdateSuccess; // Sesuaikan logika 'success' jika update Supabase wajib

        } catch (err: any) {
            console.error(`>>> saveProfileData: Error saving profile data:`, err);
            setStepError(err.message || `Gagal menyimpan data profil.`);
            success = false;
        } finally {
            setIsSavingStep(false);
        }
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
            setCurrentStep(currentStep + 1);
        } else { // Jika di langkah terakhir (Step 3) dan valid
            console.log(">>> handleNextStep: Finishing on Step 3.");
            setIsSavingStep(true);
            setStepError('');

            try {
                if (!user?.id) throw new Error("User ID tidak ditemukan.");

                // **BARU: Simpan status selesai ke tabel onboarding_status**
                console.log("Saving onboarding status to Supabase for user:", user.id);
                const { error: upsertError } = await supabase
                    .from('onboarding_status')
                    // Upsert: Jika user_id sudah ada, update; jika belum, insert.
                    .upsert(
                        {
                            user_id: user.id,
                            is_completed: true // Set status menjadi true
                        },
                        { onConflict: 'user_id' } // Kolom yang dicek untuk konflik (PK)
                    );

                if (upsertError) {
                    // Jika gagal simpan status, tampilkan error
                    console.error(">>> Gagal simpan status onboarding:", upsertError);
                    setStepError(`Gagal menyimpan status penyelesaian: ${upsertError.message}`);
                    // Mungkin jangan lanjut ke success message? Tergantung kebutuhan.
                    // throw upsertError; // Batalkan jika penyimpanan status wajib berhasil
                } else {
                    console.log(">>> Status onboarding berhasil disimpan.");
                    // Lanjutkan ke pesan sukses HANYA jika simpan status berhasil
                        setFinalSuccessMessage('Pendaftaran berhasil diselesaikan!');
                }

            } catch (err: any) {
                    console.error(">>> Error finishing step 3:", err);
                    if (!stepError) { // Jangan timpa error spesifik dari upsert
                        setStepError(err.message || "Terjadi kesalahan saat menyelesaikan pendaftaran.");
                    }
            } finally {
                setIsSavingStep(false);
            }
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
    if (finalSuccessMessage) { return ( <div className="flex flex-col items-center gap-4 p-6 text-center"> <Check className="w-16 h-16 text-green-500" /> <h2 className="text-2xl font-bold">Pendaftaran Selesai!</h2> <p className="text-green-600">{finalSuccessMessage}. Anda tidak akan membuka laman ini lagi setelah melanjutkan.</p> <Button onClick={() => router.push('/')} className="mt-4 bg-black hover:bg-gray-800"> Lanjutkan ke Aplikasi</Button> </div> ); }


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
                {userData?.primaryEmail || "Memuat..."}
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
             
            <WorkspaceSelector onWorkspaceUpdate={handleWorkspaceUpdate} />
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