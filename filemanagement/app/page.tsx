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
import { Ellipsis, File, Link2Icon, MenuIcon, Pencil, Plus, Search, UploadIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/recentfiles/datatable";
import { columns } from "@/components/recentfiles/columns";
import fs from "fs";
import path from "path";
import { fetchFilesFromServer } from "./api/fetchFiles";
import { DialogHeader } from "@/components/ui/dialog";
import ImageUpload from "@/components/uploadfile";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { DotFilledIcon } from "@radix-ui/react-icons";
import { FoldersMenu } from "@/components/recentfiles/folders-menu";

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

const folders = [
  {
    "id": "1",
    "name": "Genesis",
    "color": "color1",
    "totalfile": "18"
  },
  {
    "id": "2",
    "name": "Explorer",
    "color": "color2",
    "totalfile": "18"
  },
  {
    "id": "3",
    "name": "Quantum",
    "color": "color3",
    "totalfile": "18"
  },
  {
    "id": "4",
    "name": "Impakta",
    "color": "color4",
    "totalfile": "18"
  },
  {
    "id": "5",
    "name": "Genesis",
    "color": "color1",
    "totalfile": "18"
  },
  {
    "id": "6",
    "name": "Explorer",
    "color": "color2",
    "totalfile": "18"
  },
  {
    "id": "7",
    "name": "Quantum",
    "color": "color3",
    "totalfile": "18"
  },
  {
    "id": "8",
    "name": "Impakta",
    "color": "color4",
    "totalfile": "18"
  },
  {
    "id": "9",
    "name": "Genesis",
    "color": "color1",
    "totalfile": "18"
  },
  {
    "id": "10",
    "name": "Explorer",
    "color": "color2",
    "totalfile": "18"
  },
  {
    "id": "11",
    "name": "Quantum",
    "color": "color3",
    "totalfile": "18"
  },
  {
    "id": "12",
    "name": "Impakta",
    "color": "color4",
    "totalfile": "18"
  },
]
// const folderFiles: { [key: string]: number } = {
//   "Genesis": 18,
//   "Explorer": 18,
//   "Quantum": 12,
//   "Imparta": 30,
//   "Insekta": 20,
// };

// // Fungsi untuk mengelompokkan file
// const groupFiles = (files: { [key: string]: number }) => {
//   const fileEntries = Object.entries(files);

//   // Ambil 4 item pertama
//   const firstFour = fileEntries.slice(0, 3);

//   // Ambil sisanya dan jumlahkan
//   const remaining = fileEntries.slice(3);
//   const others = remaining.reduce((sum, [, count]) => sum + count, 0);

//   // Gabungkan hasilnya
//   const groupedFiles = [
//     ...firstFour,
//     ["Lainnya", others], // Menambahkan kategori 'Lainnya'
//   ];

//   return groupedFiles;
// };

// // Contoh penggunaan
// const groupedFolderFiles = groupFiles(folderFiles);
// console.log(groupedFolderFiles);

// // Menghitung total file
// const totalFile = Object.values(folderFiles).reduce((sum, fileCount) => sum + fileCount, 0);

// // Menghitung persentase untuk setiap folder berdasarkan jumlah file
// const folderData: { [key: string]: string } = {};

// Object.keys(folderFiles).forEach((folderName) => {
//   const fileCount = folderFiles[folderName];
//   const percentage = ((fileCount / totalFile) * 100).toFixed(2) + "%"; // Menghitung persentase
//   folderData[folderName] = percentage;
// });

// console.log(folderData);

// interface GridData {
//   [key: string]: [string, string];
// }

// // Menyatakan tipe `others` dengan jelas sebagai array dari tuple [string, string]
// const others: [string, string][] = [];
// const gridData: GridData = {};
// const maxItems = 3;

// // Memasukkan data folder pertama hingga keempat, sisanya masuk ke "Lainnya"
// Object.keys(folderData).forEach((key, index) => {
//   if (index < maxItems) {
//     const folderName = `folder${index + 1}`;
//     gridData[folderName] = [key, folderData[key as keyof typeof folderData]];
//   } else {
//     others.push([key, folderData[key as keyof typeof folderData]]);
//   }
// });

// // Jika ada lebih dari 4 folder, masukkan ke kategori "Lainnya"
// if (others.length > 0) {
//   // Menghitung total persentase untuk kategori "Lainnya"
//   const totalPercentage = others.reduce((acc, [_, percentage]) => {
//     const numericPercentage = parseFloat(percentage.replace('%', ''));
//     return acc + numericPercentage;
//   }, 0);

//   // Menyimpan total persentase yang sudah dijumlahkan dalam kategori "Lainnya"
//   gridData['folder4'] = [
//     "Lainnya", 
//     `${totalPercentage}%`
//   ];
// }

// console.log(gridData);



// const folderNames = Object.keys(gridData);



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

  const [itemsToShow, setItemsToShow] = useState(folders.length); // Default untuk layar besar

  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth >= 1024) {
        setItemsToShow(6); // lg
      } else if (screenWidth >= 768) {
        setItemsToShow(8); // md
      } else if (screenWidth >= 640) {
        setItemsToShow(3); // sm
      } else if (screenWidth >= 480) {
        setItemsToShow(3); // xs
      } else {
        setItemsToShow(1); // default
      }
    };

    handleResize(); // Panggil saat komponen mount
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
        <div className="flex flex-1 flex-col gap-4 p-4 bg-[oklch(0.972_0.002_103.49)]">

          <div className="bg-muted/50 gap-4 p-4 inline-flex flex-col rounded-xl bg-white">
            <div>
              <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                Lokasi Penyimpanan Utama
              </h2>
              <p className="text-xs text-gray-500">Folder tertaut dengan penyimpanan pada Sharepoint</p>
            </div>
            <div className="flex-1 gap-2 items-center bg-[oklch(0.971_0.014_246.32)] border-2 border-[oklch(0.55_0.2408_261.8)] p-2 rounded-md">
              <Link2Icon className="text-gray-500" size={24} color="#095FF9"></Link2Icon>
              <h1 className="break-words whitespace-normal flex-1 lg:max-w-200 font-extrabold underline text-[oklch(0.55_0.2408_261.8)]">
                https://sharepointlinkhjhkhnhbhhbhbhhhjhbhuhhhhikjinnjisharepointlinkhjhkhnhbhhbhbhhhjhbhuhhhhikjinnjisharepointlinkhjhkhnhbhhbhbhhhjhbhuhhhhikjinnji
              </h1>
            </div>
            <Button variant={"outline"} className="w-20 h-8">Kunjungi</Button>
          </div>

          
          <div className="grid rounded-xl bg-white h-auto gap-4 p-4">
            <div>
              <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                Folder di Workspace
              </h2>
            </div>
            <div className="grid lg:grid-cols-6 md:grid-cols-4 gap-4 md:grid-cols-4 sm:grid-cols-3 xs:grid-cols-2 grid-cols-1">
              {folders.slice(0, itemsToShow).map((folder, index) => (
                <div
                  key={folder.id} 
                  className="p-4 col-span-1 h-36 rounded-3xl outline outline-black/5"
                >
                  <div className="flex justify-between flex-cols h-full">
                      <div className="flex flex-col h-full justify-between">
                        <div
                          style={{
                            backgroundColor:
                              folder.color === "color1"
                                ? color.fallbackColor1
                                : folder.color === "color2"
                                ? color.fallbackColor2
                                : folder.color === "color3"
                                ? color.fallbackColor3
                                : color.fallbackColor4,
                              }}
                          className={`"bg-[${folder.color}] col-span-1 w-9 h-9 flex items-center justify-center rounded-2xl outline outline-black/5`}>
                          <svg
                            width="20"
                            height="20"
                            fill="white"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M5 4.75h1.745c.304 0 .598.11.826.312L8.92 6.25H3.75V6c0-.69.56-1.25 1.25-1.25m6.661 1.5a1.25 1.25 0 0 1-.826-.312L8.562 3.936a2.75 2.75 0 0 0-1.817-.686H5A2.75 2.70 0 0 0 2.25 6v12A2.75 2.75 0 0 0 5 20.75h14A2.75 2.75 0 0 0 21.75 18V9A2.75 2.75 0 0 0 19 6.25z" />
                          </svg>
                      </div>
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <p className="font-light text-xs text-black/50">{folder.totalfile} files</p>
                      </div>
                    </div>
                    <FoldersMenu id={folder.id}></FoldersMenu>
                    {/* <Button className="h-4 w-4" variant={"outline"}><Ellipsis className="text-black/50"></Ellipsis></Button>
                     */}
                    </div>
                  </div>
              ))}
              <div className="flex gap-2 items-center">
                <Button variant={"secondary"} className="w-8 h-8"><Plus></Plus></Button>
                <Button variant={"outline"} className="w-40 h-8">Lihat Semua Folder</Button>
              </div>
            </div>
          </div>
          {/* <div className="grid rounded-xl bg-white auto-rows-min h-auto gap-4 md:grid-cols-5 sm:grid-cols-4 grid-cols-2 p-4">
            <div className="md:col-span-1 sm:col-span-5 col-span-2">
              <h2 className="scroll-m-20 text-md font-semibold tracking-tight lg:text-md">
                Total Penyimpanan
              </h2>
              <div
                className="grid auto-rows-min gap-1 mt-2 md:max-w-24 max-w-40 lg:max-w-32"
                style={{
                  gridTemplateColumns: Object.keys(gridData)
                    .map((folderKey) => gridData[folderKey][1])
                    .join(" "),
                }}
              >
                {Object.keys(gridData).map((folderKey, index) => (
                  <Tooltip key={folderKey}>
                    <TooltipTrigger>
                      <div
                        className={`bg-[${index % 4 === 0 ? color.color1 : index % 4 === 1 ? color.color2 : index % 4 === 2 ? color.color3 : color.color4}] text-white text-xs items-center text-center flex justify-center rounded-full`}
                        style={{
                          height: "6px",
                          backgroundColor:
                            index % 4 === 0
                              ? color.fallbackColor1
                              : index % 4 === 1
                              ? color.fallbackColor2
                              : index % 4 === 2
                              ? color.fallbackColor3
                              : color.fallbackColor4,
                        }}
                      ></div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{`${gridData[folderKey][0]}: ${gridData[folderKey][1]}`}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

            <p className="text-xs text-gray-500 my-4">{Object.values(folderFiles).flat().length} Folder  |  { Object.values(folderFiles).reduce((a, b) => a + b, 0)} Berkas</p>
            </div>
            {folderNames.map((folderKey, index) => (
              <div key={folderKey} className="bg-white p-4 gap-2 aspect-video rounded-xl items-center justify-center flex flex-col" >
                <div
                  style={{
                          backgroundColor:
                            index % 4 === 0
                              ? color.fallbackColor1
                              : index % 4 === 1
                              ? color.fallbackColor2
                              : index % 4 === 2
                              ? color.fallbackColor3
                              : color.fallbackColor4,
                        }}
                  className={`bg-[${index % 4 === 0 ? color.color1 : index % 4 === 1 ? color.color2 : index % 4 === 2 ? color.color3 : color.color4}] rounded-xl w-8 h-8 flex items-center justify-center`}>
                  <svg width="16" height="16" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d='M5 4.75h1.745c.304 0 .598.11.826.312L8.92 6.25H3.75V6c0-.69.56-1.25 1.25-1.25m6.661 1.5a1.25 1.25 0 0 1-.826-.312L8.562 3.936a2.75 2.75 0 0 0-1.817-.686H5A2.75 2.75 0 0 0 2.25 6v12A2.75 2.75 0 0 0 5 20.75h14A2.75 2.75 0 0 0 21.75 18V9A2.75 2.75 0 0 0 19 6.25z'/>
                  </svg>
                </div>
                <p className="text-xs font-semibold">{groupedFolderFiles[index][0]}</p>
                <div className="flex font-semibold text-xs w-full h-10 rounded-xl bg-[oklch(0.96_0_0)] items-center justify-center">
                  {groupedFolderFiles[index][1]}
                <span className="m-1 text-xs font-medium text-black/50">Berkas</span>
                </div>
              </div>
            ))}
          </div> */}

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
      </SidebarInset>
    </SidebarProvider>
  )
}
