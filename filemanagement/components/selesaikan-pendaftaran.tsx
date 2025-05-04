// src/components/SelesaikanPendaftaranForm.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Check, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, Building2, Folder as FolderIcon, Info
} from "lucide-react"; // Hapus ikon yg tidak perlu (misal: FileStack)
import { CurrentUser, useStackApp, useUser } from "@stackframe/stack";
import WorkspaceSelector from "./workspace-selector"; // Komponen untuk alur normal
import FolderSelector from "./folder-selector";     // Komponen untuk alur normal
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
// Hapus impor Tooltip dan Badge jika tidak digunakan lagi di komponen ini
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { Badge } from '@/components/ui/badge';

// Hapus Definisi Tipe yang hanya untuk preview folder jika tidak diperlukan lagi
// interface SupabaseFolderMetadata { ... }
// interface GoogleDriveFile { ... }
// interface ManagedItem extends GoogleDriveFile { ... }

// Hapus Helper Components/Functions yang hanya untuk preview folder
// const TagsInputPreview: React.FC<{ ... }> = (...) => { ... };
// const getBgColorClass = (...) => { ... }; // Keep if used elsewhere

interface SelesaikanPendaftaranFormProps extends React.ComponentProps<"div"> {}

// Konstanta Jumlah Langkah
const DEFAULT_TOTAL_STEPS = 3;
const JOIN_FLOW_TOTAL_STEPS = 2;

export function SelesaikanPendaftaranForm({
    className,
    ...props
}: SelesaikanPendaftaranFormProps) {
    // --- State Utama ---
    const [currentStep, setCurrentStep] = useState(1);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const app = useStackApp();
    const user = useUser();
    const { accessToken } = user?.useConnectedAccount('google')?.useAccessToken() ?? { accessToken: null };
    const router = useRouter();

    // Data User & Loading
    const [userData, setUserData] = useState<CurrentUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingStep, setIsSavingStep] = useState(false);

    // State Alur Normal
    const [isWorkspaceAdded, setIsWorkspaceAdded] = useState(false);
    const [hasFolderInWorkspace, setHasFolderInWorkspace] = useState(false);

    // Input Profil
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Error & Sukses
    const [stepError, setStepError] = useState('');
    const [errorName, setErrorName] = useState('');
    const [errorPassword, setErrorPassword] = useState('');
    const [finalSuccessMessage, setFinalSuccessMessage] = useState('');

    // State Alur Join
    const [isJoinFlow, setIsJoinFlow] = useState(false);
    const [sharedWorkspaceId, setSharedWorkspaceId] = useState<string | null>(null);
    const [sharedWorkspaceName, setSharedWorkspaceName] = useState<string>('');
    const [isLoadingWorkspaceName, setIsLoadingWorkspaceName] = useState(false);

    // HAPUS State Preview Folder
    // const [sharedFolders, setSharedFolders] = useState<ManagedItem[]>([]);
    // const [isLoadingSharedFolders, setIsLoadingSharedFolders] = useState(false);
    // const [folderPreviewError, setFolderPreviewError] = useState<string | null>(null);

    const TOTAL_STEPS = isJoinFlow ? JOIN_FLOW_TOTAL_STEPS : DEFAULT_TOTAL_STEPS;
    // --------------------

    const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

    // Fungsi Cek Workspace (Alur Normal)
    const checkWorkspaceExists = useCallback(async (userId: string): Promise<boolean> => {
        if (!supabase) { console.error("Supabase client missing"); setStepError("Koneksi DB gagal."); return false; }
        try {
            const { error, count } = await supabase.from('workspace').select('id', { count: 'exact', head: true }).eq('user_id', userId);
            if (error) { console.error("Supabase check WS error:", error); setStepError("Gagal cek workspace."); return false; }
            const exists = (count ?? 0) > 0;
            setIsWorkspaceAdded(exists); return exists;
        } catch (err) { console.error("Check WS exception:", err); setStepError("Error cek workspace."); return false; }
     }, []);

    // Callback dari komponen anak (Alur Normal)
    const handleWorkspaceUpdate = useCallback((workspaceExists: boolean) => { if (!isJoinFlow) setIsWorkspaceAdded(workspaceExists); }, [isJoinFlow]);
    const handleFolderExistenceChange = useCallback((hasFolders: boolean) => { if (!isJoinFlow) setHasFolderInWorkspace(hasFolders); }, [isJoinFlow]);

    // HAPUS Fungsi Fetch Preview Folder
    // const fetchSharedFoldersPreview = useCallback(async () => { ... }, []);

    // useEffect Upsert User
    useEffect(() => {
        const upsertUserToSupabase = async () => { if (!user || !user.id || !user.primaryEmail) return; const finalDisplayName = user.displayName || name || null; const userDataForSupabase = { id: user.id, displayname: finalDisplayName, primaryemail: user.primaryEmail }; try { const { error } = await supabase.from('user').upsert(userDataForSupabase, { onConflict: 'id' }); if (error) console.error(">>> Supabase Upsert Error:", error); else console.log(">>> User Upserted/Updated in Supabase."); } catch (err) { console.error(">>> Supabase Upsert Exception:", err); } };
        if (user?.id && user.primaryEmail) upsertUserToSupabase();
    }, [user, app, name]);

    // useEffect Utama (Inisialisasi)
    useEffect(() => {
        let isMounted = true;
        async function fetchWorkspaceName(workspaceId: string): Promise<string | null> {
             if (!isMounted || !supabase) return null; if(isMounted) setIsLoadingWorkspaceName(true); try { const { data: ownerData } = await supabase.from('workspace').select('user_id').eq('id', workspaceId).eq('is_self_workspace', true).limit(1).maybeSingle(); let refId = ownerData?.user_id; if (!refId) { const { data: anyData } = await supabase.from('workspace').select('user_id').eq('id', workspaceId).limit(1).maybeSingle(); refId = anyData?.user_id; } if (!refId) throw new Error("User ref tidak ditemukan"); const { data, error } = await supabase.from('workspace').select('name').eq('id', workspaceId).eq('user_id', refId).single(); if (error) throw error; return data.name; } catch (err: any) { console.error("Error fetching workspace name:", err); if (isMounted) setStepError(`Gagal load info workspace: ${err.message}`); return null; } finally { if (isMounted) setIsLoadingWorkspaceName(false); }
        }

        async function fetchAndInitialize() {
            if (!isMounted) return; setIsLoading(true); setStepError(''); setFinalSuccessMessage('');
            let detectedJoinFlow = false; let pendingWorkspaceId: string | null = null;
            try {
                pendingWorkspaceId = sessionStorage.getItem('pendingJoinWorkspaceId');
                if (pendingWorkspaceId) { if (isMounted) { setIsJoinFlow(true); setSharedWorkspaceId(pendingWorkspaceId); detectedJoinFlow = true; fetchWorkspaceName(pendingWorkspaceId).then(name => { if (isMounted && name) setSharedWorkspaceName(name); }); } }
                else { if (isMounted) setIsJoinFlow(false); }

                const currentUser = await app.getUser(); if (!isMounted) return;
                if (!currentUser) { if (isMounted) { setIsLoading(false); setStepError("Sesi tidak valid."); } return; }
                if (isMounted) { setUserData(currentUser); setEmail(currentUser.primaryEmail || ''); if (!currentUser.displayName) { const pn = sessionStorage.getItem('pendingSignupName'); if (pn) setName(pn); sessionStorage.removeItem('pendingSignupName'); } else { setName(currentUser.displayName); sessionStorage.removeItem('pendingSignupName'); } }

                const { data: statusData } = await supabase.from('onboarding_status').select('is_completed').eq('user_id', currentUser.id).maybeSingle();
                if (statusData?.is_completed === true) { router.push('/'); return; }

                // HAPUS Panggilan fetch folder preview
                // if (detectedJoinFlow && pendingWorkspaceId && accessToken && currentUser?.id && isMounted) { ... }

                const isStep1Done = !!(currentUser.displayName && currentUser.hasPassword);
                if (isMounted) {
                    if (!isStep1Done) setCurrentStep(1);
                    else { if (detectedJoinFlow) setCurrentStep(2); else { const wsExists = await checkWorkspaceExists(currentUser.id); setCurrentStep(wsExists ? 3 : 2); } }
                }
            } catch (error: any) { if (isMounted) { setStepError(`Gagal inisialisasi: ${error.message}`); setCurrentStep(1); } }
            finally { if (isMounted) setIsLoading(false); }
        }
        fetchAndInitialize(); return () => { isMounted = false; };
     }, [app, supabase, router, checkWorkspaceExists, accessToken, user?.id]); // Hapus fetchSharedFoldersPreview dari dependency

     // HAPUS useEffect untuk trigger fetch folder saat step 2 aktif
     // useEffect(() => { ... }, []);


    // Fungsi Simpan Profil
    const saveProfileData = async (): Promise<boolean> => {
        if (!user?.id) { setStepError("Sesi invalid."); return false; }
        setIsSavingStep(true); setStepError(''); setErrorName(''); setErrorPassword('');
        let ok = false;
        try {
            const tasks = []; const finalName = userData?.displayName || name;
            const updateName = finalName && finalName !== userData?.displayName;
            const updatePassword = password && !userData?.hasPassword;
            if (updateName && finalName) tasks.push(user.setDisplayName(finalName));
            if (updatePassword) tasks.push(user.setPassword({ password }));
            if (tasks.length > 0) { await Promise.all(tasks); const updatedUser = await app.getUser(); if (updatedUser) setUserData(updatedUser); setPassword(''); }
            if (updateName && finalName) { await supabase.from('user').update({ displayname: finalName }).eq('id', user.id); }
            ok = true;
        } catch (err: any) { setStepError(err.message || 'Gagal simpan profil.'); ok = false; }
        finally { setIsSavingStep(false); }
        return ok;
    };

    // Fungsi Navigasi Next Step
    const handleNextStep = async () => {
        setStepError(''); setErrorName(''); setErrorPassword(''); let isValid = true; let saved = true;
        if (currentStep === 1) {
            const finalName = userData?.displayName || name;
            if (!finalName) { setErrorName('Nama wajib diisi.'); isValid = false; }
            if (!password && !userData?.hasPassword) { setErrorPassword('Password wajib diisi.'); isValid = false; }
            if (isValid) { saved = await saveProfileData(); if (!saved && !stepError) setStepError("Gagal menyimpan profil."); }
            else if (!stepError) { setStepError("Mohon lengkapi profil Anda."); }
            if (isValid && saved) { if (isJoinFlow) setCurrentStep(2); else { const wsExists = await checkWorkspaceExists(user!.id); setCurrentStep(wsExists ? 3 : 2); } }
            if (!isValid || !saved) return;
        } else if (currentStep === 2) {
            if (isJoinFlow) { // Penyelesaian Alur Join
                 setIsSavingStep(true); try { if (!user?.id) throw new Error("User ID invalid."); await supabase.from('onboarding_status').upsert({ user_id: user.id, is_completed: true }, { onConflict: 'user_id' }); setFinalSuccessMessage('Profil siap! Anda akan diarahkan untuk bergabung.'); } catch (e: any) { setStepError(e.message || "Gagal menyelesaikan."); } finally { setIsSavingStep(false); }
            } else { // Validasi Alur Normal Step 2
                if (!isWorkspaceAdded) { setStepError("Workspace diperlukan."); isValid = false; } if (isValid) setCurrentStep(3);
            }
        } else if (currentStep === 3 && !isJoinFlow) { // Penyelesaian Alur Normal
            if (!hasFolderInWorkspace) { /* optional validation */ }
            setIsSavingStep(true); try { if (!user?.id) throw new Error("User ID invalid."); await supabase.from('onboarding_status').upsert({ user_id: user.id, is_completed: true }, { onConflict: 'user_id' }); setFinalSuccessMessage('Pendaftaran selesai!'); } catch (e: any) { setStepError(e.message || "Gagal menyelesaikan."); } finally { setIsSavingStep(false); }
        }
    };

    // Fungsi Navigasi Previous Step
    const handlePreviousStep = () => { setStepError(''); setErrorName(''); setErrorPassword(''); if (currentStep > 1) setCurrentStep(currentStep - 1); };

    // Komponen Progress Step
    const StepProgress = () => { const getLbl=(n:number)=>n===1?"Profil":isJoinFlow?"Info":n===2?"Workspace":"Folder"; return(<div className="flex justify-center items-center space-x-4 mb-8">{Array.from({length:TOTAL_STEPS},(_,i)=>{const n=i+1; const act=n===currentStep; const past=n<currentStep; const done=past||(n===1&&!!userData?.displayName&&!!userData?.hasPassword)||(!isJoinFlow&&n===2&&isWorkspaceAdded&&(past||act))||(!isJoinFlow&&n===3&&hasFolderInWorkspace&&(past||act)); return(<React.Fragment key={n}><div className="flex flex-col items-center w-20"><div className={cn("w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 font-semibold t-c duration-300 text-sm",act&&!done?"bg-blue-600 border-blue-600 text-white":done?"bg-green-500 border-green-500 text-white":"border-gray-300 text-gray-500")}>{done?<Check size={16}/>:n}</div><span className={cn("text-xs text-center mt-1 w-full",act&&!done?"font-bold text-blue-700":"text-gray-500",done?"text-green-600":"")}>{getLbl(n)}</span></div>{n<TOTAL_STEPS&&<div className={cn("flex-1 h-1 t-c duration-300",done?"bg-green-500":"bg-gray-300")}/>}</React.Fragment>);})}</div>);};

    // HAPUS Komponen Render Folder Preview Item
    // const renderFolderPreviewItem = (item: ManagedItem) => { ... };

    // Render Loading/Sukses
    if (isLoading) return <div className='flex items-center justify-center text-sm text-gray-500 py-6'><Loader2 className="inline mr-2 h-5 w-5 animate-spin text-blue-500"/> Memuat...</div>;
    if (finalSuccessMessage) { const tit=isJoinFlow?"Profil Siap!":"Selesai!"; const btn=isJoinFlow?"Lanjut & Bergabung":"Masuk Aplikasi"; return (<div className="flex flex-col items-center gap-4 p-6 text-center"><Check className="w-16 h-16 text-green-500"/><h2 className="text-2xl font-bold">{tit}</h2><p className="text-green-600">{finalSuccessMessage}</p><Button onClick={()=>router.push('/')} className="mt-4 bg-black hover:bg-gray-800">{btn}</Button></div>); }

    // --- Render Utama Form ---
    return (
        // <TooltipProvider> {/* Hapus jika tidak ada Tooltip lagi */}
            <div className={cn("flex flex-col gap-6 bg-background p-4 md:p-8", className)} {...props}>
                {/* Header */}
                <div className="flex flex-col items-center gap-2 text-center bg-background">
                    <h1 className="scroll-m-20 text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl"> Selesaikan Pendaftaran </h1>
                    {isJoinFlow && sharedWorkspaceId && ( <p className="text-muted-foreground mt-2 text-sm md:text-base"> Anda diundang bergabung ke: <br className="sm:hidden"/> <strong className="text-blue-700">{sharedWorkspaceName || (isLoadingWorkspaceName ? <Loader2 className="inline h-4 w-4 animate-spin"/> : '(Memuat nama...)')}</strong> </p> )}
                </div>

                {/* Progress */}
                <StepProgress />

                {/* Error Global */}
                {stepError && <p className="text-red-600 text-center text-sm mb-4 font-semibold bg-red-100 p-3 rounded-md border border-red-300">{stepError}</p>}

                {/* Konten Step */}
                <div className="min-h-[250px]"> {/* Sesuaikan min-h lagi */}
                    {currentStep === 1 && ( <div className="grid gap-6 animate-fadeIn max-w-lg mx-auto"> {/* Step 1 Content */} <div className="grid gap-3"> <Label htmlFor="email">Email</Label> <p className="font-medium border p-3 rounded-md bg-gray-100 h-12 flex items-center text-gray-700 text-sm">{userData?.primaryEmail||email||"..."}</p> </div> <div className="grid gap-3"> <Label htmlFor="name">Nama Lengkap</Label> {userData?.displayName?(<p className="font-medium border p-3 rounded-md bg-gray-100 h-12 flex items-center text-sm">{userData.displayName}</p>):(<> <Input className="h-12 text-sm" id="name" value={name} onChange={(e)=>{setName(e.target.value); setErrorName('');}} type="text" placeholder="Nama lengkap Anda" disabled={isSavingStep}/> {errorName&&<p id="name-error" className="text-red-600 font-semibold text-xs">{errorName}</p>} </>)} </div> <div className="grid gap-3"> <Label htmlFor="password">Password</Label> {userData?.hasPassword?(<p className="font-medium flex items-center gap-2 text-green-600 text-sm">Password ok <span className="p-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center text-white"><Check size={12}/></span></p>):(<> <div className="relative"><Input id="password" value={password} onChange={(e)=>{setPassword(e.target.value); setErrorPassword('');}} type={isPasswordVisible?"text":"password"} placeholder="Buat Password Baru (min. 8 karakter)" className="h-12 pr-10 text-sm" disabled={isSavingStep}/> <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 h:text-gray-700" aria-label={isPasswordVisible?"Hide":"Show"}>{isPasswordVisible?<Eye size={16}/>:<EyeOff size={16}/>}</button></div> {errorPassword&&<p id="password-error" className="text-red-600 font-semibold text-xs">{errorPassword}</p>} </>)} </div> </div> )}
                    {currentStep === 2 && ( <div className="animate-fadeIn space-y-6"> {isJoinFlow ? ( <div> <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center text-gray-800"> Bergabung ke Workspace Bersama {sharedWorkspaceName&&`: ${sharedWorkspaceName}`} {isLoadingWorkspaceName&&!sharedWorkspaceName&&<Loader2 className="inline h-5 w-5 ml-2 animate-spin"/>} </h2> <div className="flex items-start text-sm p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 space-x-3 max-w-3xl mx-auto"> <Info size={24} className="flex-shrink-0 text-blue-500 mt-0.5"/> <span> Workspace bersama ini akan ditambahkan otomatis (akses <strong>view-only</strong>). Anda tidak bisa mengedit / menambah isinya di workspace bersama, namun tetap bisa membuat workspace pribadi yang dapat Anda kelola sendiri. </span> </div>
                     {/* HAPUS BAGIAN PREVIEW FOLDER DARI SINI */}
                     </div> ) : ( <> {/* Normal Flow Step 2 Content */} <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center text-gray-800">Hubungkan Workspace Google Drive</h2> <div className="flex items-start text-sm p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 space-x-3"> <Building2 size={24} className="flex-shrink-0 text-blue-500 mt-0.5"/> <span>Workspace adalah folder utama Google Drive untuk menyimpan data Anda. Tempel link folder GDrive yang sudah ada.</span> </div> <WorkspaceSelector onWorkspaceUpdate={handleWorkspaceUpdate} /> </> )} </div> )}
                    {currentStep === 3 && !isJoinFlow && ( <div className="animate-fadeIn"> {/* Normal Flow Step 3 Content */} <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center text-gray-800">Buat Folder Awal (Opsional)</h2> <div className="flex items-start text-sm p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 space-x-3"> <FolderIcon size={24} className="flex-shrink-0 text-blue-500 mt-0.5"/> <span>Buat folder pertama di workspace Anda. Bisa dilewati.</span> </div> <FolderSelector onFolderExistenceChange={handleFolderExistenceChange}/> </div> )}
                </div>

                {/* Tombol Navigasi */}
                 <div className="flex flex-col sm:flex-row justify-between items-center mt-10 border-t pt-6 gap-4">
                    <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={currentStep === 1 || isSavingStep || isLoadingWorkspaceName } /* Hapus isLoadingSharedFolders */ className={cn("w-full sm:w-auto px-10 md:px-16 py-3 border-gray-300 text-gray-700 hover:bg-gray-50", currentStep === 1 ? "invisible" : "")}> <ArrowLeft className="mr-2 h-4 w-4" /> Kembali </Button>
                    <Button type="button" onClick={handleNextStep} disabled={ isSavingStep || (isJoinFlow && isLoadingWorkspaceName) /* Hapus isLoadingSharedFolders */ || (currentStep === 1 && (!name && !userData?.displayName || !password && !userData?.hasPassword)) || (!isJoinFlow && currentStep === 2 && !isWorkspaceAdded) || (!isJoinFlow && currentStep === 3 && !hasFolderInWorkspace) } className={cn("w-full sm:w-auto text-white px-10 md:px-16 py-3 font-semibold", (currentStep === TOTAL_STEPS && !(isSavingStep || (isJoinFlow && isLoadingWorkspaceName))) /* Hapus isLoading... */ ? "bg-green-600 hover:bg-green-700" : (isSavingStep || (isJoinFlow && isLoadingWorkspaceName) /* Hapus isLoading... */ || (currentStep === 1 && (!name && !userData?.displayName || !password && !userData?.hasPassword)) || (!isJoinFlow && currentStep === 2 && !isWorkspaceAdded) || (!isJoinFlow && currentStep === 3 && !hasFolderInWorkspace)) ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800" )} title={ (currentStep === 1 && (!name && !userData?.displayName || !password && !userData?.hasPassword)) ? "Lengkapi Nama & Password" : (!isJoinFlow && currentStep === 2 && !isWorkspaceAdded) ? "Tambahkan Workspace" : (!isJoinFlow && currentStep === 3 && !hasFolderInWorkspace) ? "Buat Folder Awal" : (isJoinFlow && currentStep === 2 && isLoadingWorkspaceName) /* Hapus isLoading... */ ? "Memuat..." : "" } > {isSavingStep ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> ) : (currentStep === TOTAL_STEPS ? (isJoinFlow ? "Lanjut" : "Selesaikan Pendaftaran") : (<>Lanjutkan <ArrowRight className="ml-2 h-4 w-4" /></>) )} </Button>
                </div>
            </div>
        // </TooltipProvider>
    );
}