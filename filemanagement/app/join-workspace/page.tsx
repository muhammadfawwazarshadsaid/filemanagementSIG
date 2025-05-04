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
    const { data, error } = await supabaseClient
        .from('workspace')
        .select('user_id')
        .eq('id', workspaceId)
        .eq('is_self_workspace', true)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error finding reference user:", error);
        return null;
    }
    if (data) {
        return data.user_id;
    }
    console.warn("Could not find original owner, falling back to first user.");
    const { data: firstUserData, error: firstUserError } = await supabaseClient
        .from('workspace')
        .select('user_id')
        .eq('id', workspaceId)
        .limit(1)
        .maybeSingle();

    if (firstUserError) {
        console.error("Error finding any user:", firstUserError);
        return null;
    }
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
    // --- TAMBAHAN: State untuk mencegah eksekusi ganda ---
    const [isJoining, setIsJoining] = useState(false);

    // --- Fungsi untuk mengatur localStorage tetap sama ---
    const setActiveWorkspaceInStorage = (id: string, name: string | null) => {
        const workspaceData = { id, name: name || 'Workspace' };
        try {
            localStorage.setItem('currentWorkspace', JSON.stringify(workspaceData));
            console.log(`[Join Page] Active workspace set in localStorage:`, workspaceData);
        } catch (storageError) {
            console.error("Error setting active workspace in localStorage:", storageError);
            toast.error("Gagal menyimpan sesi workspace", {
                description: "Tidak dapat mengatur workspace aktif di penyimpanan lokal."
            });
        }
    };

    const handleJoinWorkspace = useCallback(async (userId: string, workspaceToJoinId: string) => {
        // --- TAMBAHAN: Cek apakah proses join sudah berjalan ---
        if (isJoining) {
            console.warn("Join process already in progress. Skipping.");
            return;
        }
        // --- TAMBAHAN: Tandai proses join dimulai ---
        setIsJoining(true);

        setError(null);
        setJoinStatus('checking_membership');
        if (!supabase) {
            setError("Koneksi database tidak tersedia.");
            setJoinStatus('error');
            setIsJoining(false); // <-- Reset flag jika error di awal
            return;
        }

        try {
            // --- Cek keanggotaan ---
            const { data: existingMembership, error: checkError } = await supabase
                .from('workspace')
                .select('id, name')
                .eq('id', workspaceToJoinId)
                .eq('user_id', userId)
                .maybeSingle();

            if (checkError) throw new Error(`Gagal cek keanggotaan: ${checkError.message}`);

            if (existingMembership) {
                const currentWorkspaceName = existingMembership.name || 'ini';
                setWorkspaceName(currentWorkspaceName);
                setJoinStatus('already_member');
                console.log(`User ${userId} is already a member of workspace ${workspaceToJoinId}.`);
                setActiveWorkspaceInStorage(workspaceToJoinId, currentWorkspaceName);
                toast.info(`Anda sudah menjadi anggota workspace '${currentWorkspaceName}'`);
                // Hentikan proses join karena sudah jadi anggota
                // Jangan lupa reset flag isJoining di finally
                return;
            }

            // --- Lanjutkan jika belum menjadi anggota ---
            setJoinStatus('adding');
            console.log(`User ${userId} is not a member, proceeding to join workspace ${workspaceToJoinId}.`);

            // --- Logika Copy Metadata (Sama seperti sebelumnya) ---
            const referenceUserId = await getReferenceUserId(supabase, workspaceToJoinId);
            if (!referenceUserId) throw new Error("Tidak dapat menemukan pengguna referensi untuk menyalin data.");
            console.log(`Using reference user ${referenceUserId} for workspace ${workspaceToJoinId}.`);

            const { data: workspaceDetails, error: detailsError } = await supabase
                .from('workspace')
                .select('name, url, color')
                .eq('id', workspaceToJoinId)
                .eq('user_id', referenceUserId)
                .single();
            if (detailsError || !workspaceDetails) throw new Error(`Gagal ambil detail workspace: ${detailsError?.message || 'Detail tidak ada'}`);

            const joinedWorkspaceName = workspaceDetails.name || 'ini';
            setWorkspaceName(joinedWorkspaceName);
            console.log("Workspace details fetched:", workspaceDetails);

            // Fetch folderIdsData, fileIdsData, etc.
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
                const { data: fm, error: fme } = await supabase.from('folder').select('id, description, color, labels').in('id', distinctFolderIds).eq('workspace_id', workspaceToJoinId).eq('user_id', referenceUserId);
                if (fme) throw fme;
                (fm || []).forEach(m => folderMetadataMap.set(m.id, m));
                console.log("Folder metadata fetched:", folderMetadataMap);
            }

            const fileMetadataMap = new Map<string, SupabaseFileMetadata>();
            if (distinctFileIds.length > 0) {
                const { data: fim, error: fime } = await supabase.from('file').select('id, description, color, labels, pengesahan_pada').in('id', distinctFileIds).eq('workspace_id', workspaceToJoinId).eq('user_id', referenceUserId);
                if (fime) throw fime;
                (fim || []).forEach(m => fileMetadataMap.set(m.id, m));
                console.log("File metadata fetched:", fileMetadataMap);
            }

            // Prepare inserts
            const workspaceInsert = { id: workspaceToJoinId, user_id: userId, url: workspaceDetails.url, name: workspaceDetails.name, is_self_workspace: false, color: workspaceDetails.color };
            const folderInserts = distinctFolderIds.map(fid => { const m = folderMetadataMap.get(fid); return { id: fid, workspace_id: workspaceToJoinId, user_id: userId, is_self_folder: false, description: m?.description??null, color: m?.color??null, labels: m?.labels??null }; });
            const fileInserts = distinctFileIds.map(fid => { const m = fileMetadataMap.get(fid); return { id: fid, workspace_id: workspaceToJoinId, user_id: userId, is_self_file: false, description: m?.description??null, color: m?.color??null, labels: m?.labels??null, pengesahan_pada: m?.pengesahan_pada??null }; });
            // --- End Copy ---

            // --- Insert data ---
            console.log("Inserting workspace data:", workspaceInsert);
            const { error: wsError } = await supabase.from('workspace').insert(workspaceInsert);
            // ----- DI SINI ERROR MUNGKIN TERJADI JIKA ADA RACE CONDITION -----
            if (wsError) {
                 // Periksa apakah errornya adalah duplicate key violation (kode 23505)
                 if (wsError.code === '23505') {
                     console.warn(`Insert failed due to duplicate key for user ${userId} in workspace ${workspaceToJoinId}. Assuming already joined.`);
                     // Anggap user sudah join (mungkin karena race condition), update status ke already_member
                     const currentWorkspaceName = workspaceInsert.name || 'ini';
                     setWorkspaceName(currentWorkspaceName);
                     setJoinStatus('already_member');
                     setActiveWorkspaceInStorage(workspaceToJoinId, currentWorkspaceName);
                     toast.info(`Anda sudah menjadi anggota workspace '${currentWorkspaceName}' (race condition handled).`);
                     return; // Hentikan proses
                 } else {
                    // Jika error lain, lempar seperti biasa
                    throw new Error(`Gagal insert workspace: ${wsError.message}`);
                 }
            }


            if (folderInserts.length > 0) {
                console.log("Inserting folder data:", folderInserts);
                const { error: fldrError } = await supabase.from('folder').insert(folderInserts);
                // Handle potential duplicate errors similarly for folders if needed
                if(fldrError && fldrError.code !== '23505') console.warn("Warn insert folder:", fldrError.message);
            }
            if (fileInserts.length > 0) {
                console.log("Inserting file data:", fileInserts);
                const { error: flError } = await supabase.from('file').insert(fileInserts);
                 // Handle potential duplicate errors similarly for files if needed
                if(flError && flError.code !== '23505') console.warn("Warn insert file:", flError.message);
            }
            // --- End Insert ---

            setJoinStatus('success');
            toast.success(`Berhasil bergabung ke workspace ${joinedWorkspaceName}!`);
            console.log(`Successfully joined user ${userId} to workspace ${workspaceToJoinId}.`);

            setActiveWorkspaceInStorage(workspaceToJoinId, joinedWorkspaceName);

            setTimeout(() => { router.push('/'); }, 3000);

        } catch (err: any) {
            console.error("Error during handleJoinWorkspace:", err);
            const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
            setError(errorMessage);
            setJoinStatus('error');
            toast.error("Gagal Bergabung", { description: errorMessage });
        } finally {
            // --- TAMBAHAN: Pastikan flag direset setelah selesai (baik sukses maupun error) ---
            setIsJoining(false);
        }
    // --- TAMBAHAN: Masukkan isJoining ke dependency array useCallback ---
    }, [supabase, router, isJoining]);


    useEffect(() => {
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
            router.push('/masuk'); // Pastikan route login benar
            return;
        }

        // Hanya panggil handleJoinWorkspace jika statusnya masih initial_loading
        // dan belum ada proses join yang berjalan (cek isJoining)
        if (stackframeUser.id && joinStatus === 'initial_loading' && !isJoining) {
            console.log(`[Effect] User ${stackframeUser.id} is logged in. Initiating join process for workspace ${workspaceId}.`);
            handleJoinWorkspace(stackframeUser.id, workspaceId);
        } else if (stackframeUser.id) {
            console.log(`[Effect] User ${stackframeUser.id} is logged in, but join status is '${joinStatus}' or isJoining is '${isJoining}'. No action needed here.`);
        }

    // Tambahkan isJoining ke dependency array useEffect juga
    }, [workspaceId, stackframeUser, handleJoinWorkspace, router, joinStatus, isJoining]);


    // --- Render UI berdasarkan status (tetap sama) ---
    const renderContent = () => {
        switch (joinStatus) {
            case 'initial_loading':
            case 'redirecting_to_login':
                return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Memproses permintaan...</p> </div>;
            case 'checking_membership': return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Memeriksa keanggotaan...</p> </div>;
            case 'adding': return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Menambahkan Anda ke workspace...</p> </div>;
            case 'already_member': return <div className="text-blue-600 dark:text-blue-400 space-y-3"> <p>Anda sudah menjadi anggota workspace <strong>'{workspaceName}'</strong>.</p><p className="text-sm text-gray-500 dark:text-gray-400">Workspace ini telah diatur sebagai workspace aktif Anda.</p> <Button asChild><Link href="/">Kembali ke Dashboard</Link></Button> </div>;
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