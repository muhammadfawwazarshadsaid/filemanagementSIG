"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser as useStackframeUserHook } from '@stackframe/stack';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SupabaseClient } from '@supabase/supabase-js';

// --- Interfaces tetap sama ---
interface SupabaseFolderMetadata { id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
interface SupabaseFileMetadata { id: string; description?: string | null; color?: string | null; labels?: string[] | null; pengesahan_pada?: string | null; }
interface SupabaseWorkspaceMetadata { name: string | null; url: string; color: string | null; }

// --- Fungsi helper getReferenceUserId tetap sama ---
async function getReferenceUserId(supabaseClient: SupabaseClient, workspaceId: string): Promise<string | null> {
    // ... (kode getReferenceUserId tetap sama)
     const { data, error } = await supabaseClient .from('workspace') .select('user_id') .eq('id', workspaceId) .eq('is_self_workspace', true) .limit(1) .maybeSingle();
     if (error) { console.error("Error finding reference user:", error); return null; }
     if (data) { return data.user_id; }
     console.warn("Could not find original owner, falling back to first user.");
     const { data: firstUserData, error: firstUserError } = await supabaseClient .from('workspace') .select('user_id') .eq('id', workspaceId) .limit(1) .maybeSingle();
     if (firstUserError) { console.error("Error finding any user:", firstUserError); return null; }
     return firstUserData?.user_id || null;
}


export default function JoinWorkspacePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const stackframeUser = useStackframeUserHook();
    const workspaceId = searchParams.get('workspace');

    type JoinStatus = 'initial_loading' | 'checking_membership' | 'adding' | 'already_member' | 'success' | 'error' | 'no_workspace' | 'redirecting_to_login';
    const [joinStatus, setJoinStatus] = useState<JoinStatus>('initial_loading');
    const [error, setError] = useState<string | null>(null);
    const [workspaceName, setWorkspaceName] = useState<string>('');

    // --- Fungsi untuk mengatur localStorage ---
    // Pastikan key 'currentWorkspace' sesuai dengan yang Anda gunakan di seluruh aplikasi
    const setActiveWorkspaceInStorage = (id: string, name: string | null) => {
        const workspaceData = { id, name: name || 'Workspace' }; // Default name jika null
        try {
            localStorage.setItem('currentWorkspace', JSON.stringify(workspaceData));
            console.log(`[Join Page] Active workspace set in localStorage:`, workspaceData);
        } catch (storageError) {
            console.error("Error setting active workspace in localStorage:", storageError);
            // Optional: Beri tahu pengguna jika penyimpanan gagal
            toast.error("Gagal menyimpan sesi workspace", {
                description: "Tidak dapat mengatur workspace aktif di penyimpanan lokal."
            });
        }
    };

    const handleJoinWorkspace = useCallback(async (userId: string, workspaceToJoinId: string) => {
        setError(null); setJoinStatus('checking_membership');
        if (!supabase) { setError("Koneksi database tidak tersedia."); setJoinStatus('error'); return; }
        try {
            // --- Cek keanggotaan ---
            const { data: existingMembership, error: checkError } = await supabase .from('workspace') .select('id, name') // Ambil juga 'name' di sini
            .eq('id', workspaceToJoinId) .eq('user_id', userId) .maybeSingle();

            if (checkError) throw new Error(`Gagal cek keanggotaan: ${checkError.message}`);

            if (existingMembership) {
                const currentWorkspaceName = existingMembership.name || 'ini';
                setWorkspaceName(currentWorkspaceName);
                setJoinStatus('already_member');
                console.log(`User ${userId} is already a member of workspace ${workspaceToJoinId}.`);

                // *** MODIFIKASI 1: Set localStorage untuk anggota yang sudah ada ***
                setActiveWorkspaceInStorage(workspaceToJoinId, currentWorkspaceName);
                // *** AKHIR MODIFIKASI 1 ***

                toast.info(`Anda sudah menjadi anggota workspace '${currentWorkspaceName}'`);
                // Optional: Arahkan ke dashboard atau workspace setelah beberapa detik
                // setTimeout(() => { router.push('/'); }, 3000);
                return; // Hentikan proses join
            }

            // --- Lanjutkan jika belum menjadi anggota ---
            setJoinStatus('adding');
            console.log(`User ${userId} is not a member, proceeding to join workspace ${workspaceToJoinId}.`);

            // --- Logika Copy Metadata (Sama seperti sebelumnya) ---
            const referenceUserId = await getReferenceUserId(supabase, workspaceToJoinId);
            if (!referenceUserId) throw new Error("Tidak dapat menemukan pengguna referensi untuk menyalin data.");
            console.log(`Using reference user ${referenceUserId} for workspace ${workspaceToJoinId}.`);

            const { data: workspaceDetails, error: detailsError } = await supabase .from('workspace') .select('name, url, color') .eq('id', workspaceToJoinId) .eq('user_id', referenceUserId) .single();
            if (detailsError || !workspaceDetails) throw new Error(`Gagal ambil detail workspace: ${detailsError?.message || 'Detail tidak ada'}`);

            const joinedWorkspaceName = workspaceDetails.name || 'ini'; // Simpan nama untuk digunakan nanti
            setWorkspaceName(joinedWorkspaceName);
            console.log("Workspace details fetched:", workspaceDetails);

            // ... (Kode untuk ambil folderIdsData, fileIdsData, metadata folder/file tetap sama) ...
            const { data: folderIdsData, error: folderIdError } = await supabase.from('folder').select('id').eq('workspace_id', workspaceToJoinId).eq('user_id', referenceUserId);
            if(folderIdError) throw folderIdError;
            const distinctFolderIds = [...new Set((folderIdsData || []).map(f => f.id))];
            console.log("Distinct folder IDs to copy:", distinctFolderIds);

            const { data: fileIdsData, error: fileIdError } = await supabase.from('file').select('id').eq('workspace_id', workspaceToJoinId).eq('user_id', referenceUserId);
            if(fileIdError) throw fileIdError;
            const distinctFileIds = [...new Set((fileIdsData || []).map(f => f.id))];
            console.log("Distinct file IDs to copy:", distinctFileIds);

            const folderMetadataMap = new Map<string, SupabaseFolderMetadata>();
            if (distinctFolderIds.length > 0) {
                const { data: fm, error: fme } = await supabase .from('folder') .select('id, description, color, labels') .in('id', distinctFolderIds) .eq('workspace_id', workspaceToJoinId) .eq('user_id', referenceUserId);
                if (fme) throw fme;
                (fm || []).forEach(m => folderMetadataMap.set(m.id, m));
                console.log("Folder metadata fetched:", folderMetadataMap);
            }

            const fileMetadataMap = new Map<string, SupabaseFileMetadata>();
            if (distinctFileIds.length > 0) {
                const { data: fim, error: fime } = await supabase .from('file') .select('id, description, color, labels, pengesahan_pada') .in('id', distinctFileIds) .eq('workspace_id', workspaceToJoinId) .eq('user_id', referenceUserId);
                if (fime) throw fime;
                (fim || []).forEach(m => fileMetadataMap.set(m.id, m));
                console.log("File metadata fetched:", fileMetadataMap);
            }

            const workspaceInsert = { id: workspaceToJoinId, user_id: userId, url: workspaceDetails.url, name: workspaceDetails.name, is_self_workspace: false, color: workspaceDetails.color };
            const folderInserts = distinctFolderIds.map(fid => { const m = folderMetadataMap.get(fid); return { id: fid, workspace_id: workspaceToJoinId, user_id: userId, is_self_folder: false, description: m?.description??null, color: m?.color??null, labels: m?.labels??null }; });
            const fileInserts = distinctFileIds.map(fid => { const m = fileMetadataMap.get(fid); return { id: fid, workspace_id: workspaceToJoinId, user_id: userId, is_self_file: false, description: m?.description??null, color: m?.color??null, labels: m?.labels??null, pengesahan_pada: m?.pengesahan_pada??null }; });
            // --- End Copy ---

            // --- Insert data ---
            console.log("Inserting workspace data:", workspaceInsert);
            const { error: wsError } = await supabase.from('workspace').insert(workspaceInsert);
            if (wsError) throw new Error(`Gagal insert workspace: ${wsError.message}`);

            if (folderInserts.length > 0) {
                console.log("Inserting folder data:", folderInserts);
                const { error: fldrError } = await supabase.from('folder').insert(folderInserts);
                if(fldrError) console.warn("Warn insert folder:", fldrError.message); // Tetap lanjutkan jika hanya warning
            }
            if (fileInserts.length > 0) {
                console.log("Inserting file data:", fileInserts);
                const { error: flError } = await supabase.from('file').insert(fileInserts);
                if(flError) console.warn("Warn insert file:", flError.message); // Tetap lanjutkan jika hanya warning
            }
            // --- End Insert ---

            setJoinStatus('success');
            toast.success(`Berhasil bergabung ke workspace ${joinedWorkspaceName}!`);
            console.log(`Successfully joined user ${userId} to workspace ${workspaceToJoinId}.`);

            // *** MODIFIKASI 2: Set localStorage setelah berhasil join ***
            setActiveWorkspaceInStorage(workspaceToJoinId, joinedWorkspaceName);
            // *** AKHIR MODIFIKASI 2 ***

            // Hapus pending join ID setelah berhasil
            sessionStorage.removeItem('pendingJoinWorkspaceId');
            setTimeout(() => { router.push('/'); }, 3000); // Arahkan ke dashboard

        } catch (err: any) {
            console.error("Error during handleJoinWorkspace:", err);
            const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
            setError(errorMessage);
            setJoinStatus('error');
            toast.error("Gagal Bergabung", { description: errorMessage });
        }
    }, [supabase, router]); // Dependency array untuk useCallback


    useEffect(() => {
        // --- Logika useEffect tetap sama ---
        if (!workspaceId) {
            setError("ID Workspace tidak valid atau tidak ditemukan di URL.");
            setJoinStatus('no_workspace');
            console.warn("No workspace ID found in search params.");
            return;
        }

        console.log(`[Effect] Storing workspaceId '${workspaceId}' to sessionStorage.`);
        sessionStorage.setItem('pendingJoinWorkspaceId', workspaceId);

        if (stackframeUser === undefined) {
            console.log("[Effect] Waiting for Stackframe user status...");
            return;
        }

        if (stackframeUser === null) {
            console.log("[Effect] User is not logged in. Redirecting to login page.");
            setJoinStatus('redirecting_to_login');
            router.push('/masuk');
            return;
        }

        // Hanya panggil handleJoinWorkspace jika statusnya masih initial_loading
        // untuk mencegah pemanggilan berulang jika state lain berubah
        if (stackframeUser.id && joinStatus === 'initial_loading') {
            console.log(`[Effect] User ${stackframeUser.id} is logged in. Initiating join process for workspace ${workspaceId}.`);
             handleJoinWorkspace(stackframeUser.id, workspaceId);
        } else if (stackframeUser.id) {
             console.log(`[Effect] User ${stackframeUser.id} is logged in, but join status is '${joinStatus}'. No action needed here.`);
        }

    // Hanya jalankan effect jika ID workspace, status user, atau fungsi join berubah.
    // router juga dimasukkan jika redirect bergantung padanya.
    }, [workspaceId, stackframeUser, handleJoinWorkspace, router, joinStatus]); // Tambahkan joinStatus ke dependency array jika logika di dalamnya bergantung pada status join terakhir


    // --- Render UI berdasarkan status (tetap sama) ---
    const renderContent = () => {
        switch (joinStatus) {
            case 'initial_loading':
            case 'redirecting_to_login':
                return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Memproses permintaan...</p> </div>;
            case 'checking_membership': return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Memeriksa keanggotaan...</p> </div>;
            case 'adding': return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Menambahkan Anda ke workspace...</p> </div>;
            case 'already_member': return <div className="text-blue-600 dark:text-blue-400 space-y-3"> <p>Anda sudah menjadi anggota workspace <strong>'{workspaceName}'</strong>.</p><p className="text-sm text-gray-500 dark:text-gray-400">Workspace ini telah diatur sebagai workspace aktif Anda.</p> <Button asChild><Link href="/">Kembali ke Dashboard</Link></Button> </div>; // Tambahkan info storage
            case 'success': return <div className="text-green-600 dark:text-green-400 space-y-3"> <p>Selamat! Anda berhasil bergabung ke workspace <strong>'{workspaceName}'</strong>.</p> <p className="text-sm text-gray-500 dark:text-gray-400">Anda akan diarahkan ke dashboard sebentar lagi...</p> <Loader2 className="h-6 w-6 animate-spin mx-auto" /> </div>;
            case 'error': return <div className="text-red-600 dark:text-red-400 space-y-3"> <p className='font-semibold'>Gagal Bergabung ke Workspace</p> <p className="text-sm font-medium bg-red-50 dark:bg-red-900/30 p-2 border border-red-200 dark:border-red-700 rounded">{error || "Terjadi kesalahan yang tidak diketahui."}</p> <Button asChild variant="outline"><Link href="/">Kembali ke Dashboard</Link></Button> </div>;
             case 'no_workspace': return <div className="text-red-600 dark:text-red-400 space-y-3"> <p className='font-semibold'>Workspace Tidak Ditemukan</p> <p className="text-sm font-medium bg-red-50 dark:bg-red-900/30 p-2 border border-red-200 dark:border-red-700 rounded">{error || "Pastikan link undangan yang Anda gunakan benar."}</p> <Button asChild variant="outline"><Link href="/">Kembali ke Dashboard</Link></Button> </div>;
            default:
                 console.warn("Unhandled join status:", joinStatus);
                 return <div className="text-gray-600 dark:text-gray-400">Status tidak diketahui.</div>;
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center max-w-md w-full border dark:border-gray-700">
                <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">Bergabung ke Workspace</h1>
                {renderContent()}
            </div>
             {/* Pastikan <Toaster /> sudah ada di layout utama (app/layout.tsx) */}
        </div>
    );
}