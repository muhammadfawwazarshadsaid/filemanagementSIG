// src/components/SelesaikanPendaftaranForm.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils"; // Pastikan path utilitas benar
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Building2, Folder as FolderIcon, Info, Link as LinkIcon
} from "lucide-react";
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import WorkspaceSelector from "./workspace-selector"; // Pastikan path komponen benar
import FolderSelector from "./folder-selector"; // Pastikan path komponen benar
import { supabase } from "@/lib/supabaseClient"; // Pastikan path Supabase client benar
import Link from "next/link";

// Interface Props komponen
interface SelesaikanPendaftaranFormProps extends React.ComponentProps<"div"> {}

// Konstanta Jumlah Langkah
const DEFAULT_TOTAL_STEPS = 3; // Profil -> Workspace -> Folder
const JOIN_FLOW_TOTAL_STEPS = 2; // Profil -> Info Bergabung

// Komponen Utama
export function SelesaikanPendaftaranForm({
  className,
  ...props
}: SelesaikanPendaftaranFormProps) {

  // --- Hooks dan State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const app = useStackApp(); // Hook StackFrame
  const user = useUser(); // Hook StackFrame
  // const { accessToken } = user?.useConnectedAccount('google')?.useAccessToken() ?? { accessToken: null };
  const router = useRouter(); // Hook Next.js Router
  const searchParams = useSearchParams(); // Hook Next.js Search Params

  // State Data User & Loading
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading utama komponen
  const [isSavingStep, setIsSavingStep] = useState(false); // Loading saat submit step/menyimpan
  const [isProcessingLink, setIsProcessingLink] = useState(false); // Loading saat validasi link undangan

  // State Alur Normal (Buat Workspace Sendiri)
  const [isWorkspaceAdded, setIsWorkspaceAdded] = useState(false); // Status dari WorkspaceSelector
  const [hasFolderInWorkspace, setHasFolderInWorkspace] = useState(false); // Status dari FolderSelector
  const [invitationLink, setInvitationLink] = useState(''); // Input link undangan manual
  const [invitationLinkError, setInvitationLinkError] = useState(''); // Error untuk input link undangan

  // State Input Profil (Step 1)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State Error & Sukses
  const [stepError, setStepError] = useState(''); // Error umum (per step/global)
  const [errorName, setErrorName] = useState(''); // Error spesifik input nama
  const [errorPassword, setErrorPassword] = useState(''); // Error spesifik input password
  const [finalSuccessMessage, setFinalSuccessMessage] = useState(''); // Pesan sukses di akhir

  // State Alur Join (Gabung ke Workspace via Undangan)
  const [isJoinFlow, setIsJoinFlow] = useState(false); // Flag penanda alur join
  const [sharedWorkspaceId, setSharedWorkspaceId] = useState<string | null>(null); // ID Workspace yg di-join
  const [sharedWorkspaceName, setSharedWorkspaceName] = useState<string>(''); // Nama Workspace yg di-join
  const [isLoadingWorkspaceName, setIsLoadingWorkspaceName] = useState(false); // Loading saat ambil nama workspace

  // Total langkah berdasarkan alur
  const TOTAL_STEPS = isJoinFlow ? JOIN_FLOW_TOTAL_STEPS : DEFAULT_TOTAL_STEPS;

  // --- Fungsi Utilitas ---
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  // --- Fungsi Callback Memoized (useCallback) ---

  // Ambil Nama Workspace berdasarkan ID (untuk Alur Join)
  const fetchWorkspaceName = useCallback(async (workspaceId: string): Promise<string | null> => {
    if (!supabase) {
      console.error("Supabase client not available in fetchWorkspaceName");
      return null;
    }
    setIsLoadingWorkspaceName(true);
    console.log("Fetching workspace name for ID (useCallback):", workspaceId);
    try {
      // Query ke tabel workspace
      const { data: wsData, error: wsError } = await supabase
        .from('workspace') // Pastikan nama tabel benar
        .select('name') // Hanya butuh nama
        .eq('id', workspaceId)
        .limit(1)
        .maybeSingle();

      if (wsError) throw wsError; // Lempar error Supabase
      if (!wsData) throw new Error("Workspace tidak ditemukan."); // Handle jika ID tidak ada

      console.log("Found workspace data (useCallback):", wsData);
      // Kembalikan nama, atau format default jika nama kosong
      return wsData.name || `Workspace (${workspaceId.substring(0, 6)}...)`;

    } catch (err: any) {
      console.error("Error fetching workspace name (useCallback):", err);
      setStepError(`Gagal memuat info workspace: ${err.message}`); // Tampilkan error global
      setSharedWorkspaceName("(Nama tidak ditemukan)"); // Set state nama error
      return null; // Kembalikan null jika gagal
    } finally {
      setIsLoadingWorkspaceName(false); // Selalu set loading selesai
    }
  }, [supabase, setIsLoadingWorkspaceName, setStepError, setSharedWorkspaceName]); // Dependensi useCallback

  // Cek apakah User sudah punya Workspace pribadi
  const checkWorkspaceExists = useCallback(async (userId: string): Promise<boolean> => {
    if (!supabase) {
      console.error("Supabase client is not initialized.");
      setStepError("Koneksi database gagal.");
      return false;
    }
    console.log("Checking workspace existence for user:", userId);
    try {
      // Query ke tabel workspace, cek count
      const { error, count } = await supabase
        .from('workspace')
        .select('id', { count: 'exact', head: true }) // Efisien, hanya hitung
        .eq('user_id', userId)
        .eq('is_self_workspace', true); // Cari yg milik sendiri

      if (error) {
        console.error("Supabase check workspace error:", error);
        setStepError("Gagal memeriksa data workspace.");
        return false;
      }
      const exists = (count ?? 0) > 0;
      console.log(`Workspace exists for user ${userId}?`, exists);
      return exists; // Kembalikan true/false
    } catch (err) {
      console.error("Check workspace exception:", err);
      setStepError("Terjadi kesalahan saat memeriksa workspace.");
      return false;
    }
  }, [supabase, setStepError]); // Dependensi useCallback

  // Callback dari WorkspaceSelector
  const handleWorkspaceUpdate = useCallback((workspaceExists: boolean) => {
    setIsWorkspaceAdded(workspaceExists); // Update state
    if (workspaceExists) {
      setStepError(''); // Hapus error jika berhasil
    }
  }, [setIsWorkspaceAdded, setStepError]); // Dependensi useCallback

  // Callback dari FolderSelector
  const handleFolderExistenceChange = useCallback((hasFolders: boolean) => {
    setHasFolderInWorkspace(hasFolders); // Update state
    if (hasFolders) {
      setStepError(''); // Hapus error jika berhasil
    }
  }, [setHasFolderInWorkspace, setStepError]); // Dependensi useCallback

  // Simpan Data Profil (Nama & Password) ke StackFrame & Supabase
  const saveProfileData = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      setStepError("Sesi user tidak valid.");
      return false;
    }
    setIsSavingStep(true);
    setStepError('');
    setErrorName('');
    setErrorPassword('');
    let isSuccess = false;

    try {
      const tasks = [];
      const finalName = name.trim();
      const shouldUpdateName = finalName && finalName !== user.displayName;
      const shouldUpdatePassword = password && !user.hasPassword;

      // Validasi Input
      if (!finalName && !user.displayName) {
          setErrorName("Nama lengkap wajib diisi.");
          throw new Error("Nama lengkap kosong.");
      }
      if (shouldUpdatePassword && password.length < 8) {
          setErrorPassword("Password minimal 8 karakter.");
          throw new Error("Password terlalu pendek.");
      }

      // Tambahkan Task ke StackFrame
      if (shouldUpdateName) tasks.push(user.setDisplayName(finalName));
      if (shouldUpdatePassword) tasks.push(user.setPassword({ password }));

      // Jalankan Task StackFrame
      if (tasks.length > 0) {
        await Promise.all(tasks);
        const updatedUser = await app.getUser(); // Ambil data terbaru
        if (updatedUser) setUserData(updatedUser); // Update state lokal
        setPassword(''); // Kosongkan field password
      }

      // Update Nama di Supabase (jika berubah dan ada Supabase client)
      if (shouldUpdateName && supabase) {
        const { error: supabaseError } = await supabase
          .from('user')
          .update({ displayname: finalName })
          .eq('id', user.id);
        if (supabaseError) console.error("Supabase displayname update error:", supabaseError);
        else console.log("Supabase displayname updated.");
      }

      isSuccess = true;
      console.log("Profile data saved successfully.");

    } catch (err: any) {
      console.error("Error saving profile data:", err);
      if (!errorName && !errorPassword) { // Tampilkan error umum jika bukan error validasi spesifik
        setStepError(err.message || 'Gagal menyimpan data profil.');
      }
      isSuccess = false;
    } finally {
      setIsSavingStep(false);
    }
    return isSuccess;
  }, [user, app, name, password, supabase, setStepError, setErrorName, setErrorPassword, setUserData, setIsSavingStep]); // Dependensi useCallback

  // Handle Klik Tombol "Gunakan Link Ini"
  const handleJoinWithLink = useCallback(async () => {
    setInvitationLinkError('');
    setStepError('');
    if (!invitationLink) {
      setInvitationLinkError("Masukkan link undangan terlebih dahulu.");
      return;
    }
    setIsProcessingLink(true);
    console.log("Processing invitation link:", invitationLink);
    try {
      const url = new URL(invitationLink);
      const path = url.pathname;
      const workspaceId = url.searchParams.get('workspace');

      console.log("Parsed URL - Path:", path, "Workspace ID:", workspaceId);

      // Validasi sederhana
      if (path && path.includes('/join-workspace') && workspaceId) {
        console.log("Valid invitation link found. Redirecting...");
        sessionStorage.setItem('pendingJoinWorkspaceId', workspaceId); // Simpan ke session
        router.push(`/join-workspace?workspace=${workspaceId}`); // Redirect!
      } else {
        console.warn("Invalid invitation link format.");
        setInvitationLinkError("Link undangan tidak valid. Pastikan formatnya benar (contoh: .../join-workspace?workspace=ID_WORKSPACE).");
        setIsProcessingLink(false);
      }
    } catch (error) {
      console.error("Invalid URL format:", error);
      setInvitationLinkError("Format URL tidak valid. Pastikan Anda menyalin seluruh link.");
      setIsProcessingLink(false);
    }
  }, [invitationLink, router, setInvitationLinkError, setStepError, setIsProcessingLink]); // Dependensi useCallback

  // --- Efek Samping (useEffect) ---

  // useEffect: Upsert data user ke tabel 'user' Supabase saat user terdeteksi/berubah
  useEffect(() => {
    const upsertUserToSupabase = async () => {
      if (!user || !user.id || !user.primaryEmail || !supabase) return;
      const finalDisplayName = user.displayName || name || null;
      if (!user.primaryEmail) { console.warn("User primary email is missing."); return; }

      const userDataForSupabase = {
        id: user.id,
        displayname: finalDisplayName,
        primaryemail: user.primaryEmail,
      };

      try {
        console.log("Attempting to upsert user:", userDataForSupabase);
        const { error } = await supabase
          .from('user')
          .upsert(userDataForSupabase, { onConflict: 'id' });
        if (error) console.error(">>> Supabase User Upsert Error:", error);
        else console.log(">>> User Upserted/Updated successfully in Supabase.");
      } catch (err) { console.error(">>> Supabase User Upsert Exception:", err); }
    };
    if (user?.id && user.primaryEmail) {
      upsertUserToSupabase();
    }
  }, [user, name, app, supabase]); // Dependensi useEffect

  // useEffect Utama: Inisialisasi, deteksi alur, ambil data user, tentukan step awal
  useEffect(() => {
    let isMounted = true;

    async function fetchAndInitialize() {
      if (!isMounted) return;
      console.log("Running initialization effect...");
      setIsLoading(true);
      setStepError('');
      setFinalSuccessMessage('');
      let detectedJoinFlow = false;
      let workspaceIdForJoin: string | null = null;

      try {
        // 1. Cek Parameter URL '?workspace='
        const workspaceIdFromUrl = searchParams.get('workspace');
        if (workspaceIdFromUrl) {
          console.log("Found 'workspace' URL parameter:", workspaceIdFromUrl);
          if (isMounted) {
            workspaceIdForJoin = workspaceIdFromUrl;
            setIsJoinFlow(true);
            setSharedWorkspaceId(workspaceIdForJoin);
            detectedJoinFlow = true;
            fetchWorkspaceName(workspaceIdForJoin).then((fetchedName) => { // Panggil fetchWorkspaceName
               if (isMounted && fetchedName) setSharedWorkspaceName(fetchedName);
            });
          }
        } else {
          // 2. Fallback ke Session Storage
          const workspaceIdFromSession = sessionStorage.getItem('pendingJoinWorkspaceId');
          if (workspaceIdFromSession) {
             console.log("Found 'pendingJoinWorkspaceId' in session storage:", workspaceIdFromSession);
             if (isMounted) {
                workspaceIdForJoin = workspaceIdFromSession;
                setIsJoinFlow(true);
                setSharedWorkspaceId(workspaceIdForJoin);
                detectedJoinFlow = true;
                fetchWorkspaceName(workspaceIdForJoin).then((fetchedName) => { // Panggil fetchWorkspaceName
                   if (isMounted && fetchedName) setSharedWorkspaceName(fetchedName);
                });
             }
          } else {
            // 3. Bukan Alur Join
            console.log("No join flow detected (URL or session).");
            if (isMounted) setIsJoinFlow(false);
          }
        }

        // 4. Ambil data user saat ini
        const currentUser = await app.getUser();
        if (!isMounted) return;
        if (!currentUser) {
          console.warn("No current user found. Session might be invalid.");
          if (isMounted) {
            setIsLoading(false);
            setStepError("Sesi Anda tidak valid atau telah berakhir. Silakan login kembali.");
          }
          return;
        }

        // 5. Set state data user
        console.log("Current user data:", currentUser);
        if (isMounted) {
          setUserData(currentUser);
          setEmail(currentUser.primaryEmail || '');
          if (currentUser.displayName) {
            setName(currentUser.displayName);
            sessionStorage.removeItem('pendingSignupName');
          } else {
            const pendingName = sessionStorage.getItem('pendingSignupName');
            if (pendingName) { setName(pendingName); sessionStorage.removeItem('pendingSignupName'); }
            else { setName(''); }
          }
        }

        // 6. Cek status onboarding
        if (!supabase) throw new Error("Supabase client not available for onboarding check.");
        const { data: statusData } = await supabase
          .from('onboarding_status').select('is_completed').eq('user_id', currentUser.id).maybeSingle();

        // Jika sudah selesai DAN BUKAN sedang join baru via URL -> redirect
        if (statusData?.is_completed === true && !workspaceIdFromUrl && isMounted) {
          console.log("Onboarding already completed, redirecting to dashboard...");
          router.push('/');
          return;
        }
        // Jika sudah selesai TAPI sedang join baru via URL -> biarkan lanjut
        if (statusData?.is_completed === true && workspaceIdFromUrl && isMounted) {
             console.log("Onboarding complete, but joining a new workspace via URL.");
             if (!isJoinFlow) { // Pastikan state join aktif
                 setIsJoinFlow(true);
                 setSharedWorkspaceId(workspaceIdFromUrl);
                 if (!sharedWorkspaceName) { // Fetch nama jika belum ada
                     fetchWorkspaceName(workspaceIdFromUrl).then(fetchedName => {
                         if (isMounted && fetchedName) setSharedWorkspaceName(fetchedName);
                     });
                 }
             }
         }

        // 7. Tentukan step awal
        const isProfileComplete = !!(currentUser.displayName && currentUser.hasPassword);
        console.log("Is profile complete (name & password)?", isProfileComplete);

        if (isMounted) {
            const currentIsJoinFlow = detectedJoinFlow; // Gunakan nilai terdeteksi di awal effect ini

            if (!isProfileComplete) {
                console.log("Profile incomplete, setting current step to 1.");
                setCurrentStep(1);
            } else {
                if (currentIsJoinFlow) {
                    console.log("Profile complete, Join flow detected, setting current step to 2 (Join Info).");
                    setCurrentStep(2);
                } else {
                    console.log("Profile complete, Normal flow, checking for existing workspace...");
                    const workspaceExists = await checkWorkspaceExists(currentUser.id); // Panggil checkWorkspaceExists
                    if (isMounted && !currentIsJoinFlow) { // Update state isWorkspaceAdded setelah check
                        setIsWorkspaceAdded(workspaceExists);
                    }
                    const nextStep = workspaceExists ? 3 : 2;
                    console.log(`Existing workspace found: ${workspaceExists}. Setting current step to ${nextStep}.`);
                    setCurrentStep(nextStep);
                }
            }
        }

      } catch (error: any) {
        console.error("Initialization error:", error);
        if (isMounted) {
          setStepError(`Terjadi kesalahan saat memuat data: ${error.message}`);
          setCurrentStep(1); // Fallback ke step 1 jika error
        }
      } finally {
        if (isMounted) setIsLoading(false); // Selesai loading utama
      }
    }

    fetchAndInitialize(); // Panggil fungsi inisialisasi

    // Cleanup function
    return () => {
      console.log("Cleanup: SelesaikanPendaftaranForm unmounting.");
      isMounted = false;
    };
  }, [app, supabase, router, user?.id, searchParams, fetchWorkspaceName, checkWorkspaceExists, setIsWorkspaceAdded]); // Dependensi useEffect

  // --- Fungsi Navigasi ---

  // Navigasi ke Step Berikutnya
  const handleNextStep = async () => {
    setStepError('');
    setInvitationLinkError('');
    setErrorName('');
    setErrorPassword('');
    let canProceed = true; // Flag sementara

    // Step 1 -> Step 2/3
    if (currentStep === 1) {
      console.log("Handling Next Step from Step 1 (Profile)");
      const saved = await saveProfileData(); // Simpan profil dulu
      if (!saved) {
        canProceed = false;
      } else {
         const workspaceIdFromUrl = searchParams.get('workspace');
         const workspaceIdFromSession = sessionStorage.getItem('pendingJoinWorkspaceId');
         const actualJoinId = workspaceIdFromUrl || workspaceIdFromSession;

          if (actualJoinId) { // Jika terdeteksi join flow
             router.push('/')
             console.log("Join flow detected post-profile save.");
             setIsJoinFlow(true);
             setSharedWorkspaceId(actualJoinId);
             if (actualJoinId !== sharedWorkspaceId || !sharedWorkspaceName) {
                 fetchWorkspaceName(actualJoinId).then((fetchedName: string | null) => { // Panggil fetchWorkspaceName
                     if (fetchedName !== null) setSharedWorkspaceName(fetchedName || '');
                 });
             }
             setCurrentStep(2); // Lanjut ke step 2 (Join Info)
         } else { // Alur normal
             console.log("Normal flow post-profile save. Checking workspace...");
             const wsExists = await checkWorkspaceExists(user!.id); // Panggil checkWorkspaceExists
             setIsWorkspaceAdded(wsExists); // Update state
             const nextStep = wsExists ? 3 : 2;
             console.log(`Setting next step to ${nextStep}`);
             setCurrentStep(nextStep);
         }
         canProceed = false; // Hentikan eksekusi lanjut di fungsi ini
      }
    }

    // Step 2 -> Step 3 (Normal) / Selesai (Join)
 // Step 2 -> Step 3 (Normal) / Selesai (Join)
    else if (currentStep === 2) {
        console.log("Handling Next Step from Step 2");
        if (isJoinFlow) {
            // --- Penyelesaian Alur Join (Hanya konfirmasi & update status) ---
            console.log("Acknowledging Join Flow Completion in SelesaikanPendaftaranForm");
            // Asumsi: Proses penambahan keanggotaan (insert ke workspace_members)
            // sudah berhasil dilakukan oleh halaman /join-workspace sebelumnya.
            setIsSavingStep(true);
            try {
                // Pastikan user dan supabase client ada
                if (!user?.id || !supabase) {
                    throw new Error("Data user atau koneksi database tidak tersedia.");
                }

                // 1. Pastikan status onboarding user ditandai selesai
                console.log(`Updating onboarding status for user ${user.id} (Join Flow final step)`);
                const { error: upsertError } = await supabase
                    .from('onboarding_status')
                    .upsert({ user_id: user.id, is_completed: true }, { onConflict: 'user_id' });

                // Jika update status gagal, mungkin lempar error agar user tahu
                if (upsertError) {
                    console.error("Error updating onboarding status:", upsertError.message);
                    throw new Error(`Gagal memperbarui status pendaftaran: ${upsertError.message}`);
                }
                console.log("Onboarding status updated successfully.");

                // 2. Hapus session storage yang mungkin tersisa
                console.log("Cleared pendingJoinWorkspaceId from session storage (final step).");

                // 3. Hapus // TODO: yang berhubungan dengan penambahan user ke workspace
                //    TIDAK PERLU LAGI insert ke workspace_members di sini.

                // 4. Tampilkan pesan sukses akhir
                //    Gunakan nama workspace dari state jika ingin menampilkannya
                const finalWorkspaceName = sharedWorkspaceName || "workspace tersebut";
                setFinalSuccessMessage(`Proses bergabung ke ${finalWorkspaceName} selesai!`);
                canProceed = false; // Proses selesai, jangan lanjut

            } catch (e: any) {
                console.error("Error acknowledging join flow completion:", e);
                setStepError(e.message || "Gagal menyelesaikan proses pendaftaran.");
                canProceed = false; // Stop jika ada error
            } finally {
                setIsSavingStep(false);
            }
            // --- Akhir Logika Join Flow ---

        } else {
            // Validasi Alur Normal Step 2 (Tombol ini hanya untuk alur WorkspaceSelector)
             console.log("Validating Normal Flow Step 2 (Workspace Added?)");
            if (!isWorkspaceAdded) {
                setStepError("Hubungkan Google Drive Anda (di bagian atas) untuk melanjutkan.");
                canProceed = false;
            } else {
                 console.log("Workspace added, proceeding to Step 3.");
                 setCurrentStep(3); // Lanjut ke step 3 (Folder)
                 canProceed = false; // Stop eksekusi lebih lanjut di fungsi ini
            }
        }
    }


    // Step 3 -> Selesai (Normal)
    else if (currentStep === 3 && !isJoinFlow) {
        console.log("Handling Next Step from Step 3 (Normal Flow Completion)");
        // Folder opsional, bisa langsung selesaikan
        setIsSavingStep(true);
        try {
            if (!user?.id || !supabase) throw new Error("Data tidak lengkap untuk menyelesaikan.");
            // Update status onboarding
            const { error: upsertError } = await supabase.from('onboarding_status').upsert({ user_id: user.id, is_completed: true }, { onConflict: 'user_id' });
            if (upsertError) throw upsertError;
            setFinalSuccessMessage('Pendaftaran Anda selesai!');
            canProceed = false;
        } catch (e: any) {
            console.error("Error completing normal flow onboarding:", e);
            setStepError(e.message || "Gagal menyelesaikan pendaftaran.");
            canProceed = false;
        } finally {
            setIsSavingStep(false);
        }
    }

    // Fallback (seharusnya tidak tercapai jika logic di atas benar)
    if (canProceed && currentStep < TOTAL_STEPS) {
       console.warn(`Proceeding to next step (${currentStep + 1}) unexpectedly.`);
       setCurrentStep(currentStep + 1);
    }
  };

  // Navigasi ke Step Sebelumnya
  const handlePreviousStep = () => {
    setStepError('');
    setInvitationLinkError('');
    setErrorName('');
    setErrorPassword('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Reset state join flow jika kembali ke step 1 dari step 2 join? (Opsional)
      // if (currentStep === 2 && isJoinFlow) {
      //   setIsJoinFlow(false);
      //   setSharedWorkspaceId(null);
      //   setSharedWorkspaceName('');
      // }
    }
  };

  // --- Komponen Internal ---

  // Progress Step Indicator
// --- Komponen Internal ---

// Progress Step Indicator - DEBUG VISIBILITY
  const StepProgress = () => {
    const getStepLabel = (stepNumber: number): string => {
      // ... (getStepLabel logic remains the same)
       if (stepNumber === 1) return "Profil";
       if (isJoinFlow) {
         if (stepNumber === 2) return "Info Bergabung";
       } else {
         if (stepNumber === 2) return "Workspace";
         if (stepNumber === 3) return "Folder";
       }
       return `Step ${stepNumber}`;
    };

    console.log("Rendering StepProgress (Debug Visibility):", { isJoinFlow, TOTAL_STEPS, currentStep });

    return (
      <div className="flex justify-center items-center mb-8 w-full max-w-lg mx-auto px-2 gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const shouldRenderLine = stepNumber < TOTAL_STEPS;
          const lineShouldBeGreen = currentStep > stepNumber;

          console.log(`  Step ${stepNumber}:`, { isActive, isCompleted, shouldRenderLine, lineShouldBeGreen });

          return (
            <React.Fragment key={stepNumber}>
              {/* Indikator (Lingkaran + Label) */}
              <div className="flex flex-col items-center w-[70px] shrink-0">
                {/* ... (Circle and Label JSX remains the same) ... */}
                 <div
                   className={cn(
                     "w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 font-semibold transition-colors duration-300 text-sm mb-1",
                     isActive ? "bg-blue-600 border-blue-600 text-white" :
                     isCompleted ? "bg-green-500 border-green-500 text-white" :
                     "border-gray-300 text-gray-500 bg-white"
                   )}
                 >
                   {isCompleted ? <Check size={16} /> : stepNumber}
                 </div>
                 <span
                   className={cn(
                     "text-xs text-center w-full break-words",
                     isActive ? "font-bold text-blue-700" :
                     isCompleted ? "font-semibold text-green-600" :
                     "text-gray-500"
                   )}
                   style={{ lineHeight: '1.1' }}
                 >
                   {getStepLabel(stepNumber)}
                 </span>
              </div>

              {/* Garis Penghubung - DEBUG: Force width and add border */}
              {shouldRenderLine && (
                <div className={cn(
                    // REMOVE flex-1, ADD fixed width, ADD border
                    "w-16 h-1 self-center rounded border border-red-500", // Centered vertically now, fixed width, RED BORDER
                    "transition-colors duration-300 ease-in-out",
                    // Still apply background color logic
                    lineShouldBeGreen ? "bg-green-500" : "bg-gray-300"
                  )}
                  // Add style for explicit visibility test
                  style={{ backgroundColor: lineShouldBeGreen ? 'lime' : 'silver' }} // Use bright colors
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // --- Render Komponen ---

  // Tampilan Loading Awal
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center text-sm text-gray-500 py-10 min-h-[400px]'>
        <Loader2 className="inline h-6 w-6 animate-spin text-blue-500 mb-3"/>
        Memuat data pendaftaran Anda...
      </div>
    );
  }

  // Tampilan Sukses Akhir
  if (finalSuccessMessage) {
    const title = isJoinFlow ? "Berhasil Bergabung!" : "Pendaftaran Selesai!";
    const buttonText = "Masuk ke Aplikasi";

    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center min-h-[400px] justify-center">
        <Check className="w-16 h-16 text-green-500"/>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-green-600">{finalSuccessMessage}</p>
        <Button onClick={() => router.push('/')} className="mt-4 bg-black hover:bg-gray-800">
          {buttonText} <ArrowRight className="ml-2 h-4 w-4"/>
        </Button>
      </div>
    );
  }

  // Render Form Utama
  return (
    <div className={cn("flex flex-col gap-6 bg-background p-4 md:p-8", className)} {...props}>
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center bg-background mb-4">
        <h1 className="scroll-m-20 text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl">
          Selesaikan Pendaftaran
        </h1>
        {isJoinFlow && sharedWorkspaceId && (
           <p className="text-muted-foreground mt-2 text-sm md:text-base px-4">
              Anda diundang bergabung ke: <br className="sm:hidden"/>
              <strong className="text-blue-700 font-semibold">{sharedWorkspaceName || (isLoadingWorkspaceName ? <Loader2 className="inline h-4 w-4 animate-spin mx-1"/> : '(Memuat...)')}</strong>
           </p>
         )}
      </div>

      {/* Progress Indicator */}
      <StepProgress />

      {/* Error Global */}
      {stepError && (
          <p className="text-red-600 text-center text-sm mb-4 font-semibold bg-red-100 p-3 rounded-md border border-red-300 max-w-lg mx-auto">
              {stepError}
          </p>
      )}

      {/* Konten Step Dinamis */}
      <div className="min-h-[350px]">

        {/* --- Step 1: Profil --- */}
        {currentStep === 1 && (
          <div className="grid gap-6 animate-fadeIn max-w-lg mx-auto">
            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email-display">Email</Label>
              <p id="email-display" className="font-medium border p-3 rounded-md bg-gray-100 h-11 flex items-center text-gray-700 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  {userData?.primaryEmail || email || "Memuat..."}
              </p>
            </div>
            {/* Nama Lengkap */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              {userData?.displayName ? (
                  <p className="font-medium border p-3 rounded-md bg-gray-100 h-11 flex items-center text-sm">
                      {userData.displayName}
                  </p>
              ) : (
                  <>
                    <Input className="h-11 text-sm" id="name" value={name} onChange={(e) => { setName(e.target.value); setErrorName(''); setStepError(''); }} type="text" placeholder="Masukkan nama lengkap Anda" disabled={isSavingStep} aria-describedby="name-error"/>
                    {errorName && <p id="name-error" className="text-red-600 font-semibold text-xs mt-1">{errorName}</p>}
                  </>
              )}
            </div>
            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              {userData?.hasPassword ? (
                 <p className="font-medium flex items-center gap-2 text-green-600 text-sm mt-1">Password sudah diatur <span className="p-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center text-white"><Check size={12}/></span></p>
              ) : (
                 <>
                   <div className="relative">
                     <Input id="password" value={password} onChange={(e) => { setPassword(e.target.value); setErrorPassword(''); setStepError(''); }} type={isPasswordVisible ? "text" : "password"} placeholder="Buat Password Baru (min. 8 karakter)" className="h-11 pr-10 text-sm" disabled={isSavingStep} aria-describedby="password-error"/>
                     <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}>{isPasswordVisible ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                   </div>
                   {errorPassword && <p id="password-error" className="text-red-600 font-semibold text-xs mt-1">{errorPassword}</p>}
                 </>
              )}
            </div>
          </div>
        )}

        {/* --- Step 2: Workspace (Normal) / Info Bergabung (Join) --- */}
        {currentStep === 2 && (
          <div className="animate-fadeIn space-y-8">
            {isJoinFlow ? (
              // Tampilan Alur Join
              <div className="max-w-2xl mx-auto text-center">
                 <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Konfirmasi Bergabung</h2>
                 <div className="flex flex-col items-center text-sm p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 space-y-2">
                    <Info size={24} className="flex-shrink-0 text-blue-500"/>
                    <p>Anda akan bergabung ke workspace:</p>
                     <p className="font-bold text-lg">{sharedWorkspaceName || (isLoadingWorkspaceName ? <Loader2 className="inline h-5 w-5 animate-spin mx-1"/> : '(Nama tidak tersedia)')}</p>
                     <p className="text-xs">(ID: {sharedWorkspaceId || 'N/A'})</p>
                    <p className="mt-2">Klik tombol "Selesaikan & Bergabung" di bawah untuk melanjutkan.</p>
                 </div>
              </div>
            ) : (
              // Tampilan Alur Normal (Pilihan)
              <>{/* Bagian 1: Gunakan Link Undangan */}
                <div className="max-w-xl mx-auto">
                    <h3 className="text-xl md:text-2xl font-semibold mb-2 text-center text-gray-800">1. Gunakan Link Undangan</h3>
                    <div className="flex items-start text-sm p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 space-x-3">
                        <LinkIcon size={20} className="flex-shrink-0 text-yellow-600 mt-0.5"/>
                        <span>Workspace mewakili folder utama (root) yang mewakili holding/unit/satuan kerja (misal: Semen Tonasa). Jika Anda punya link undangan untuk bergabung ke Workspace, masukkan di sini.</span>
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="invitation-link">Link Undangan Workspace</Label>
                        <Input id="invitation-link" type="url" placeholder="Tempel link undangan (contoh: https://.../join-workspace?workspace=xxxx)" value={invitationLink} onChange={(e) => { setInvitationLink(e.target.value); setInvitationLinkError(''); setStepError(''); }} className="h-11 text-sm" disabled={isProcessingLink} aria-describedby="invitation-link-error"/>
                        {invitationLinkError && <p id="invitation-link-error" className="text-red-600 font-semibold text-xs mt-1">{invitationLinkError}</p>}
                        <Button type="button" onClick={handleJoinWithLink} disabled={!invitationLink || isProcessingLink} className="w-full justify-center bg-primary hover:bg-red-400 text-white mt-2 h-11">
                            {isProcessingLink ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : <>Gunakan Link Ini</>}
                        </Button>
                    </div>
                </div>

                {/* Pemisah */}
                <div className="relative my-6"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center"><span className="bg-background px-3 text-sm font-medium text-gray-500 uppercase">Atau</span></div></div>

                {/* Bagian 2: Hubungkan Google Drive */}
                <div className="max-w-xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center text-gray-800">2. Hubungkan Google Drive</h2>
                  <div className="flex items-start text-sm p-3 mb-4 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 space-x-3">
                      <Building2 size={24} className="flex-shrink-0 text-indigo-500 mt-0.5"/>
                       <span>Buat Workspace pribadi dengan menempelkan link folder utama (root) dari Google Drive Anda. Anda akan memiliki kontrol penuh atas workspace ini.</span>
                  </div>
                  <WorkspaceSelector onWorkspaceUpdate={handleWorkspaceUpdate} />
                   {isWorkspaceAdded && <p className="text-green-600 text-sm mt-2 flex items-center gap-1 justify-center font-medium"><Check size={16} /> Workspace terhubung!</p>}
                </div>

              </>
            )}
          </div>
        )}

        {/* --- Step 3: Buat Folder Awal (Hanya Alur Normal) --- */}
        {currentStep === 3 && !isJoinFlow && (
          <div className="animate-fadeIn max-w-xl mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center text-gray-800">Buat Folder Awal (Opsional)</h2>
            <div className="flex items-start text-sm p-3 mb-4 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 space-x-3">
                <FolderIcon size={24} className="flex-shrink-0 text-teal-500 mt-0.5"/>
                <span>Buat folder pertama di Workspace pribadi Anda. Bisa dilewati jika belum perlu.</span>
            </div>
            <FolderSelector onFolderExistenceChange={handleFolderExistenceChange}/>
             {hasFolderInWorkspace && <p className="text-green-600 text-sm mt-2 flex items-center gap-1 justify-center font-medium"><Check size={16} /> Folder awal dibuat/dipilih.</p>}
             <p className="text-xs text-gray-500 text-center mt-4">Klik "Selesaikan Pendaftaran" di bawah.</p>
          </div>
        )}
      </div>

      {/* --- Tombol Navigasi Bawah --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-10 border-t pt-6 gap-4">
        {/* Tombol Kembali */}
        <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1 || isSavingStep || isProcessingLink || isLoadingWorkspaceName} className={cn("w-full sm:w-auto px-10 md:px-12 py-3 h-11 text-base border-gray-300 text-gray-700 hover:bg-gray-100", currentStep === 1 ? "invisible" : "")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>

        {/* Tombol Lanjutkan / Selesaikan */}
        <Button type="button" onClick={handleNextStep}
            disabled={
                isLoading || isSavingStep || isProcessingLink || (isJoinFlow && isLoadingWorkspaceName) ||
                (currentStep === 1 && ((!name.trim() && !userData?.displayName) || (!password && !userData?.hasPassword))) ||
                (currentStep === 2 && !isJoinFlow && !isWorkspaceAdded) ||
                (currentStep === 2 && isJoinFlow && !sharedWorkspaceId)
            }
            className={cn("w-full sm:w-auto px-10 md:px-12 py-3 h-11 text-base font-semibold text-white",
                ( // Disabled state
                    isLoading || isSavingStep || isProcessingLink || (isJoinFlow && isLoadingWorkspaceName) ||
                    (currentStep === 1 && ((!name.trim() && !userData?.displayName) || (!password && !userData?.hasPassword))) ||
                    (currentStep === 2 && !isJoinFlow && !isWorkspaceAdded) ||
                    (currentStep === 2 && isJoinFlow && !sharedWorkspaceId)
                ) ? "bg-gray-400 cursor-not-allowed"
                : (currentStep === TOTAL_STEPS) ? "bg-green-600 hover:bg-green-700" // Final step color
                : "bg-black hover:bg-gray-800" // Default next color
            )}
            title={ // Tooltip for disabled state
                (currentStep === 1 && ((!name.trim() && !userData?.displayName) || (!password && !userData?.hasPassword))) ? "Lengkapi Nama & Password" :
                (currentStep === 2 && !isJoinFlow && !isWorkspaceAdded) ? "Hubungkan Google Drive Anda (di atas) untuk melanjutkan" :
                (currentStep === 2 && isJoinFlow && isLoadingWorkspaceName) ? "Memuat..." :
                (currentStep === 2 && isJoinFlow && !sharedWorkspaceId) ? "Informasi workspace tidak ditemukan" :
                isProcessingLink ? "Memproses link..." :
                isLoading ? "Memuat..." :
                isSavingStep ? "Menyimpan..." : ""
            }>
            {isSavingStep ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
            : (currentStep === TOTAL_STEPS ? (isJoinFlow ? "Gabung" : "Selesaikan Pendaftaran")
            : (<>Lanjutkan <ArrowRight className="ml-2 h-4 w-4" /></>)
            )}
        </Button>
      </div>
    </div>
  );
}