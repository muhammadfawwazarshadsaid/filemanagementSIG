"use client";

import { UploadCloud, X } from "lucide-react";
import React, { useCallback, useState } from "react"; // Removed useEffect as it's not used
import { useDropzone } from "react-dropzone";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import ProgressBar from "./ui/progress";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct and supabase is properly initialized
import type { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type if needed for supabase prop

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

// --- Props ---
interface FileUploadProps {
    folderId: string | null | undefined;
    accessToken: string | null;
    onUploadSuccess: (gdriveResponse: any) => void; // Modified to accept an argument
    onUploadError?: (fileName: string, error: string) => void;
    disabled?: boolean;
    userId: string;
    workspaceId: string;
    // supabase: SupabaseClient; // Consider passing supabase client as a prop if not using a global instance
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
    userId,         // Destructured here
    workspaceId,    // Destructured here
}: FileUploadProps) {
    const [fileStatuses, setFileStatuses] = useState<Record<string, FileUploadProgress>>({});

    const uploadFile = useCallback((file: File) => {
        if (!folderId || !accessToken) {
            console.error("Upload aborted: Missing folderId or accessToken.");
            const errorMessage = "Folder tujuan atau token tidak valid.";
            setFileStatuses(prev => ({
                ...prev,
                [`${file.name}-${file.lastModified}`]: { progress: 0, file, request: null, status: 'error', errorMessage }
            }));
            onUploadError?.(file.name, errorMessage);
            return;
        }

        // Ensure userId and workspaceId are available before proceeding with an operation that needs them
        if (!userId || !workspaceId) {
            console.error("Upload aborted: Missing userId or workspaceId for Supabase operation.");
            const errorMessage = "Informasi pengguna atau workspace tidak lengkap.";
             setFileStatuses(prev => ({
                ...prev,
                [`${file.name}-${file.lastModified}`]: { progress: 0, file, request: null, status: 'error', errorMessage }
            }));
            onUploadError?.(file.name, errorMessage);
            return;
        }


        const fileKey = `${file.name}-${file.lastModified}`;
        const metadata = {
            name: file.name,
            parents: folderId ? [folderId] : undefined, // Handle case where folderId might be null/undefined if that's allowed
            mimeType: file.type || 'application/octet-stream',
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        setFileStatuses(prev => ({
            ...prev,
            [fileKey]: { progress: 0, file, request: xhr, status: 'uploading' }
        }));

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                setFileStatuses(prev => {
                    const current = prev[fileKey];
                    if (current && current.status === 'uploading') {
                        return { ...prev, [fileKey]: { ...current, progress: percentage } };
                    }
                    return prev;
                });
            }
        };

        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const gdriveResponse = JSON.parse(xhr.responseText);
                const gdriveFileId = gdriveResponse.id;
                const gdriveFileName = gdriveResponse.name;
                const gdriveMimeType = gdriveResponse.mimeType;

                console.log(`[UPLOAD_DEBUG] Google Drive upload successful for: ${file.name}`, gdriveResponse);
                console.log("[UPLOAD_DEBUG] --- Preparing for Supabase upsert ---");
                console.log("[UPLOAD_DEBUG] Supabase client instance:", supabase ? 'Available' : 'MISSING or UNDEFINED!');
                console.log("[UPLOAD_DEBUG] Passed userId:", userId);
                console.log("[UPLOAD_DEBUG] Passed workspaceId:", workspaceId);
                console.log("[UPLOAD_DEBUG] GDrive File ID (for 'id' column):", gdriveFileId);
                console.log("[UPLOAD_DEBUG] GDrive File Name (for 'filename' column):", gdriveFileName);
                console.log("[UPLOAD_DEBUG] GDrive MimeType (for 'mimeType' column):", gdriveMimeType);

                // Double-check critical IDs just before the call
                if (!userId || !workspaceId || !gdriveFileId) {
                    console.error("[UPLOAD_CRITICAL] Aborting Supabase upsert: Critical IDs (userId, workspaceId, or gdriveFileId) are missing or empty just before DB call.");
                    const criticalIdError = "Cannot sync to DB: User, Workspace, or File ID is missing.";
                    setFileStatuses(prev => {
                        const current = prev[fileKey];
                        // Mark as completed for GDrive, but with an error message for DB sync
                        return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null, errorMessage: criticalIdError } } : prev;
                    });
                    onUploadError?.(file.name, `File uploaded to Drive, but ${criticalIdError}`);
                    return; // Stop further execution in this onload
                }

                const upsertPayload = {
                    id: gdriveFileId,
                    workspace_id: workspaceId,
                    user_id: userId,
                    // filename: gdriveFileName,
                    // mimeType: gdriveMimeType,
                    description: "-",
                    pengesahan_pada: null,
                    is_self_file: true,
                };

                console.log("[UPLOAD_DEBUG] Attempting Supabase upsert with payload:", JSON.stringify(upsertPayload, null, 2));

                try {
                    const { data: upsertedData, error: supabaseError } = await supabase
                        .from('file')
                        .upsert(upsertPayload, {
                            onConflict: 'id, workspace_id, user_id', // Ensure this matches a UNIQUE constraint or PK
                        });
                        // If you are using supabase-js v2+ and want to see the returned data:
                        // .select(); // This would make 'upsertedData' populated if RLS allows select.

                    console.log("[UPLOAD_DEBUG] Supabase upsert API call finished.");

                    if (supabaseError) {
                        console.error(`[UPLOAD_CRITICAL] Supabase upsert returned an error for ${file.name}:`, supabaseError);
                        console.error("[UPLOAD_CRITICAL] Supabase error stringified:", JSON.stringify(supabaseError, null, 2));
                        const dbErrorMessage = `DB sync failed: ${supabaseError.message} (Details: ${supabaseError.details}, Code: ${supabaseError.code})`;
                        setFileStatuses(prev => {
                            const current = prev[fileKey];
                            return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null, errorMessage: dbErrorMessage } } : prev;
                        });
                        onUploadError?.(file.name, `File uploaded to Drive, but ${dbErrorMessage}`);
                    } else {
                        console.log(`[UPLOAD_DEBUG] Supabase record created/updated successfully for ${file.name}.`);
                        // console.log("[UPLOAD_DEBUG] Data returned from upsert (if .select() was used and RLS allows):", upsertedData);
                        setFileStatuses(prev => {
                            const current = prev[fileKey];
                            return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null } } : prev;
                        });
                        onUploadSuccess(gdriveResponse);
                    }
                } catch (e: any) {
                    console.error(`[UPLOAD_CRITICAL] Exception during Supabase upsert operation for ${file.name}:`, e);
                    if (e.message) {
                         console.error("[UPLOAD_CRITICAL] Exception message:", e.message);
                    }
                    console.error("[UPLOAD_CRITICAL] Exception stringified:", JSON.stringify(e, null, 2));
                    const catchErrorMessage = `DB sync critical error: ${e.message || "Unknown exception"}`;
                    setFileStatuses(prev => {
                        const current = prev[fileKey];
                        return current ? { ...prev, [fileKey]: { ...current, progress: 100, status: 'error', errorMessage: catchErrorMessage, request: null } } : prev;
                    });
                    onUploadError?.(file.name, `File uploaded to Drive, but ${catchErrorMessage}`);
                }
            } else {
                // This is the Google Drive upload failure case
                console.error(`[UPLOAD_CRITICAL] Google Drive upload failed for ${file.name}: ${xhr.status} ${xhr.statusText}`, xhr.responseText);
                let errorMessageHttp = `Google Drive Error ${xhr.status}: ${xhr.statusText}`;
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    errorMessageHttp = errorResponse?.error?.message || errorMessageHttp;
                } catch (e) { /* Ignore parsing error */ }

                setFileStatuses(prev => {
                    const current = prev[fileKey];
                    return current ? { ...prev, [fileKey]: { ...current, status: 'error', errorMessage: errorMessageHttp, request: null } } : prev;
                });
                onUploadError?.(file.name, errorMessageHttp);
            }
        };

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
            // Status is updated by cancelUpload
        };

        xhr.open('POST', GOOGLE_UPLOAD_URL, true);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.send(formData);

    }, [folderId, accessToken, onUploadSuccess, onUploadError, userId, workspaceId, supabase]); // Added userId, workspaceId, and supabase (if it's stable and from "@/lib/supabaseClient")

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
            if (!fileStatuses[fileKey] || ['cancelled', 'error'].includes(fileStatuses[fileKey].status)) { // Allow re-upload on error or cancel
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
    const completedFiles = fileEntries.filter(([, status]) => status.status === 'completed' && !status.errorMessage); // Only truly completed
    const errorFiles = fileEntries.filter(([, status]) => status.status === 'error' || (status.status === 'completed' && !!status.errorMessage) ); // Errors or completed with DB sync error


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
                        {!disabled && folderId && ( // Show folder info only if folderId is present
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
                                        <div className="flex items-center flex-1 p-2 min-w-0"> {/* Added min-w-0 for truncation */}
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
                                         <div className="flex items-center flex-1 p-2 min-w-0"> {/* Added min-w-0 */}
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
                                        <div className="flex items-center flex-1 p-2 min-w-0"> {/* Added min-w-0 */}
                                             <img src={getFileIcon(status.file.type)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
                                             <div className="w-full ml-2 overflow-hidden">
                                                 <p className="text-sm text-green-800 truncate" title={status.file.name}>
                                                        {status.file.name}
                                                    </p>
                                                    {/* Optionally, show a success message or GDrive file ID here */}
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