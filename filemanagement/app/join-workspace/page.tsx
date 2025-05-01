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

// Interface minimal untuk metadata (bisa disamakan dengan di page.tsx)
interface SupabaseFolderMetadata { id: string; description?: string | null; color?: string | null; labels?: string[] | null; }
interface SupabaseFileMetadata { id: string; description?: string | null; color?: string | null; labels?: string[] | null; pengesahan_pada?: string | null; }
interface SupabaseWorkspaceMetadata { name: string | null; url: string; color: string | null; }

// Fungsi helper getReferenceUserId (sama seperti sebelumnya)
async function getReferenceUserId(supabaseClient: SupabaseClient, workspaceId: string): Promise<string | null> {
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

    // Sederhanakan status karena login tidak terjadi di sini
    type JoinStatus = 'initial_loading' | 'checking_membership' | 'adding' | 'already_member' | 'success' | 'error' | 'no_workspace' | 'redirecting_to_login';
    const [joinStatus, setJoinStatus] = useState<JoinStatus>('initial_loading');
    const [error, setError] = useState<string | null>(null);
    const [workspaceName, setWorkspaceName] = useState<string>('');

    // Fungsi join tetap sama, dipanggil HANYA jika user sudah login
    const handleJoinWorkspace = useCallback(async (userId: string, workspaceToJoinId: string) => {
        setError(null); setJoinStatus('checking_membership');
        if (!supabase) { setError("Koneksi database tidak tersedia."); setJoinStatus('error'); return; }
        try {
            const { data: existingMembership, error: checkError } = await supabase .from('workspace') .select('id') .eq('id', workspaceToJoinId) .eq('user_id', userId) .maybeSingle();
            if (checkError) throw new Error(`Gagal cek keanggotaan: ${checkError.message}`);
            if (existingMembership) { const { data: wsData } = await supabase.from('workspace').select('name').eq('id', workspaceToJoinId).maybeSingle(); setWorkspaceName(wsData?.name || 'ini'); setJoinStatus('already_member'); return; }

            setJoinStatus('adding');
            // --- Logika Copy Metadata (Sama seperti di page.tsx) ---
            const referenceUserId = await getReferenceUserId(supabase, workspaceToJoinId); if (!referenceUserId) throw new Error("Tidak dapat menemukan pengguna referensi.");
            const { data: workspaceDetails, error: detailsError } = await supabase .from('workspace') .select('name, url, color') .eq('id', workspaceToJoinId) .eq('user_id', referenceUserId) .single(); if (detailsError || !workspaceDetails) throw new Error(`Gagal ambil detail workspace: ${detailsError?.message || 'Detail tidak ada'}`); setWorkspaceName(workspaceDetails.name || 'ini');
            const { data: folderIdsData, error: folderIdError } = await supabase.from('folder').select('id').eq('workspace_id', workspaceToJoinId); if(folderIdError) throw folderIdError; const distinctFolderIds = [...new Set((folderIdsData || []).map(f => f.id))];
            const { data: fileIdsData, error: fileIdError } = await supabase.from('file').select('id').eq('workspace_id', workspaceToJoinId); if(fileIdError) throw fileIdError; const distinctFileIds = [...new Set((fileIdsData || []).map(f => f.id))];
            const folderMetadataMap = new Map<string, SupabaseFolderMetadata>(); if (distinctFolderIds.length > 0) { const { data: fm, error: fme } = await supabase .from('folder') .select('id, description, color, labels') .in('id', distinctFolderIds) .eq('workspace_id', workspaceToJoinId) .eq('user_id', referenceUserId); if (fme) throw fme; (fm || []).forEach(m => folderMetadataMap.set(m.id, m)); }
            const fileMetadataMap = new Map<string, SupabaseFileMetadata>(); if (distinctFileIds.length > 0) { const { data: fim, error: fime } = await supabase .from('file') .select('id, description, color, labels, pengesahan_pada') .in('id', distinctFileIds) .eq('workspace_id', workspaceToJoinId) .eq('user_id', referenceUserId); if (fime) throw fime; (fim || []).forEach(m => fileMetadataMap.set(m.id, m)); }
            const workspaceInsert = { id: workspaceToJoinId, user_id: userId, url: workspaceDetails.url, name: workspaceDetails.name, is_self_workspace: false, color: workspaceDetails.color };
            const folderInserts = distinctFolderIds.map(fid => { const m = folderMetadataMap.get(fid); return { id: fid, workspace_id: workspaceToJoinId, user_id: userId, is_self_folder: false, description: m?.description??null, color: m?.color??null, labels: m?.labels??null }; });
            const fileInserts = distinctFileIds.map(fid => { const m = fileMetadataMap.get(fid); return { id: fid, workspace_id: workspaceToJoinId, user_id: userId, is_self_file: false, description: m?.description??null, color: m?.color??null, labels: m?.labels??null, pengesahan_pada: m?.pengesahan_pada??null }; });
            // --- End Copy ---
            const { error: wsError } = await supabase.from('workspace').insert(workspaceInsert); if (wsError) throw new Error(`Gagal insert workspace: ${wsError.message}`);
            if (folderInserts.length > 0) { const { error: fldrError } = await supabase.from('folder').insert(folderInserts); if(fldrError) console.warn("Warn insert folder:", fldrError.message); }
            if (fileInserts.length > 0) { const { error: flError } = await supabase.from('file').insert(fileInserts); if(flError) console.warn("Warn insert file:", flError.message); }
            setJoinStatus('success'); toast.success(`Berhasil bergabung ke workspace ${workspaceDetails.name || 'ini'}!`);
            setTimeout(() => { router.push('/'); }, 3000);
        } catch (err: any) { console.error("Error joining:", err); setError(err.message); setJoinStatus('error'); toast.error("Gagal Bergabung", { description: err.message }); }
    }, [supabase, router]);

    useEffect(() => {
        if (!workspaceId) { setError("ID Workspace tidak valid."); setJoinStatus('no_workspace'); return; }
        if (stackframeUser === undefined) { setJoinStatus('initial_loading'); return; } // Masih cek status login

        if (stackframeUser === null) {
            // Pengguna TIDAK login
            console.log("User not logged in, saving pending workspace and redirecting to login...");
            setJoinStatus('redirecting_to_login');
            sessionStorage.setItem('pendingJoinWorkspaceId', workspaceId); // Simpan ID workspace
            router.push('/masuk'); // Arahkan ke halaman login utama Anda
            return; // Hentikan eksekusi lebih lanjut di sini
        }

        // Jika user ADA dan status masih initial_loading (artinya sudah login saat akses link)
        if (stackframeUser.id && workspaceId && joinStatus === 'initial_loading') {
             handleJoinWorkspace(stackframeUser.id, workspaceId);
        }
        // Tidak perlu lagi cek status 'needs_login' karena sudah di-handle redirect

    }, [workspaceId, stackframeUser, handleJoinWorkspace, router, joinStatus]);

    // Render UI berdasarkan status (tanpa opsi login di sini)
    const renderContent = () => {
        switch (joinStatus) {
            case 'initial_loading':
            case 'redirecting_to_login': // Tampilkan loading saat redirect
                return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Memeriksa status...</p> </div>;
            case 'checking_membership': return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Memeriksa...</p> </div>;
            case 'adding': return <div className="flex flex-col items-center gap-2 text-gray-600"> <Loader2 className="h-8 w-8 animate-spin" /> <p>Menambahkan...</p> </div>;
            case 'already_member': return <div className="text-blue-600 space-y-3"> <p>Anda sudah anggota '{workspaceName}'.</p> <Button asChild><Link href="/">Kembali</Link></Button> </div>;
            case 'success': return <div className="text-green-600 space-y-3"> <p>Selamat! Berhasil bergabung '{workspaceName}'.</p> <p className="text-sm text-gray-500">Mengarahkan...</p> <Loader2 className="h-6 w-6 animate-spin mx-auto" /> </div>;
            case 'error': case 'no_workspace': return <div className="text-red-600 space-y-3"> <p>Error:</p> <p className="text-sm font-medium">{error || "Gagal."}</p> <Button asChild variant="outline"><Link href="/">Kembali</Link></Button> </div>;
            default: return null;
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                <h1 className="text-2xl font-semibold mb-6">Bergabung ke Workspace</h1>
                {renderContent()}
            </div>
             {/* PENTING: Render <Toaster /> Anda di root layout (app/layout.tsx) */}
        </div>
    );
}