"use client";

import { UploadCloud, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "./ui/input"; // Pastikan path ini benar
import { ScrollArea } from "./ui/scroll-area"; // Pastikan path ini benar
import ProgressBar from "./ui/progress"; // Pastikan path ini benar
import { supabase } from "@/lib/supabaseClient"; // Pastikan path ini benar
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Helper ---
function getFileIcon(mimeType: string): string {
    if (!mimeType) {
        return '/file.svg';
    }
    if (mimeType.startsWith('image/')) return '/picture.svg';
    if (mimeType.startsWith('video/')) return '/video.svg';
    if (mimeType.startsWith('audio/')) return '/music.svg';
    if (mimeType.startsWith('text/')) {
        if (mimeType === 'text/html' || mimeType === 'application/xhtml+xml') return '/web.svg';
        return '/txt.svg';
    }
    if (mimeType.startsWith('application/zip') || mimeType.startsWith('application/x-zip-compressed')) return '/zip.svg';
    switch (mimeType) {
        case 'application/pdf': return '/pdf.svg';
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '/word.svg';
        case 'application/vnd.ms-powerpoint':
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return '/ppt.svg';
        case 'application/vnd.ms-excel':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '/xlsx.svg';
        case 'application/octet-stream':
        default: return '/file.svg';
    }
}

// --- Tipe Data ---
interface FileUploadProgress {
    progress: number;
    file: File;
    request: XMLHttpRequest | null;
    status: 'uploading' | 'completed' | 'error' | 'cancelled';
    errorMessage?: string;
}

interface WorkspaceMemberInfo { // Tipe untuk data dari tabel public.workspace
    user_id: string;
    is_self_workspace: boolean | null; // Sesuai skema, bisa null
}

// --- Props ---
interface FileUploadProps {
    folderId: string | null | undefined;
    accessToken: string | null;
    onUploadSuccess: (gdriveResponse: any) => void;
    onUploadError?: (fileName: string, error: string) => void;
    disabled?: boolean;
    userId: string; // ID pengguna yang melakukan upload (uploader)
    workspaceId: string; // ID workspace tujuan upload
}

// --- Konstanta ---
const GOOGLE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// ========================================================================
// Komponen FileUpload (dengan integrasi Google Drive)
// ========================================================================
export default function FileUpload({
    folderId,
    accessToken,
    onUploadSuccess,
    onUploadError,
    disabled = false,
    userId,      // Uploader's ID, tidak secara langsung digunakan di loop multi-upsert tapi penting untuk konteks
    workspaceId, // ID workspace tujuan
}: FileUploadProps) {
    const [fileStatuses, setFileStatuses] = useState<Record<string, FileUploadProgress>>({});

    const uploadFile = useCallback((file: File) => {
        if (!folderId || !accessToken) {
            console.error("Upload aborted: Missing folderId or accessToken.");
            const errorMessage = "Folder tujuan atau token tidak valid.";
            setFileStatuses(prev => ({ ...prev, [`${file.name}-${file.lastModified}`]: { progress: 0, file, request: null, status: 'error', errorMessage } }));
            onUploadError?.(file.name, errorMessage);
            return;
        }

        if (!workspaceId) { // Cek workspaceId di sini juga, karena krusial untuk logika baru
            console.error("Upload aborted: Missing workspaceId for Supabase operation.");
            const errorMessage = "Informasi workspace tidak lengkap.";
            setFileStatuses(prev => ({ ...prev, [`${file.name}-${file.lastModified}`]: { progress: 0, file, request: null, status: 'error', errorMessage } }));
            onUploadError?.(file.name, errorMessage);
            return;
        }

        const fileKey = `${file.name}-${file.lastModified}`;
        const metadata = { name: file.name, parents: folderId ? [folderId] : undefined, mimeType: file.type || 'application/octet-stream' };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        setFileStatuses(prev => ({ ...prev, [fileKey]: { progress: 0, file, request: xhr, status: 'uploading' } }));

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                setFileStatuses(prev => {
                    const current = prev[fileKey];
                    if (current && current.status === 'uploading') return { ...prev, [fileKey]: { ...current, progress: percentage } };
                    return prev;
                });
            }
        };

        // MODIFIED SECTION: xhr.onload
        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const gdriveResponse = JSON.parse(xhr.responseText);
                const gdriveFileId = gdriveResponse.id;
                // const gdriveFileName = gdriveResponse.name; // Tersedia jika ingin disimpan
                // const gdriveMimeType = gdriveResponse.mimeType; // Tersedia jika ingin disimpan

                console.log(`[UPLOAD_DEBUG] Google Drive upload successful for: ${file.name}`, gdriveResponse);

                if (!workspaceId || !gdriveFileId) {
                    const criticalIdError = "Tidak dapat sinkronisasi ke DB: Workspace ID atau GDrive File ID tidak ada.";
                    console.error("[UPLOAD_CRITICAL] Membatalkan Supabase upsert:", criticalIdError);
                    setFileStatuses(prev => {
                        const current = prev[fileKey];
                        return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null, errorMessage: criticalIdError } } : prev;
                    });
                    onUploadError?.(file.name, `File diunggah ke Drive, tetapi ${criticalIdError}`);
                    return;
                }

                try {
                    console.log("[UPLOAD_DEBUG] --- Mempersiapkan Supabase upsert untuk semua pengguna di workspace ---");
                    console.log("[UPLOAD_DEBUG] Mengambil pengguna untuk workspaceId:", workspaceId);

                    // Langkah 1: Ambil semua user_id dan status is_self_workspace dari tabel public.workspace
                    const { data: workspaceUsersData, error: memberError } = await supabase
                        .from('workspace') // Mengacu pada tabel public.workspace
                        .select('user_id, is_self_workspace')
                        .eq('id', workspaceId); // 'id' di tabel workspace adalah workspaceId kita

                    if (memberError) {
                        console.error("[UPLOAD_CRITICAL] Error mengambil anggota workspace:", memberError);
                        throw new Error(`Gagal mengambil anggota workspace: ${memberError.message}`);
                    }

                    const members: WorkspaceMemberInfo[] = workspaceUsersData || [];

                    if (members.length === 0) {
                        console.warn(`[UPLOAD_DEBUG] Tidak ada anggota ditemukan untuk workspace ${workspaceId}. Proses upsert mungkin tidak berjalan untuk siapapun.`);
                        // Panggil onUploadSuccess jika ini dianggap bukan error, atau onUploadError jika ini adalah error.
                        // Jika file berhasil diupload ke GDrive tapi tidak ada user untuk di-upsert, mungkin tetap sukses?
                        setFileStatuses(prev => { // Tandai GDrive upload sebagai selesai
                            const current = prev[fileKey];
                            return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null } } : prev;
                        });
                        onUploadSuccess(gdriveResponse); // Berhasil upload GDrive, tapi tidak ada user di DB
                        return;
                    }

                    console.log(`[UPLOAD_DEBUG] Mencoba Supabase upsert untuk ${members.length} pengguna.`);
                    const upsertPromises = members.map(member => {
                        // Tentukan is_self_file berdasarkan is_self_workspace dari tabel workspace
                        // Jika is_self_workspace null atau false, maka is_self_file adalah false.
                        // Sesuai DDL, is_self_workspace default true, jadi null seharusnya jarang terjadi jika ada record.
                        const isSelfFileForThisMember = Boolean(member.is_self_workspace);

                        const payload = {
                            id: gdriveFileId,                   // ID file dari Google Drive
                            workspace_id: workspaceId,          // ID workspace target
                            user_id: member.user_id,            // ID pengguna anggota workspace
                            // filename: gdriveFileName,        // Uncomment jika kolom ada dan ingin disimpan
                            // mimeType: gdriveMimeType,        // Uncomment jika kolom ada dan ingin disimpan
                            description: "-",                   // Deskripsi default
                            pengesahan_pada: null,              // Default
                            is_self_file: isSelfFileForThisMember, // Ditentukan dari tabel workspace
                        };
                        return supabase.from('file').upsert(payload, { onConflict: 'id, workspace_id, user_id' });
                    });

                    const results = await Promise.allSettled(upsertPromises);
                    console.log("[UPLOAD_DEBUG] Panggilan API Supabase multi-upsert selesai.");

                    const failedUpserts = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && result.value.error));

                    if (failedUpserts.length > 0) {
                        console.error(`[UPLOAD_CRITICAL] Supabase upsert gagal untuk ${failedUpserts.length} dari ${members.length} pengguna.`);
                        failedUpserts.forEach(fail => {
                            if (fail.status === 'rejected') console.error("Alasan penolakan:", fail.reason);
                            else if (fail.status === 'fulfilled' && fail.value.error) console.error("Error Supabase:", fail.value.error);
                        });
                        const dbErrorMessage = `Sinkronisasi DB gagal untuk beberapa pengguna. Cek konsol untuk detail.`;
                        setFileStatuses(prev => {
                            const current = prev[fileKey];
                            return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null, errorMessage: dbErrorMessage } } : prev;
                        });
                        onUploadError?.(file.name, `File diunggah ke Drive, tetapi ${dbErrorMessage}`);
                    } else {
                        console.log(`[UPLOAD_DEBUG] Record Supabase berhasil dibuat/diperbarui untuk semua ${members.length} pengguna terkait file ${gdriveFileId}.`);
                        setFileStatuses(prev => {
                            const current = prev[fileKey];
                            return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null } } : prev;
                        });
                        onUploadSuccess(gdriveResponse); // Sukses keseluruhan
                    }
                } catch (e: any) {
                    console.error(`[UPLOAD_CRITICAL] Pengecualian selama operasi Supabase multi-upsert untuk ${file.name}:`, e);
                    const catchErrorMessage = `Error kritis sinkronisasi DB: ${e.message || "Pengecualian tidak diketahui"}`;
                    setFileStatuses(prev => {
                        const current = prev[fileKey];
                        return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'error', errorMessage: catchErrorMessage, request: null } } : prev;
                    });
                    onUploadError?.(file.name, `File diunggah ke Drive, tetapi ${catchErrorMessage}`);
                }
            } else { // GDrive upload gagal
                console.error(`[UPLOAD_CRITICAL] Google Drive upload gagal untuk ${file.name}: ${xhr.status} ${xhr.statusText}`, xhr.responseText);
                let errorMessageHttp = `Google Drive Error ${xhr.status}: ${xhr.statusText}`;
                try { const errorResponse = JSON.parse(xhr.responseText); errorMessageHttp = errorResponse?.error?.message || errorMessageHttp; } catch (e) { /* ignore */ }
                setFileStatuses(prev => {
                    const current = prev[fileKey];
                    return current ? { ...prev, [fileKey]: { ...current, status: 'error', errorMessage: errorMessageHttp, request: null } } : prev;
                });
                onUploadError?.(file.name, errorMessageHttp);
            }
        };
        // END OF MODIFIED SECTION

        xhr.onerror = () => {
            console.error(`Upload error (network or other) for ${file.name}`);
            const networkErrorMessage = "Network error or upload failed.";
            setFileStatuses(prev => {
                const current = prev[fileKey];
                if (current) {
                    return { ...prev, [fileKey]: { ...current, status: 'error', errorMessage: networkErrorMessage, request: null } };
                }
                return prev;
            });
            onUploadError?.(file.name, networkErrorMessage);
        };

        xhr.onabort = () => {
            console.log(`Upload cancelled for ${file.name}`);
        };

        xhr.open('POST', GOOGLE_UPLOAD_URL, true);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(formData);

    }, [folderId, accessToken, onUploadSuccess, onUploadError, /* userId, */ workspaceId, supabase]); // userId tidak lagi krusial di dependency array ini jika hanya digunakan untuk konteks awal, karena loop iterasi user dari DB


    // ... Sisa kode komponen (cancelUpload, removeFileEntry, onDrop, JSX untuk UI) tetap sama ...
    const cancelUpload = (fileKey: string) => {
        setFileStatuses(prev => {
            const current = prev[fileKey];
            if (current && current.request) {
                current.request.abort();
                return { ...prev, [fileKey]: { ...current, status: 'cancelled', request: null, progress: 0 } };
            }
            return prev;
        });
    };

    const removeFileEntry = (fileKey: string) => {
        setFileStatuses(prev => {
            const newState = { ...prev };
            if (newState[fileKey]?.request && newState[fileKey]?.status === 'uploading') {
                newState[fileKey].request?.abort();
            }
            delete newState[fileKey];
            return newState;
        });
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (disabled) return;
        acceptedFiles.forEach(file => {
            const fileKey = `${file.name}-${file.lastModified}`;
            if (!fileStatuses[fileKey] || ['cancelled', 'error'].includes(fileStatuses[fileKey].status)) {
                uploadFile(file);
            } else {
                console.log(`Skipping duplicate file or file with existing status: ${file.name}`);
            }
        });
    }, [uploadFile, disabled, fileStatuses]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: disabled || !folderId || !accessToken
    });

    const fileEntries = Object.entries(fileStatuses);
    const filesToUpload = fileEntries.filter(([, status]) => status.status === 'uploading' || status.status === 'cancelled');
    const completedFiles = fileEntries.filter(([, status]) => status.status === 'completed' && !status.errorMessage);
    const errorFiles = fileEntries.filter(([, status]) => status.status === 'error' || (status.status === 'completed' && !!status.errorMessage) );


    return (
        <div className="">
            {/* Dropzone Area */}
            <div>
                <label
                    {...getRootProps()}
                    className={`relative flex flex-col items-center justify-center w-full py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                        ${disabled ? 'bg-gray-200 border-gray-400 cursor-not-allowed' : 'bg-gray-50 hover:bg-gray-100 border-gray-300'}
                        ${isDragActive && !disabled ? 'border-blue-500 bg-blue-50' : ''}
                    `}
                >
                    <div className="text-center">
                        <div className={`border p-2 rounded-md max-w-min mx-auto ${disabled ? 'text-gray-400' : ''}`}>
                            <UploadCloud size={20} />
                        </div>
                        <p className={`mt-2 text-sm ${disabled ? 'text-gray-500' : 'text-gray-600'}`}>
                             {disabled ? "Upload dinonaktifkan" : (isDragActive ? "Lepaskan file di sini..." : <><span className="font-semibold">Seret file</span> atau klik</>)}
                        </p>
                        {!disabled && folderId && (
                           <p className="text-xs text-gray-500">
                                Unggah ke folder tujuan
                            </p>
                        )}
                         {!disabled && !folderId && (
                           <p className="text-xs text-orange-500">
                                Folder tujuan belum dipilih
                            </p>
                        )}
                    </div>
                </label>
                <Input {...getInputProps()} id="dropzone-file" type="file" className="hidden" multiple />
            </div>

             {/* Daftar File */}
            {(filesToUpload.length > 0 || completedFiles.length > 0 || errorFiles.length > 0) && (
            <div className="mt-4">
                {/* Proses Upload */}
                 {filesToUpload.length > 0 && (
                    <div>
                        <p className="font-medium my-2 text-muted-foreground text-sm">
                             Sedang Diunggah ({filesToUpload.filter(f => f[1].status === 'uploading').length}) / Dibatalkan ({filesToUpload.filter(f => f[1].status === 'cancelled').length})
                        </p>
                        <ScrollArea className="h-auto max-h-40">
                            <div className="space-y-2 pr-3">
                                {filesToUpload.map(([key, status]) => (
                                    <div
                                        key={key}
                                        className={`flex justify-between items-center gap-2 rounded-lg overflow-hidden border ${status.status === 'cancelled' ? 'border-yellow-300 bg-yellow-50' : 'border-slate-100'} group hover:pr-0 pr-2`}
                                    >
                                        <div className="flex items-center flex-1 p-2 min-w-0">
                                            <img src={getFileIcon(status.file.type)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
                                            <div className="w-full ml-2 space-y-1 overflow-hidden">
                                                <div className="text-sm flex justify-between">
                                                     <p className="text-muted-foreground truncate" title={status.file.name}>
                                                        {status.file.name}
                                                    </p>
                                                    {status.status === 'uploading' && (
                                                      <span className="text-xs flex-shrink-0 ml-2">{status.progress}%</span>
                                                    )}
                                                     {status.status === 'cancelled' && (
                                                      <span className="text-xs flex-shrink-0 ml-2 text-yellow-600">Dibatalkan</span>
                                                    )}
                                                </div>
                                                {status.status === 'uploading' && (
                                                     <ProgressBar
                                                        progress={status.progress}
                                                        className={status.progress === 100 ? "bg-green-500" : "bg-blue-500"}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                         <button
                                            onClick={() => {
                                                if (status.status === 'uploading') {
                                                    cancelUpload(key);
                                                } else {
                                                    removeFileEntry(key);
                                                }
                                            }}
                                            title={status.status === 'uploading' ? "Batalkan Unggahan" : "Hapus dari Daftar"}
                                            className={`${status.status === 'uploading' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-all items-center justify-center cursor-pointer w-10 h-full hidden group-hover:flex flex-shrink-0`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                 {/* Gagal Upload */}
                 {errorFiles.length > 0 && (
                    <div className="mt-4">
                        <p className="font-medium my-2 text-red-600 text-sm">
                            Gagal Diunggah ({errorFiles.length})
                        </p>
                         <ScrollArea className="h-auto max-h-32">
                            <div className="space-y-2 pr-3">
                                {errorFiles.map(([key, status]) => (
                                    <div key={key} className="flex justify-between items-center gap-2 rounded-lg overflow-hidden border border-red-300 bg-red-50 group hover:pr-0 pr-2">
                                         <div className="flex items-center flex-1 p-2 min-w-0">
                                             <img src={getFileIcon(status.file.type)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
                                             <div className="w-full ml-2 space-y-1 overflow-hidden">
                                                  <p className="text-sm text-red-800 truncate" title={status.file.name}>
                                                        {status.file.name}
                                                    </p>
                                                     <p className="text-xs text-red-600 truncate" title={status.errorMessage}>
                                                        Error: {status.errorMessage || "Unknown error"}
                                                    </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFileEntry(key)}
                                            title="Hapus dari Daftar"
                                            className="bg-red-500 hover:bg-red-600 text-white transition-all items-center justify-center cursor-pointer w-10 h-full hidden group-hover:flex flex-shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Selesai Upload (tanpa error sinkronisasi DB) */}
                 {completedFiles.length > 0 && (
                     <div className="mt-4">
                        <p className="font-medium my-2 text-green-600 text-sm">
                            Berhasil Diunggah ({completedFiles.length})
                        </p>
                         <ScrollArea className="h-auto max-h-32">
                             <div className="space-y-2 pr-3">
                                {completedFiles.map(([key, status]) => (
                                    <div key={key} className="flex justify-between items-center gap-2 rounded-lg overflow-hidden border border-green-300 bg-green-50 group hover:pr-0 pr-2">
                                        <div className="flex items-center flex-1 p-2 min-w-0">
                                             <img src={getFileIcon(status.file.type)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
                                             <div className="w-full ml-2 overflow-hidden">
                                                 <p className="text-sm text-green-800 truncate" title={status.file.name}>
                                                        {status.file.name}
                                                    </p>
                                             </div>
                                         </div>
                                         <button
                                            onClick={() => removeFileEntry(key)}
                                            title="Hapus dari Daftar"
                                            className="bg-red-500 hover:bg-red-600 text-white transition-all items-center justify-center cursor-pointer w-10 h-full hidden group-hover:flex flex-shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                             </div>
                         </ScrollArea>
                     </div>
                )}
            </div>
            )}
        </div>
    );
}