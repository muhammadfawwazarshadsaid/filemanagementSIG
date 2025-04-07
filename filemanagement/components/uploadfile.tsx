// components/uploadfile.tsx
"use client";

import { UploadCloud, X } from "lucide-react";
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import ProgressBar from "./ui/progress"; // Pastikan path ini benar

// --- Helper ---
// Fungsi untuk mendapatkan ikon file (sama seperti sebelumnya)
function getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    // ... (kode getFileIcon tetap sama) ...
      switch (extension) {
    case 'doc':
    case 'docx':
    case 'docs':
      return '/word.svg'; // Asumsi ikon ada di public folder
    case 'ppt':
    case 'pptx':
      return '/ppt.svg';
    case 'pdf':
      return '/pdf.svg';
    case 'xls':
    case 'xlsx':
      return '/xlsx.svg';
    case 'txt':
      return '/txt.svg';
    case 'zip':
      return '/zip.svg';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '/picture.svg';
    case 'mp4':
    case 'avi':
    case 'mov':
      return '/video.svg';
    case 'mp3':
    case 'wav':
      return '/music.svg';
    case 'html':
    case 'htm':
    case 'php':
    case 'asp':
      return '/web.svg';
    default:
      return '/file.svg';
  }
}

// --- Tipe Data ---
interface FileUploadProgress {
    progress: number;
    file: File;
    request: XMLHttpRequest | null; // Untuk menyimpan request agar bisa dibatalkan
    status: 'uploading' | 'completed' | 'error' | 'cancelled';
    errorMessage?: string;
}

// --- Props ---
interface FileUploadProps {
    folderId: string | null | undefined; // ID folder tujuan di Google Drive
    accessToken: string | null;        // Token akses Google API
    onUploadSuccess: () => void;         // Callback setelah *satu* file berhasil
    onUploadError?: (fileName: string, error: string) => void; // Callback jika ada error
    disabled?: boolean;                 // Untuk menonaktifkan komponen
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
    disabled = false, // Default value
}: FileUploadProps) {
    // --- State ---
    // Menggunakan state tunggal untuk mengelola semua file dan progressnya
    const [fileStatuses, setFileStatuses] = useState<Record<string, FileUploadProgress>>({}); // Key: unique file identifier (e.g., name+lastModified)

    // --- Fungsi Unggah ---
    const uploadFile = useCallback((file: File) => {
        if (!folderId || !accessToken) {
            console.error("Upload aborted: Missing folderId or accessToken.");
            const errorMessage = "Folder tujuan atau token tidak valid.";
            setFileStatuses(prev => ({
                ...prev,
                [`${file.name}-${file.lastModified}`]: {
                    progress: 0,
                    file: file,
                    request: null,
                    status: 'error',
                    errorMessage: errorMessage,
                }
            }));
            onUploadError?.(file.name, errorMessage);
            return;
        }

        const fileKey = `${file.name}-${file.lastModified}`;
        const metadata = {
            name: file.name,
            parents: [folderId], // Set folder tujuan
            mimeType: file.type || 'application/octet-stream',
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        // Inisialisasi status file
        setFileStatuses(prev => ({
            ...prev,
            [fileKey]: {
                progress: 0,
                file: file,
                request: xhr,
                status: 'uploading',
            }
        }));

        // Event listener untuk progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentage = Math.round((event.loaded / event.total) * 100);
                setFileStatuses(prev => {
                    const current = prev[fileKey];
                    // Hanya update jika status masih uploading
                    if (current && current.status === 'uploading') {
                        return { ...prev, [fileKey]: { ...current, progress: percentage } };
                    }
                    return prev; // Jangan update jika sudah completed, error, atau cancelled
                });
            }
        };

        // Event listener untuk selesai (berhasil)
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log(`Upload successful: ${file.name}`, JSON.parse(xhr.responseText));
                setFileStatuses(prev => {
                     const current = prev[fileKey];
                     if (current) { // Periksa apakah masih ada di state
                         return { ...prev, [fileKey]: { ...current, progress: 100, status: 'completed', request: null } };
                     }
                     return prev;
                 });
                onUploadSuccess(); // Panggil callback sukses dari parent
            } else {
                 // Handle HTTP error (non-2xx status) sebagai error unggah
                 console.error(`Upload failed for ${file.name}: ${xhr.status} ${xhr.statusText}`, xhr.responseText);
                 let errorMessage = `Error ${xhr.status}: ${xhr.statusText}`;
                 try {
                     const errorResponse = JSON.parse(xhr.responseText);
                     errorMessage = errorResponse?.error?.message || errorMessage;
                 } catch (e) {}

                 setFileStatuses(prev => {
                     const current = prev[fileKey];
                      if (current) {
                         return { ...prev, [fileKey]: { ...current, status: 'error', errorMessage: errorMessage, request: null } };
                      }
                      return prev;
                 });
                 onUploadError?.(file.name, errorMessage);
            }
        };

        // Event listener untuk error jaringan atau lainnya
        xhr.onerror = () => {
            console.error(`Upload error (network or other) for ${file.name}`);
            const errorMessage = "Network error or upload failed.";
             setFileStatuses(prev => {
                 const current = prev[fileKey];
                 if (current) {
                    return { ...prev, [fileKey]: { ...current, status: 'error', errorMessage: errorMessage, request: null } };
                 }
                 return prev;
             });
            onUploadError?.(file.name, errorMessage);
        };

        // Event listener untuk pembatalan (triggered by xhr.abort())
        xhr.onabort = () => {
            console.log(`Upload cancelled for ${file.name}`);
            // Status sudah diatur saat tombol cancel ditekan
        };

        // Konfigurasi dan kirim request
        xhr.open('POST', GOOGLE_UPLOAD_URL, true);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        // Jangan set Content-Type, browser akan menanganinya untuk FormData
        xhr.send(formData);

    }, [folderId, accessToken, onUploadSuccess, onUploadError]);


    // --- Fungsi Batal & Hapus ---
    const cancelUpload = (fileKey: string) => {
        setFileStatuses(prev => {
            const current = prev[fileKey];
            if (current && current.request) {
                current.request.abort(); // Batalkan request XHR
                console.log(`Attempting to cancel upload for key: ${fileKey}`);
                // Update status menjadi cancelled, hapus request
                 return { ...prev, [fileKey]: { ...current, status: 'cancelled', request: null, progress: 0 } };
            }
             return prev; // Jika tidak ada request aktif, tidak ada yang perlu dibatalkan
        });
    };

    const removeFileEntry = (fileKey: string) => {
        setFileStatuses(prev => {
            const newState = { ...prev };
            // Pastikan request dibatalkan jika masih berjalan
            if (newState[fileKey]?.request) {
                newState[fileKey].request?.abort();
                console.log(`Aborting request before removing entry for key: ${fileKey}`);
            }
            delete newState[fileKey]; // Hapus entri dari state
            return newState;
        });
         console.log(`Removed file entry for key: ${fileKey}`);
    };

    // --- Dropzone Handler ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (disabled) return; // Jangan proses jika disabled
        console.log("Files dropped:", acceptedFiles);
        acceptedFiles.forEach(file => {
            // Cek apakah file dengan key yang sama sudah ada dan sedang diupload/selesai/error
            const fileKey = `${file.name}-${file.lastModified}`;
             if (!fileStatuses[fileKey] || fileStatuses[fileKey].status === 'cancelled') {
                uploadFile(file);
             } else {
                 console.log(`Skipping duplicate file or file with existing status: ${file.name}`);
                 // Optional: Beri feedback ke user bahwa file sudah ada
            }
        });
    }, [uploadFile, disabled, fileStatuses]); // Tambahkan fileStatuses sebagai dependency

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: disabled || !folderId || !accessToken // Nonaktifkan jika disabled, atau folder/token tidak ada
    });

    // --- Render Helper ---
    const fileEntries = Object.entries(fileStatuses);
    const filesToUpload = fileEntries.filter(([key, status]) => status.status === 'uploading' || status.status === 'cancelled');
    const completedFiles = fileEntries.filter(([key, status]) => status.status === 'completed');
    const errorFiles = fileEntries.filter(([key, status]) => status.status === 'error');


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
                        {!disabled && (
                           <p className="text-xs text-gray-500">
                                Unggah ke folder tujuan
                            </p>
                        )}
                    </div>
                </label>
                {/* Input file tersembunyi */}
                <Input {...getInputProps()} id="dropzone-file" type="file" className="hidden" multiple />
            </div>

             {/* Daftar File yang Diunggah / Gagal / Selesai */}
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
                                        <div className="flex items-center flex-1 p-2">
                                            <img src={getFileIcon(status.file.name)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
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
                                                        className={status.progress === 100 ? "bg-green-500" : "bg-blue-500"} // Ubah warna progress
                                                    />
                                                )}
                                            </div>
                                        </div>
                                         {/* Tombol Aksi (Batal/Hapus) */}
                                         <button
                                            onClick={() => {
                                                if (status.status === 'uploading') {
                                                    cancelUpload(key);
                                                } else { // Jika cancelled, error, atau bahkan completed (jika ingin bisa dihapus dari daftar)
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
                                         <div className="flex items-center flex-1 p-2">
                                             <img src={getFileIcon(status.file.name)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
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

                {/* Selesai Upload */}
                 {completedFiles.length > 0 && (
                     <div className="mt-4">
                        <p className="font-medium my-2 text-green-600 text-sm">
                            Berhasil Diunggah ({completedFiles.length})
                        </p>
                         <ScrollArea className="h-auto max-h-32">
                             <div className="space-y-2 pr-3">
                                {completedFiles.map(([key, status]) => (
                                    <div key={key} className="flex justify-between items-center gap-2 rounded-lg overflow-hidden border border-green-300 bg-green-50 group hover:pr-0 pr-2">
                                        <div className="flex items-center flex-1 p-2">
                                             <img src={getFileIcon(status.file.name)} alt="Ikon File" className="w-8 h-8 flex-shrink-0" />
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
        </div>
    );
}