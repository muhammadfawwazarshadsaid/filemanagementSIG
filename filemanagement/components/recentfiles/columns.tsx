"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Schema } from "@/components/recentfiles/schema";
import { DataTableColumnHeader } from "@/components/recentfiles/sort";
import { DataTableRowActions } from "@/components/recentfiles/actions";
import { TrendingUp, TrendingDown, CheckCircle, Cross, X, CheckCircle2, Clock1 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { JSX } from "react";

function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'doc':
    case 'docx':
    case 'docs':
      return '/word.svg';
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
      return '/web.svg'; // Menambahkan ikon untuk file web
    default:
      return '/file.svg'; // Ikon default untuk tipe file yang tidak dikenal
  }
}

function formatRelativeTime(dateString: string): JSX.Element {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.round((now.getTime() - date.getTime()) / 1000); // Perbedaan dalam detik

  if (diff < 60) {
    return (
      <div className="flex w-[200px] items-center">
        <Clock1 size={20} className="mr-2 text-green-500" />
        <span className="flex w-[200px] capitalize truncate">
          {diff} detik yang lalu
        </span>
      </div>
    );
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return (
      <div className="flex w-[200px] items-center">
        <Clock1 size={20} className="mr-2 text-green-500" />
        <span className="flex w-[200px] capitalize truncate">
          {minutes} menit {seconds} detik yang lalu
        </span>
      </div>
    );
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return (
      <div className="flex w-[200px] items-center">
        <Clock1 size={20} className="mr-2 text-green-500" />
        <span className="flex w-[200px] capitalize truncate">
          {hours} jam {minutes} menit yang lalu
        </span>
      </div>
    );
  } else if (diff < 172800) {
    return (
      <div className="flex w-[200px] items-center">
        <Clock1 size={20} className="mr-2 text-green-500" />
        <span className="flex w-[200px] capitalize truncate">kemarin</span>
      </div>
    );
  } else if (diff < 259200) {
    const days = Math.floor(diff / 86400);
    return (
      <div className="flex w-[200px] items-center">
        <Clock1 size={20} className="mr-2 text-green-500" />
        <span className="flex w-[200px] capitalize truncate">
          {days} hari yang lalu
        </span>
      </div>
    );
  } else {
    // Tampilkan tanggal normal jika lebih dari 3 hari yang lalu
    const formattedDate = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return (
      <div className="flex w-[200px] items-center">
        <Clock1 size={20} className="mr-2 text-green-500" />
        <span className="flex w-[200px] capitalize truncate">{formattedDate}</span>
      </div>
    );
  }
}

export const columns: ColumnDef<Schema>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "filename",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="File" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2 items-center">
          <Avatar className="h-4 w-4">
            <AvatarImage src={getFileIcon(row.getValue("filename"))} alt="file icon" />
            <AvatarFallback className="">
              {(row.getValue("filename") as string).split('.').pop()?.toUpperCase() || "FILE"}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("filename")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deskripsi" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex w-[200px]">
          <span
            className="max-w-[1000px] font-medium overflow-hidden text-ellipsis whitespace-normal"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {row.getValue("description")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "foldername",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Folder Asal" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex w-[160px] items-center">
          <Button variant={"outline"} className="h-8">
            <svg width="16" height="16" fill="gray" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d='M5 4.75h1.745c.304 0 .598.11.826.312L8.92 6.25H3.75V6c0-.69.56-1.25 1.25-1.25m6.661 1.5a1.25 1.25 0 0 1-.826-.312L8.562 3.936a2.75 2.75 0 0 0-1.817-.686H5A2.75 2.75 0 0 0 2.25 6v12A2.75 2.75 0 0 0 5 20.75h14A2.75 2.75 0 0 0 21.75 18V9A2.75 2.75 0 0 0 19 6.25z'/>
            </svg>
            <span className="flex w-[100px] capitalize truncate font-medium ">
              {row.getValue("foldername")}
            </span>
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "createdat",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dibuat pada" />
      ),
      cell: ({ row }) => {
        const createdat = String(row.getValue("createdat"));
        return (
          <div className="flex w-[200px] items-center">
            <span className=" flex w-[200px] capitalize truncate"> {formatRelativeTime(createdat)}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const rowDate = new Date(row.getValue(id));
        const [startDate, endDate] = value;
        return rowDate >= startDate && rowDate <= endDate;
      },
  },
  {
    accessorKey: "lastmodified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Diperbarui terakhir" />
      ),
      cell: ({ row }) => {
        const lastmodified = String(row.getValue("lastmodified"));
        return (
          <div className="flex w-[200px] items-center">
            <span className=" flex w-[200px] capitalize truncate"> {formatRelativeTime(lastmodified)}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const rowDate = new Date(row.getValue(id));
        const [startDate, endDate] = value;
        return rowDate >= startDate && rowDate <= endDate;
      },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];