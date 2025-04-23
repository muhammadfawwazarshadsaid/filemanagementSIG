// 'use client';

// import { supabase } from '@/lib/supabaseClient'; // Asumsi path benar
// import React, { useState, useEffect, useCallback, FormEvent, CSSProperties, ChangeEvent } from 'react';
// import GoogleDriveManagerUI from './file-homepage-ui'; // Asumsi path benar

// // --- Definisi Tipe ---

// // Tipe Output (Struktur Flat List yang diinginkan)
// // Idealnya diletakkan di file terpisah (misal: src/types.ts)
// export interface FormattedFile {

//     id: string;
//     filename: string;
//     isFolder: boolean;
//     mimeType: string;
//     pathname: string;
//     webViewLink?: string | null | undefined; // <-- Sudah benar
//     description?: string | null | undefined; // <-- Sudah benar (jika Anda update)
//     foldername?: string | null | undefined; // <-- Sudah benar (jika Anda update)
//     createdat?: string | null | undefined; // <-- Sudah benar (jika Anda update)
//     lastmodified?: string | null | undefined; // <-- Sudah benar (jika Anda update)
//     other?: { }[] | undefined; // <-- Sudah benar (jika Anda update)
// }[]

// // Tipe Internal Google Drive API Response
// interface GoogleDriveFile {
//     id: string;
//     name: string;
//     mimeType: string;
//     parents?: string[];
//     createdTime?: string;
//     modifiedTime?: string;
//     size?: string; // Contoh field tambahan
//     owners?: { displayName: string; emailAddress: string }[]; // Contoh field tambahan
//     [key: string]: any; // Allow other properties
// }
// interface GoogleDriveFilesListResponse { files: GoogleDriveFile[]; }

// // Tipe Internal Metadata dari Supabase
// interface SupabaseItemMetadata {
//     id: string; // Harus cocok dengan GDrive ID
//     workspace_id: string;
//     user_id: string;
//     description?: string | null;
//     color?: string | null;
//     labels?: string[] | null;
//     created_at?: string; // Nama kolom dari Supabase (jika beda dengan GDrive)
//     last_modified?: string; // Nama kolom dari Supabase (jika beda)
//     // Tambahkan custom field lain dari Supabase jika ada
//     project_code?: string; // Contoh custom field
//     [key: string]: any; // Allow other properties
// }

// // Tipe data gabungan internal sebelum transformasi
// // Tipe data gabungan internal sebelum transformasi
// type MergedItem = GoogleDriveFile & Partial<SupabaseItemMetadata>;

// // Tipe untuk item yang dikelola UI (jika UI internal masih dipakai)
// export interface ManagedItem extends GoogleDriveFile {
//     metadata?: SupabaseItemMetadata | null;
// }
// export interface ManagedFileWithParent extends GoogleDriveFile {
//     parentFolderName: string;
//     metadata?: SupabaseItemMetadata | null;
// }

// // --- Konstanta ---
// const GOOGLE_DRIVE_API_FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
// const GOOGLE_DRIVE_UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// // Daftar kunci sumber yang *langsung* memetakan ke kunci standar FormattedFile
// // Digunakan untuk membantu menentukan apa yang masuk ke 'other'
// const MAPPED_SOURCE_KEYS_TO_STANDARD = [
//     'id',           // -> id
//     'name',         // -> filename
//     'description',  // -> description (dari Supabase)
//     // foldername dibuat dari parent name
//     'createdTime',  // -> createdat (prioritas 1)
//     'created_at',   // -> createdat (prioritas 2, dari Supabase)
//     'modifiedTime', // -> lastmodified (prioritas 1)
//     'last_modified' // -> lastmodified (prioritas 2, dari Supabase)
// ];
// // Kunci sumber yang *digunakan* tapi tidak langsung jadi output standar (tidak masuk 'other')
// const INTERNAL_USED_SOURCE_KEYS = [
//     'parents' // Digunakan untuk lookup nama folder
// ];


// // --- Props ---
// interface GoogleDriveManagerProps {
//     workspaceRootId: string;
//     workspaceName: string;
//     userId: string;
//     accessToken: string | null; // Token akses Google OAuth2
//     onExitWorkspace: () => void; // Fungsi untuk keluar/ganti workspace
//     onFilesUpdate: (files: FormattedFile[]) => void; // Callback kirim data terformat ke parent
// }

// // --- State Tampilan ---
// type BrowseState = 'listing_folders' | 'listing_files';

// // --- Komponen Utama ---
// const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
//     workspaceRootId,
//     workspaceName,
//     userId,
//     accessToken,
//     onExitWorkspace,
//     onFilesUpdate // Terima callback
// }) => {
//     // --- State Internal Komponen ---
//     const [filesAndFolders, setFilesAndFolders] = useState<ManagedItem[]>([]); // Data untuk UI saat ini
//     const [currentFolderId, setCurrentFolderId] = useState<string>(workspaceRootId);
//     const [folderHistory, setFolderHistory] = useState<string[]>([workspaceRootId]);
//     const [isLoading, setIsLoading] = useState<boolean>(false); // Loading umum fetch GDrive/Supabase
//     const [error, setError] = useState<string | null>(null);
//     const [newFolderName, setNewFolderName] = useState<string>(''); // Input nama folder baru
//     const [fileToUpload, setFileToUpload] = useState<File | null>(null); // File untuk diupload
//     const [isUploading, setIsUploading] = useState<boolean>(false); // State khusus upload
//     const [renameId, setRenameId] = useState<string | null>(null); // ID item yg direname
//     const [newName, setNewName] = useState<string>(''); // Input nama baru
//     const [browseState, setBrowseState] = useState<BrowseState>('listing_folders'); // Mode tampilan (folder/file)
//     const [currentFolderName, setCurrentFolderName] = useState<string>(workspaceName); // Nama folder saat ini

//     // --- State untuk Fitur "Lihat Semua File dari Folder Atas" ---
//     const [filesInTopFolders, setFilesInTopFolders] = useState<ManagedFileWithParent[]>([]); // Data UI jika perlu
//     const [isFetchingTopFolderFiles, setIsFetchingTopFolderFiles] = useState<boolean>(false); // Loading khusus fitur ini
//     const [topFolderFilesError, setTopFolderFilesError] = useState<string | null>(null);
//     const [showTopFolderFilesView, setShowTopFolderFilesView] = useState<boolean>(false); // Kontrol tampil/sembunyi UI

//     // --- State untuk Edit Metadata ---
//     const [editingMetadataId, setEditingMetadataId] = useState<string | null>(null); // ID item yg diedit metadatanya
//     const [editingDescription, setEditingDescription] = useState<string>('');
//     const [editingColor, setEditingColor] = useState<string>('');
//     const [editingLabels, setEditingLabels] = useState<string>(''); // Dipisahkan koma

//     // --- Helper: Panggil Google API ---
//     const makeApiCall = useCallback(async <T = any>(
//         url: string, method: string = 'GET', body: any = null, headers: Record<string, string> = {}
//     ): Promise<T | null> => {
//          if (!accessToken) {
//            setError("Akses token Google tidak tersedia.");
//            console.error("makeApiCall: Access Token is missing.");
//            return null;
//          }
//          const defaultHeaders: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, ...headers };
//          if (!(body instanceof FormData) && method !== 'GET' && method !== 'DELETE') {
//              defaultHeaders['Content-Type'] = 'application/json';
//          }
//          const options: RequestInit = { method, headers: defaultHeaders };
//          if (body) {
//              options.body = (body instanceof FormData) ? body : JSON.stringify(body);
//          }

//          try {
//              // console.log(`API Call: ${method} ${url}`);
//              const response = await fetch(url, options);
//              if (!response.ok) {
//                let errorData: any = null;
//                try { errorData = await response.json(); } catch (e) { try { errorData = await response.text(); } catch(e2) { errorData = response.statusText; } }
//                console.error("Google API Call Error:", response.status, errorData);
//                const message = errorData?.error?.message || errorData?.message || (typeof errorData === 'string' ? errorData : `HTTP error ${response.status}`);
//                throw new Error(`API Error (${response.status}): ${message}`);
//              }
//              if (response.status === 204) { console.log(`API Call Success (204 No Content): ${method} ${url}`); return null; }
//              const responseData = await response.json();
//              // console.log(`API Call Success: ${method} ${url}`, responseData);
//              return responseData as Promise<T>;
//          } catch (err: any) {
//               console.error(`Failed to ${method} ${url}:`, err);
//               // Melempar error agar bisa ditangkap oleh fungsi pemanggil
//               throw err;
//           }
//      }, [accessToken]); // Dependency: accessToken

//     // --- Helper: Transformasi Data ke FormattedFile ---
//     const transformToFormattedFile = useCallback((
//         mergedItem: MergedItem,
//         parentFolderName: string
//     ): FormattedFile => {
//         const formattedFile: Partial<FormattedFile> = {};
//         const otherProperties: { key: string; value: any }[] = [];

//         // 1. Map standard fields
//         formattedFile.id = mergedItem.id;
//         formattedFile.filename = mergedItem.name;
//         formattedFile.description = mergedItem.description ?? ''; // Gunakan nullish coalescing
//         formattedFile.foldername = parentFolderName;
//         formattedFile.createdat = mergedItem.createdTime ?? mergedItem.created_at ?? '';
//         formattedFile.lastmodified = mergedItem.modifiedTime ?? mergedItem.last_modified ?? '';

//         // 2. Collect other properties
//         const allUsedKeys = [...MAPPED_SOURCE_KEYS_TO_STANDARD, ...INTERNAL_USED_SOURCE_KEYS];
//         for (const key in mergedItem) {
//             if (Object.prototype.hasOwnProperty.call(mergedItem, key)) {
//                 // Jika kunci dari sumber TIDAK termasuk dalam daftar kunci yang sudah dipetakan atau digunakan secara internal
//                 if (!allUsedKeys.includes(key)) {
//                     // Dan nilainya tidak null/undefined (opsional, tergantung kebutuhan)
//                     if (mergedItem[key] !== null && mergedItem[key] !== undefined) {
//                          otherProperties.push({ key, value: mergedItem[key] });
//                     }
//                 }
//             }
//         }

//         if (otherProperties.length > 0) {
//             formattedFile.other = otherProperties;
//         }

//         return formattedFile as FormattedFile;
//     }, []); // Tidak ada dependencies eksternal langsung


//     // --- Fetch Item Utama (GDrive + Supabase Metadata) ---
//     const fetchItems = useCallback(async (folderId: string, state: BrowseState): Promise<void> => {
//         if (!accessToken || !userId) {
//             setError("Akses token atau User ID tidak tersedia.");
//             setFilesAndFolders([]); setIsLoading(false); onFilesUpdate([]); return;
//         }
//         setIsLoading(true); setError(null);
//         console.log(`Workspaceing items for folder: ${folderId}, State: ${state}, User: ${userId}`);

//         let googleDriveItems: GoogleDriveFile[] = [];
//         let fetchedFolderName = currentFolderName; // Gunakan state saat ini

//         try {
//             // Update nama folder saat ini jika perlu (saat masuk subfolder)
//             if (folderId !== workspaceRootId) {
//                  const folderDetailUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${folderId}?fields=name`;
//                  const folderDetails = await makeApiCall<{name: string}>(folderDetailUrl);
//                  if (folderDetails) fetchedFolderName = folderDetails.name;
//             } else {
//                 fetchedFolderName = workspaceName; // Kembali ke nama workspace jika di root
//             }
//             // Tidak set state currentFolderName di sini, biarkan diset saat navigasi/inisial

//             // Fetch GDrive items (folders atau files)
//             // Minta field GDrive yang relevan (termasuk waktu, ukuran, pemilik jika perlu)
//              const fields = "files(id, name, mimeType, parents, createdTime, modifiedTime, size, owners)";
//              let query = `'${folderId}' in parents and trashed=false`;
//              query += state === 'listing_folders' ? ` and mimeType='application/vnd.google-apps.folder'` : ` and mimeType!='application/vnd.google-apps.folder'`;
//              const gDriveUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=folder,name`; // Urutkan

//             const gDriveData = await makeApiCall<GoogleDriveFilesListResponse>(gDriveUrl);
//             googleDriveItems = gDriveData?.files || [];
//             console.log(`GDrive fetch found ${googleDriveItems.length} items.`);

//         } catch (err: any) {
//             console.error("Error fetching from Google Drive:", err);
//             setError(`Gagal memuat item GDrive: ${err.message}`);
//             setIsLoading(false); // Stop loading on GDrive error
//             setFilesAndFolders([]); onFilesUpdate([]); // Kosongkan data
//             return;
//         }

//         // --- Merge dengan Supabase Metadata & Transform ---
//         let combinedItemsForUI: ManagedItem[] = [];
//         let formattedFileList: FormattedFile[] = [];

//         if (googleDriveItems.length > 0) {
//             const itemIds = googleDriveItems.map(item => item.id);
//             // Tentukan tabel Supabase berdasarkan state (folder atau file)
//             const tableName = state === 'listing_folders' ? 'folder' : 'file';
//             let metadataMap = new Map<string, SupabaseItemMetadata>();

//             console.log(`Workspaceing metadata from Supabase table '${tableName}' for ${itemIds.length} items...`);
//             try {
//                 // Ambil semua field relevan dari Supabase
//                 const { data: metadataList, error: metaError } = await supabase
//                     .from(tableName)
//                     .select('id, workspace_id, user_id, description, color, labels, created_at, last_modified, project_code') // Contoh field custom 'project_code'
//                     .in('id', itemIds)
//                     .eq('workspace_id', workspaceRootId)
//                     .eq('user_id', userId); // Filter juga berdasarkan user

//                 if (metaError) throw metaError;

//                 if (metadataList) {
//                     console.log(`Supabase metadata fetched for ${metadataList.length} items.`);
//                     metadataMap = new Map(metadataList.map(meta => [meta.id, meta as SupabaseItemMetadata]));
//                 } else {
//                     console.log("No Supabase metadata found for these items.");
//                 }
//             } catch (metaErr: any) {
//                 console.warn(`Warning: Error fetching Supabase metadata from '${tableName}':`, metaErr.message);
//                 // Jangan set error utama, anggap metadata opsional
//                 // setError(prev => prev ? `${prev}\nWarning: Gagal memuat detail tambahan.` : `Warning: Gagal memuat detail tambahan.`);
//             }

//             // Proses setiap item dari GDrive
//             combinedItemsForUI = googleDriveItems.map(gDriveItem => {
//                 const metadata = metadataMap.get(gDriveItem.id) || null;
//                 // Gabungkan data GDrive dan metadata Supabase
//                 const mergedItem: MergedItem = { ...gDriveItem, ...(metadata || {}) };

//                 // Jika sedang menampilkan file, transformasikan ke format output
//                  if (state === 'listing_files') {
//                      formattedFileList.push(transformToFormattedFile(mergedItem, fetchedFolderName));
//                  }

//                 // Kembalikan struktur untuk state UI internal (ManagedItem)
//                 return { ...gDriveItem, metadata };
//             });

//         } else {
//             console.log("No items found in Google Drive for this view.");
//         }

//         setFilesAndFolders(combinedItemsForUI); // Update state untuk UI internal
//         setIsLoading(false); // Selesai loading

//         // Panggil callback onFilesUpdate dengan hasil transformasi
//          if (state === 'listing_files') {
//              console.log(`Calling onFilesUpdate with ${formattedFileList.length} formatted files.`);
//              onFilesUpdate(formattedFileList);
//          } else {
//              // Jika menampilkan folder, kirim array kosong karena tidak ada file yg diformat
//              onFilesUpdate([]);
//          }

//     }, [accessToken, userId, workspaceRootId, workspaceName, makeApiCall, supabase, onFilesUpdate, transformToFormattedFile, currentFolderName]); // Include all stable dependencies


//     // --- Fetch Files dari Top-Level Folders ---
//     const fetchFilesInTopFolders = useCallback(async (): Promise<void> => {
//         if (!accessToken || !userId) {
//             setTopFolderFilesError("Token atau User ID tidak tersedia."); setIsFetchingTopFolderFiles(false); onFilesUpdate([]); return;
//         }
//         setIsFetchingTopFolderFiles(true); setTopFolderFilesError(null); setFilesInTopFolders([]);
//         console.log("Fetching files in top folders initiated...");
//         let accumulatedErrors: string[] = [];
//         let allFormattedFiles: FormattedFile[] = []; // Hasil akhir untuk callback

//         try {
//             // 1. Get top-level folders
//             console.log("Fetching top-level folders...");
//             const foldersQuery = `'${workspaceRootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
//             const foldersUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(foldersQuery)}&fields=files(id,name)&orderBy=name`;
//             const topFoldersResponse = await makeApiCall<GoogleDriveFilesListResponse>(foldersUrl);
//             const topFolders = topFoldersResponse?.files || [];
//             console.log(`Found ${topFolders.length} top-level folders.`);

//             if (topFolders.length === 0) {
//                  setIsFetchingTopFolderFiles(false); onFilesUpdate([]); return;
//             }

//             // 2. Fetch files for each top folder concurrently
//             console.log("Fetching files within each top folder...");
//             const fileFields = "files(id,name,mimeType,parents,createdTime,modifiedTime,size,owners)"; // Fields GDrive
//             const fileFetchPromises = topFolders.map(async (folder) => {
//                  const filesQuery = `'${folder.id}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
//                  const filesUrl = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}?q=${encodeURIComponent(filesQuery)}&fields=${encodeURIComponent(fileFields)}&orderBy=name`;
//                  try {
//                       const filesResponse = await makeApiCall<GoogleDriveFilesListResponse>(filesUrl);
//                       return { folderName: folder.name, files: filesResponse?.files || [] };
//                  } catch (innerErr: any) {
//                       console.warn(`Failed to fetch files from folder "${folder.name}": ${innerErr.message}`);
//                       accumulatedErrors.push(`Gagal ambil file dari "${folder.name}": ${innerErr.message}`);
//                       return { folderName: folder.name, files: [] };
//                  }
//              });
//              const results = await Promise.all(fileFetchPromises);

//              // Flatten the GDrive file list and collect IDs
//              const allRawGDriveFiles: { gDriveFile: GoogleDriveFile, parentFolderName: string }[] = [];
//              results.forEach(result => { result.files.forEach(file => allRawGDriveFiles.push({ gDriveFile: file, parentFolderName: result.folderName })); });
//              console.log(`Total raw GDrive files fetched from top folders: ${allRawGDriveFiles.length}`);

//              if (allRawGDriveFiles.length === 0) { /* ... handle empty ... */ setIsFetchingTopFolderFiles(false); onFilesUpdate([]); return; }
//              const fileIds = allRawGDriveFiles.map(item => item.gDriveFile.id);

//             // 3. Fetch Supabase metadata for all files found
//             console.log(`Workspaceing Supabase metadata for ${fileIds.length} files...`);
//             let metadataMap = new Map<string, SupabaseItemMetadata>();
//             try {
//                  const { data: metadataList, error: metaError } = await supabase
//                      .from('file')
//                      .select('id, workspace_id, user_id, description, color, labels, created_at, last_modified, project_code')
//                      .in('id', fileIds)
//                      .eq('workspace_id', workspaceRootId)
//                      .eq('user_id', userId);
//                  if (metaError) throw metaError;
//                  if (metadataList) {
//                      console.log(`Supabase metadata found for ${metadataList.length} files.`);
//                      metadataMap = new Map(metadataList.map(meta => [meta.id, meta as SupabaseItemMetadata]));
//                  }
//             } catch (metaErr: any) {
//                 console.warn("Warning: Error fetching Supabase metadata for top files:", metaErr.message);
//                 accumulatedErrors.push(`Warning: Gagal memuat detail tambahan: ${metaErr.message}`);
//             }

//             // 4. Merge, Transform, and Populate Results
//             console.log("Merging GDrive data with Supabase metadata and transforming...");
//             const processedUiData: ManagedFileWithParent[] = []; // For UI state if needed
//             allFormattedFiles = allRawGDriveFiles.map(item => {
//                  const metadata = metadataMap.get(item.gDriveFile.id) || null;
//                  const mergedItem: MergedItem = { ...item.gDriveFile, ...(metadata || {}) };
//                  // Data untuk UI internal (jika masih dipakai)
//                  processedUiData.push({ ...item.gDriveFile, parentFolderName: item.parentFolderName, metadata });
//                  // Transformasi ke format akhir
//                  return transformToFormattedFile(mergedItem, item.parentFolderName);
//              });
//              setFilesInTopFolders(processedUiData); // Update UI state jika perlu

//         } catch (err: any) {
//              console.error("Critical Error during fetchFilesInTopFolders:", err);
//              accumulatedErrors.push(`Error Utama: ${err.message}`);
//         } finally {
//             setIsFetchingTopFolderFiles(false); // Selesai loading
//             if (accumulatedErrors.length > 0) {
//                  setTopFolderFilesError(accumulatedErrors.join('\n'));
//             }
//             console.log(`Workspaceing files in top folders finished. Calling onFilesUpdate with ${allFormattedFiles.length} files.`);
//             onFilesUpdate(allFormattedFiles); // Kirim hasil akhir ke parent
//         }

//     }, [accessToken, userId, workspaceRootId, makeApiCall, supabase, onFilesUpdate, transformToFormattedFile]);


//     // --- Navigasi ---
//     const viewFilesInFolder = (folderId: string, folderName: string): void => {
//         if (folderId === currentFolderId && browseState === 'listing_files') return; // Hindari reload jika sudah di view yg sama
//         console.log(`Navigating into folder: ${folderName} (${folderId})`);
//         // State akan diupdate, memicu useEffect -> fetchItems
//         setCurrentFolderId(folderId);
//         setCurrentFolderName(folderName); // Set nama folder saat masuk
//         setBrowseState('listing_files');
//         setFolderHistory(prevHistory => [...prevHistory, folderId]);
//     };

//     const navigateUp = (): void => {
//         // Jika sudah di root dan mode folder, tidak bisa naik lagi
//         if (currentFolderId === workspaceRootId && browseState === 'listing_folders') {
//              console.log("Navigate Up: Already at root folder view.");
//              return;
//         }

//         console.log("Navigate Up initiated.");
//         if (browseState === 'listing_files') {
//             // Dari tampilan file, kembali ke tampilan folder di folder yg sama
//             console.log("Navigate Up: From files view to folders view in current folder.");
//             setBrowseState('listing_folders');
//             // useEffect akan trigger fetchItems(currentFolderId, 'listing_folders')
//         } else { // browseState === 'listing_folders'
//             if (folderHistory.length > 1) {
//                 // Dari tampilan folder, naik ke folder parent
//                  console.log("Navigate Up: From folders view to parent folder view.");
//                  const newHistory = folderHistory.slice(0, -1);
//                  const parentFolderId = newHistory[newHistory.length - 1];
//                  setFolderHistory(newHistory);
//                  setCurrentFolderId(parentFolderId);
//                  // Nama folder parent akan diupdate otomatis oleh fetchItems saat useEffect jalan
//                  setBrowseState('listing_folders'); // Tetap di mode folder
//                  // useEffect akan trigger fetchItems(parentFolderId, 'listing_folders')
//             } else {
//                 console.log("Navigate Up: History is too short, cannot go up further.");
//             }
//         }
//          onFilesUpdate([]); // Selalu kosongkan list file di parent saat navigasi
//     };

//     // --- Aksi CRUD ---

//     // Refresh view saat ini (folder atau file)
//      const refreshCurrentView = useCallback(() => {
//          console.log(`Refreshing view: Folder=${currentFolderId}, State=${browseState}`);
//          fetchItems(currentFolderId, browseState);
//      }, [currentFolderId, browseState, fetchItems]);

//      // Buat folder baru
//      const handleCreateFolder = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//          e.preventDefault();
//          if (!newFolderName.trim()) { setError("Nama folder tidak boleh kosong."); return; }
//          if (!accessToken || !userId) { setError("Otentikasi tidak valid."); return; }
//          if (browseState !== 'listing_folders') { setError("Hanya bisa buat folder baru saat melihat daftar folder."); return; }

//          console.log(`Creating folder "${newFolderName}" in folder ${currentFolderId}`);
//          setIsLoading(true); setError(null);
//          try {
//             const body = { name: newFolderName.trim(), mimeType: 'application/vnd.google-apps.folder', parents: [currentFolderId] };
//             const createdFolder = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_API_FILES_ENDPOINT, 'POST', body);
//             if (createdFolder) {
//                 console.log(`Folder "${createdFolder.name}" created successfully (ID: ${createdFolder.id})`);
//                 setNewFolderName(''); // Reset input
//                 refreshCurrentView(); // Muat ulang tampilan folder
//             } else {
//                  throw new Error("Respon API tidak mengembalikan data folder yang dibuat.");
//             }
//          } catch (err: any) {
//             console.error("Failed to create folder:", err);
//             setError(`Gagal membuat folder: ${err.message}`);
//          } finally {
//             setIsLoading(false);
//          }
//      };

//      // Hapus item (folder atau file)
//      const handleDelete = async (itemId: string, itemName: string, itemType: 'folder' | 'file'): Promise<void> => {
//          if (!window.confirm(`Yakin ingin menghapus ${itemType} "${itemName}"? Tindakan ini tidak dapat diurungkan dan juga akan menghapus data terkait di aplikasi ini.`)) return;
//          if (!accessToken || !userId) { setError("Otentikasi tidak valid."); return; }

//          console.log(`Deleting ${itemType}: "${itemName}" (ID: ${itemId})`);
//          setIsLoading(true); setError(null);
//          let gDriveSuccess = false;

//          // 1. Hapus dari Google Drive
//          try {
//              const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${itemId}`;
//              await makeApiCall(url, 'DELETE');
//              console.log(`GDrive ${itemType} ${itemId} deleted successfully.`);
//              gDriveSuccess = true;
//          } catch (err: any) {
//              console.error(`GDrive delete failed for ${itemType} ${itemId}:`, err);
//              // Jangan langsung error fatal, coba hapus metadata saja
//              setError(`Gagal hapus dari Google Drive: ${err.message}. Mencoba hapus metadata saja...`);
//          }

//          // 2. Hapus metadata dari Supabase (selalu coba lakukan)
//          const tableName = itemType === 'folder' ? 'folder' : 'file';
//          try {
//              console.log(`Deleting metadata from Supabase table '${tableName}' for ID: ${itemId}`);
//              const { error: metaDeleteError } = await supabase
//                  .from(tableName)
//                  .delete()
//                  // Pastikan match dengan primary key atau constraint unik yang relevan
//                  .match({ id: itemId, user_id: userId, workspace_id: workspaceRootId });

//              if (metaDeleteError) {
//                 // Jika item tidak ada di Supabase (misal belum pernah diberi metadata), itu bukan error fatal
//                 if (metaDeleteError.code === 'PGRST116') { // Check for "resource not found" or similar code
//                      console.log(`Supabase metadata for ${itemId} not found or already deleted. Skipping.`);
//                 } else {
//                      throw metaDeleteError; // Throw error jika masalah lain
//                 }
//              } else {
//                  console.log(`Supabase metadata for ${itemId} deleted successfully.`);
//              }
//          } catch (metaErr: any) {
//              console.error(`Supabase metadata delete failed for ${itemId}:`, metaErr);
//              // Tambahkan error, jangan timpa error GDrive jika ada
//              const supabaseErrorMsg = `Error hapus metadata Supabase: ${metaErr.message}`;
//              setError(prev => prev ? `${prev}\n${supabaseErrorMsg}` : supabaseErrorMsg);
//          } finally {
//              setIsLoading(false);
//              // Refresh view jika GDrive berhasil atau jika GDrive gagal tapi user konfirmasi tetap refresh
//              if (gDriveSuccess || (!gDriveSuccess && window.confirm('Penghapusan Google Drive mungkin gagal. Tetap segarkan tampilan?'))) {
//                  refreshCurrentView();
//              }
//          }
//      };

//      // Handle perubahan input file upload
//      const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
//          if (e.target.files && e.target.files.length > 0) {
//              setFileToUpload(e.target.files[0]);
//              setError(null); // Hapus error sebelumnya jika ada
//          } else {
//              setFileToUpload(null);
//          }
//      };

//      // Upload file baru
//      const handleFileUpload = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//         e.preventDefault();
//          if (!fileToUpload) { setError("Pilih file yang akan diupload."); return; }
//          if (!accessToken || !userId) { setError("Otentikasi tidak valid."); return; }
//          // Pastikan user berada di dalam folder (bukan di root workspace jika tidak diizinkan)
//          if (browseState !== 'listing_files') { setError("Masuk ke dalam folder tujuan terlebih dahulu untuk mengupload file."); return; }
//          if (currentFolderId === workspaceRootId) { setError("Tidak dapat mengupload file langsung ke root workspace. Pilih folder terlebih dahulu."); return;} // Opsional: Larang upload ke root

//          console.log(`Uploading file "${fileToUpload.name}" to folder ${currentFolderId}`);
//          setIsUploading(true); setIsLoading(true); setError(null); // Gunakan state upload & loading

//          try {
//              const metadata = {
//                  name: fileToUpload.name,
//                  parents: [currentFolderId] // Upload ke folder saat ini
//              };
//              const formData = new FormData();
//              // Metadata harus berupa JSON string dalam Blob
//              formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
//              // File itu sendiri
//              formData.append('file', fileToUpload);

//              const uploadedFile = await makeApiCall<GoogleDriveFile>(GOOGLE_DRIVE_UPLOAD_ENDPOINT, 'POST', formData, {}); // Headers tidak perlu Content-Type di sini

//              if (uploadedFile) {
//                  console.log(`File "${uploadedFile.name}" uploaded successfully (ID: ${uploadedFile.id})`);
//                  setFileToUpload(null); // Reset state file
//                  // Reset input file visually
//                  const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
//                  if (fileInput) fileInput.value = '';

//                  refreshCurrentView(); // Muat ulang tampilan file
//              } else {
//                   throw new Error("Respon API tidak mengembalikan data file yang diupload.");
//              }
//          } catch (err: any) {
//              console.error("Failed to upload file:", err);
//              setError(`Gagal mengupload file: ${err.message}`);
//          } finally {
//              setIsUploading(false); setIsLoading(false);
//          }
//      };

//      // Mulai proses rename
//      const startRename = (item: ManagedItem): void => {
//         console.log(`Starting rename for item "${item.name}" (ID: ${item.id})`);
//         setRenameId(item.id);
//         setNewName(item.name); // Isi input dengan nama saat ini
//         setError(null); // Hapus error sebelumnya
//      };

//      // Batal rename
//      const cancelRename = () => {
//         console.log("Rename cancelled.");
//         setRenameId(null); setNewName('');
//      };

//      // Submit rename
//      const handleRename = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
//          e.preventDefault();
//          if (!renameId) { console.error("handleRename called without renameId."); return; }
//          if (!newName.trim()) { setError("Nama baru tidak boleh kosong."); return; }
//          if (!accessToken) { setError("Otentikasi tidak valid."); return; }

//          console.log(`Renaming item ${renameId} to "${newName}"`);
//          setIsLoading(true); setError(null);
//          try {
//              const url = `${GOOGLE_DRIVE_API_FILES_ENDPOINT}/${renameId}`;
//              const body = { name: newName.trim() };
//              // Menggunakan PATCH untuk update sebagian
//              const renamedItem = await makeApiCall<GoogleDriveFile>(url, 'PATCH', body);

//              if (renamedItem) {
//                  console.log(`Item ${renameId} renamed successfully to "${renamedItem.name}"`);
//                  setRenameId(null); setNewName(''); // Selesai rename
//                  refreshCurrentView(); // Muat ulang tampilan
//              } else {
//                  // Ini seharusnya tidak terjadi jika PATCH berhasil tanpa konten
//                  console.warn("Rename API call returned no item data, but status was likely OK.");
//                  setRenameId(null); setNewName('');
//                  refreshCurrentView();
//              }
//          } catch (err: any) {
//              console.error("Failed to rename item:", err);
//              setError(`Gagal mengganti nama: ${err.message}`);
//          } finally {
//              setIsLoading(false);
//          }
//      };


//     // --- Metadata Handling ---

//     // Mulai edit metadata
//     const startEditMetadata = (item: ManagedItem) => {
//         console.log(`Starting metadata edit for item "${item.name}" (ID: ${item.id})`);
//         setEditingMetadataId(item.id);
//         // Isi form dengan data metadata saat ini dari Supabase (jika ada)
//         setEditingDescription(item.metadata?.description || '');
//         setEditingColor(item.metadata?.color || ''); // Mungkin perlu default color?
//         setEditingLabels(item.metadata?.labels?.join(', ') || ''); // Gabungkan label jadi string
//         setError(null);
//     };

//     // Batal edit metadata
//     const cancelEditMetadata = () => {
//         console.log("Metadata edit cancelled.");
//         setEditingMetadataId(null);
//         setEditingDescription('');
//         setEditingColor('');
//         setEditingLabels('');
//     };

//     // Simpan metadata ke Supabase
//     const handleSaveMetadata = async (e: FormEvent<HTMLFormElement>, itemId: string, itemType: 'folder' | 'file') => {
//         e.preventDefault();
//         if (!editingMetadataId || itemId !== editingMetadataId) { console.error("handleSaveMetadata mismatch ID."); return; }
//         if (!userId || !workspaceRootId) { setError("User atau Workspace tidak valid."); return; }

//         console.log(`Saving metadata for ${itemType} ${itemId}`);
//         setIsLoading(true); setError(null);
//         const tableName = itemType === 'folder' ? 'folder' : 'file';
//         // Ubah string label (dipisah koma) menjadi array, trim whitespace, filter string kosong
//         const labelsArray = editingLabels.split(',')
//                                       .map(label => label.trim())
//                                       .filter(label => label !== '');

//         try {
//             // Gunakan upsert: update jika sudah ada, insert jika belum
//             // onConflict menargetkan kombinasi primary key atau unique constraint
//             // Sesuaikan 'id, workspace_id, user_id' jika constraint Anda berbeda
//             const { data, error: upsertError } = await supabase
//                 .from(tableName)
//                 .upsert(
//                     {
//                         id: itemId, // ID dari Google Drive
//                         workspace_id: workspaceRootId,
//                         user_id: userId,
//                         description: editingDescription.trim() || null, // Simpan null jika kosong
//                         color: editingColor || null, // Simpan null jika kosong
//                         labels: labelsArray.length > 0 ? labelsArray : null, // Simpan null jika tidak ada label
//                         // Update timestamp Supabase secara otomatis jika kolom di-setup
//                     },
//                     { onConflict: 'id, workspace_id, user_id' } // Tentukan kolom constraint unik
//                 )
//                 .select(); // Optional: select data yg diupsert untuk konfirmasi

//             if (upsertError) {
//                 throw upsertError;
//             }

//             console.log(`Metadata for ${itemId} saved successfully:`, data);
//             setEditingMetadataId(null); // Selesai edit
//             setEditingDescription('');
//             setEditingColor('');
//             setEditingLabels('');
//             refreshCurrentView(); // Muat ulang tampilan untuk reflect perubahan metadata

//         } catch (err: any) {
//             console.error(`Failed to save metadata for ${itemId}:`, err);
//             setError(`Gagal menyimpan metadata: ${err.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     };


//     // --- Handler untuk tombol "Lihat Semua File dari Folder Atas" ---
//     const handleShowTopFolderFiles = () => {
//         console.log("Button 'Show Top Folder Files' clicked.");
//         setShowTopFolderFilesView(true); // Tampilkan UI terkait (opsional)
//         fetchFilesInTopFolders(); // Panggil fungsi fetch & transform
//     };

//     // --- Effects ---
//     // Efek utama untuk memuat data saat state navigasi berubah
//     useEffect(() => {
//         // Pastikan token, user ID, dan folder ID valid sebelum fetch
//         if (accessToken && userId && currentFolderId) {
//             console.log(`Effect triggered: Fetching items for folder ${currentFolderId}, state ${browseState}.`);
//             fetchItems(currentFolderId, browseState);
//         } else {
//              console.log("Effect skipped: Missing accessToken, userId, or currentFolderId.");
//              // Kosongkan data jika dependensi tidak valid
//              setFilesAndFolders([]);
//              onFilesUpdate([]);
//              setIsLoading(false); // Pastikan loading berhenti jika tidak fetch
//         }
//     // fetchItems dimasukkan ke useCallback dependencies agar stabil
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [accessToken, userId, currentFolderId, browseState, fetchItems]); // Jangan tambahkan onFilesUpdate di sini untuk hindari loop

//     // Efek untuk reset state saat workspace berubah (dari props)
//     useEffect(() => {
//         console.log(`Workspace changed to: ${workspaceRootId}. Resetting state.`);
//         setCurrentFolderId(workspaceRootId);
//         setCurrentFolderName(workspaceName);
//         setFolderHistory([workspaceRootId]);
//         setBrowseState('listing_folders'); // Kembali ke view folder root
//         setFilesAndFolders([]);
//         setFilesInTopFolders([]);
//         setError(null);
//         setTopFolderFilesError(null);
//         setShowTopFolderFilesView(false);
//         setEditingMetadataId(null);
//         setRenameId(null);
//         // Tidak perlu panggil fetchItems di sini, effect di atas akan handle saat currentFolderId berubah
//         // Panggil onFilesUpdate dengan array kosong untuk clear list di parent
//         onFilesUpdate([]);

//     }, [workspaceRootId, workspaceName, onFilesUpdate]); // Hanya jalan saat workspace berubah

//     // --- Render Helpers --- (Untuk UI Internal jika masih dipakai)
//     const getItemStyle = (item: ManagedItem | ManagedFileWithParent): CSSProperties => ({
//         backgroundColor: item.metadata?.color || 'inherit', // Gunakan warna dari metadata jika ada
//         padding: '8px', margin: '4px 0', border: '1px solid #eee', borderRadius: '4px',
//         display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
//     });

//     const renderLabels = (labels: string[] | null | undefined): React.ReactNode => {
//         if (!labels || labels.length === 0) return null;
//         return (
//             <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
//                 {labels.map((label, index) => (
//                     <span key={index} style={{ backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75em' }}>
//                         {label}
//                     </span>
//                 ))}
//             </div>
//         );
//     };

//     // --- Render Utama ---
//     // Tampilkan loading jika belum ada token/user ATAU sedang fetch data awal
//     if (!userId || !accessToken) {
//         return <div className="p-4 text-center">Memeriksa otentikasi...</div>;
//     }

//     // Komponen UI menerima semua state dan handler yang diperlukan
//     return (
//         <GoogleDriveManagerUI
//             workspaceName={workspaceName}
//             currentFolderName={currentFolderName}
//             browseState={browseState}
//             currentFolderId={currentFolderId}
//             workspaceRootId={workspaceRootId}
//             error={error || topFolderFilesError} // Gabungkan error
//             isLoading={isLoading || isUploading || isFetchingTopFolderFiles}
//             isUploading={isUploading}
//             filesAndFolders={filesAndFolders} // Data untuk UI list folder/file

//             setFileToUpload={setFileToUpload}
//             renameId={renameId}
//             newName={newName}
//             setNewName={setNewName}
//             editingMetadataId={editingMetadataId}
//             editingDescription={editingDescription}
//             setEditingDescription={setEditingDescription}
//             editingColor={editingColor}
//             setEditingColor={setEditingColor}
//             editingLabels={editingLabels}
//             setEditingLabels={setEditingLabels}

//             // Props untuk view "Semua File dari Folder Atas" (jika UI ada)
//             filesInTopFolders={filesInTopFolders}
//             isFetchingTopFolderFiles={isFetchingTopFolderFiles}
//             topFolderFilesError={topFolderFilesError}
//             showTopFolderFilesView={showTopFolderFilesView}

//             // Handlers Aksi
//             onExitWorkspace={onExitWorkspace}
//             navigateUp={navigateUp}
//             handleCreateFolder={handleCreateFolder}
//             handleFileUpload={handleFileUpload}
//             handleFileSelect={handleFileSelect} // Handler input file
//             viewFilesInFolder={viewFilesInFolder}
//             startRename={startRename}
//             cancelRename={cancelRename}
//             handleRename={handleRename}
//             handleDelete={handleDelete}
//             startEditMetadata={startEditMetadata}
//             cancelEditMetadata={cancelEditMetadata}
//             handleSaveMetadata={handleSaveMetadata}
//             handleShowTopFolderFiles={handleShowTopFolderFiles}

//             // Render Helpers (opsional jika UI butuh)
//             getItemStyle={getItemStyle}
//             renderLabels={renderLabels}

//             // Input State
//             setNewFolderName={setNewFolderName}
//             newFolderName={newFolderName}
//             // fileToUpload dikelola internal, tidak perlu di-pass jika pakai handleFileSelect
//         />
//     );
// };

// export default GoogleDriveManager;