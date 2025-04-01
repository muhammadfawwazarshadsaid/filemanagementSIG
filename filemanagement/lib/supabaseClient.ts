import { createClient } from "@supabase/supabase-js";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

// URL dan Key Supabase
const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!API_URL || !API_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Supabase Client
export const supabase = createClient(API_URL, API_KEY);

// --- Tipe Data Disesuaikan ---

// Tipe data untuk Workspace
export type Workspace = {
  id: string;
  name: string;
  color?: string | null;
};

// Tipe data untuk Folder (terhubung ke Workspace)
export type Folder = {
  id: string;
  description?: string | null;
  color?: string | null;
  labels?: string[] | null;
  workspace_id: string; // Tetap terhubung ke Workspace
};

// Tipe data untuk File (INDEPENDEN - tidak ada workspace_id/folder_id)
export type File = {
  id: string;
  description?: string | null;
  color?: string | null;
  labels?: string[] | null;
  // Tidak ada foreign key ke workspace atau folder
};

// --- Fungsi Disesuaikan ---

// Fungsi untuk membuat workspace baru
export const createWorkspace = async (
  name: string,
  color?: string
): Promise<{ data: Workspace | null; error: any }> => {
  const newId = uuidv4();
  const { data, error } = await supabase
    .from("workspace")
    .insert([{ id: newId, name, color }])
    .select()
    .single();

  if (error) {
    console.error("Error creating workspace:", error);
    return { data: null, error };
  }
  return { data, error: null };
};

// Fungsi untuk mengambil semua workspace
export const getAllWorkspaces = async (): Promise<{ data: Workspace[]; error: any }> => {
  const { data, error } = await supabase.from("workspace").select("*");

  if (error) {
    console.error("Error fetching all workspaces:", error);
    return { data: [], error };
  }
  return { data: data ?? [], error: null };
};

// Fungsi untuk mengambil workspace dengan folder terkait
// (TIDAK bisa mengambil file terkait karena tidak ada relasi)
export const getWorkspaceById = async (
  id: string
): Promise<{ data: (Workspace & { folder: Folder[] }) | null; error: any }> => {
  // Hanya mengambil folder, karena file tidak terhubung
  const { data, error } = await supabase
    .from("workspace")
    .select("*, folder(*)") // Hanya folder
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching workspace by ID (${id}):`, error);
    return { data: null, error };
  }
  return { data, error: null };
};

// Fungsi untuk memperbarui workspace
export const updateWorkspace = async (
  id: string,
  updates: Partial<Workspace>
): Promise<{ data: Workspace | null; error: any }> => {
  const validUpdates = { ...updates };
  delete (validUpdates as any).id;

  const { data, error } = await supabase
    .from("workspace")
    .update(validUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating workspace (${id}):`, error);
    return { data: null, error };
  }
  return { data, error: null };
};

// Fungsi untuk menghapus workspace beserta folder terkait
// (TIDAK menghapus file karena tidak ada relasi)
export const deleteWorkspace = async (id: string): Promise<{ data: any; error: any }> => {
  try {
    // 1. Ambil semua folder dalam workspace
    const { data: folders, error: folderError } = await supabase
      .from("folder")
      .select("id")
      .eq("workspace_id", id);
    if (folderError) throw folderError;

    // 2. Hapus folder-folder tersebut (jika ada)
    if (folders && folders.length > 0) {
      const folderIds = folders.map(f => f.id);
      const { error: deleteFoldersError } = await supabase
        .from("folder")
        .delete()
        .in("id", folderIds);
      if (deleteFoldersError) throw deleteFoldersError;
    }

    // 3. Hapus workspace itu sendiri
    const { data, error: deleteWorkspaceError } = await supabase
      .from("workspace")
      .delete()
      .eq("id", id);
    if (deleteWorkspaceError) throw deleteWorkspaceError;

    // Berhasil
    return { data, error: null };

  } catch (error) {
    console.error(`Error deleting workspace (${id}) and its folders:`, error);
    return { data: null, error };
  }
};

// Fungsi untuk membuat folder baru
export const createFolder = async (
  workspace_id: string,
  description?: string,
  color?: string,
  labels?: string[]
): Promise<{ data: Folder | null; error: any }> => {
  const folderId = uuidv4();
  const { data, error } = await supabase
    .from("folder")
    .insert([
      {
        id: folderId,
        workspace_id,
        description,
        color,
        labels: labels ?? [],
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating folder:", error);
    return { data: null, error };
  }
  return { data, error: null };
};

// Fungsi untuk mengambil semua folder dalam workspace
export const getFoldersByWorkspace = async (
  workspace_id: string
): Promise<{ data: Folder[]; error: any }> => {
  const { data, error } = await supabase
    .from("folder")
    .select("*")
    .eq("workspace_id", workspace_id);

  if (error) {
    console.error(`Error fetching folders for workspace (${workspace_id}):`, error);
    return { data: [], error };
  }
  return { data: data ?? [], error: null };
};

// Fungsi untuk menghapus folder (HANYA menghapus folder)
export const deleteFolder = async (id: string): Promise<{ data: any; error: any }> => {
  const { data, error } = await supabase
    .from("folder")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting folder (${id}):`, error);
    return { data: null, error };
  }
  return { data, error: null };
};


// --- Fungsi untuk File (INDEPENDEN) ---

// Fungsi untuk membuat file baru (tidak perlu workspace_id/folder_id)
export const createFile = async (
    description?: string,
    color?: string,
    labels?: string[]
): Promise<{ data: File | null; error: any }> => {
    const fileId = uuidv4();
    const { data, error } = await supabase
        .from("file")
        .insert([
            {
                id: fileId,
                // Tidak ada workspace_id atau folder_id
                description,
                color,
                labels: labels ?? [],
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating file:", error);
        return { data: null, error };
    }
    return { data, error: null };
};

// Fungsi getFilesByWorkspace DIHAPUS karena tidak memungkinkan dengan skema saat ini

// Fungsi BARU: untuk mengambil SEMUA file (karena independen)
export const getAllFiles = async (): Promise<{ data: File[]; error: any }> => {
    const { data, error } = await supabase
        .from("file")
        .select("*");

    if (error) {
        console.error("Error fetching all files:", error);
        return { data: [], error };
    }
    return { data: data ?? [], error: null };
};

// Fungsi untuk menghapus file (berdasarkan ID file)
export const deleteFile = async (id: string): Promise<{ data: any; error: any }> => {
    const { data, error } = await supabase.from("file").delete().eq("id", id);

    if (error) {
        console.error(`Error deleting file (${id}):`, error);
        return { data: null, error };
    }
    return { data, error: null };
};

// Anda mungkin perlu menambahkan fungsi update untuk Folder dan File juga
// Contoh: Fungsi untuk memperbarui file
export const updateFile = async (
    id: string,
    updates: Partial<File>
  ): Promise<{ data: File | null; error: any }> => {
    const validUpdates = { ...updates };
    delete (validUpdates as any).id; // Jangan update ID

    const { data, error } = await supabase
      .from("file")
      .update(validUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating file (${id}):`, error);
      return { data: null, error };
    }
    return { data, error: null };
  };