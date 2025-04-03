"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { NavUser } from "@/components/nav-user"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar"
import { File, Link2Icon, Pencil, Search, UploadIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/files/datatable";
import { columns } from "@/components/files/columns";
import fs from "fs";
import path from "path";
import { DialogHeader } from "@/components/ui/dialog";
import ImageUpload from "@/components/uploadfile";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { fetchFilesFromServer } from "@/app/api/fetchFiles";

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

const color = {
  "color1": 'oklch(0.55_0.2408_261.8)',
  "color2": 'oklch(0.67_0.2137_36.34)',
  "color3": 'oklch(0.83_0.1703_82.26)',
  "color4": 'oklch(0.52_0.2836_291.64)',
  "fallbackColor1": 'rgb(11, 96, 250)', // contoh fallback
  "fallbackColor2": 'rgb(252, 83, 30)',
  "fallbackColor3": 'rgb(253, 186, 5)',
  "fallbackColor4": 'rgb(119, 18, 249)',
};

const folderFiles: { [key: string]: number } = {
  "Genesis": 18,
  "Explorer": 18,
  "Quantum": 12,
  "Imparta": 30,
  "Insekta": 20,
};

// Fungsi untuk mengelompokkan file
const groupFiles = (files: { [key: string]: number }) => {
  const fileEntries = Object.entries(files);

  // Ambil 4 item pertama
  const firstFour = fileEntries.slice(0, 3);

  // Ambil sisanya dan jumlahkan
  const remaining = fileEntries.slice(3);
  const others = remaining.reduce((sum, [, count]) => sum + count, 0);

  // Gabungkan hasilnya
  const groupedFiles = [
    ...firstFour,
    ["Lainnya", others], // Menambahkan kategori 'Lainnya'
  ];

  return groupedFiles;
};

// Contoh penggunaan
const groupedFolderFiles = groupFiles(folderFiles);
console.log(groupedFolderFiles);

// Menghitung total file
const totalFile = Object.values(folderFiles).reduce((sum, fileCount) => sum + fileCount, 0);

// Menghitung persentase untuk setiap folder berdasarkan jumlah file
const folderData: { [key: string]: string } = {};

Object.keys(folderFiles).forEach((folderName) => {
  const fileCount = folderFiles[folderName];
  const percentage = ((fileCount / totalFile) * 100).toFixed(2) + "%"; // Menghitung persentase
  folderData[folderName] = percentage;
});

console.log(folderData);

interface GridData {
  [key: string]: [string, string];
}

// Menyatakan tipe `others` dengan jelas sebagai array dari tuple [string, string]
const others: [string, string][] = [];
const gridData: GridData = {};
const maxItems = 3;

// Memasukkan data folder pertama hingga keempat, sisanya masuk ke "Lainnya"
Object.keys(folderData).forEach((key, index) => {
  if (index < maxItems) {
    const folderName = `folder${index + 1}`;
    gridData[folderName] = [key, folderData[key as keyof typeof folderData]];
  } else {
    others.push([key, folderData[key as keyof typeof folderData]]);
  }
});

// Jika ada lebih dari 4 folder, masukkan ke kategori "Lainnya"
if (others.length > 0) {
  // Menghitung total persentase untuk kategori "Lainnya"
  const totalPercentage = others.reduce((acc, [_, percentage]) => {
    const numericPercentage = parseFloat(percentage.replace('%', ''));
    return acc + numericPercentage;
  }, 0);

  // Menyimpan total persentase yang sudah dijumlahkan dalam kategori "Lainnya"
  gridData['folder4'] = [
    "Lainnya", 
    `${totalPercentage}%`
  ];
}

console.log(gridData);



const folderNames = Object.keys(gridData);



// async function fetchFiles(token: string | null) {
//   if (!token) return null;

//   try {
//     const response = await fetch("", {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) throw new Error("Gagal mengambil data dari server");

//     const jsonData = await response.json();
//     return jsonData.data;
//   } catch (error) {
//     console.error("Error:", error);
//     return null;
//   }
// }

export default function Page() {


  const [data, setData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    fetchFilesFromServer().then(setData);
  }, [router]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div className="flex flex-col items-left justify-start w-32 lg:w-52 lg:mr-4">
              <div className="flex">
                <h4 className="scroll-m-20 lg:text-xs text-xs font-bold tracking-tight mr-2 truncate">
                  Genesis
                </h4>
              </div>
              <p className="text-xs text-gray-500 truncate">
                The king, seeing how much happier
              </p>
            </div>
            <div className="flex-1 items-right justify-right md:items-center">
              <Button className="h-12 md:w-full w-11 h-10 md:justify-between justify-center md:pr-1" variant={"outline"}>
                <p className="text-gray-600 hidden md:inline text-md text-light">Temukan file di mana saja...</p>
                <div className="md:bg-black sm:w-24 w-2 h-8 rounded-full items-center justify-center flex gap-2"><Search className="text-primary"></Search><p className="hidden md:inline text-white text-xs font-bold">Search</p></div>
              </Button>
            </div>
            <NavUser user={user} />
          </div>
        </header>
              
        <div>
            <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">
                <div className="bg-muted/50 col-span-2 gap-4 p-4 inline-flex flex-col rounded-xl bg-white ">
                <div>
                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md mb-4">
                    Unggah Berkas
                    </h2>
                    <ImageUpload />
                </div>
            </div>
         

            <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
                <div className="flex justify-between">
                <div>
                    <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                    Semua File
                    </h2>
                    <p className="text-xs text-gray-500">Folder tertaut dengan penyimpanan pada Sharepoint</p>
                </div>
                
                </div>
            <DataTable data={data || []} columns={columns} />
          </div>
    </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
