"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Row } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Ellipsis, Trash, Trash2 } from "lucide-react";

interface FoldersMenuProps {
    id: string;
}

export function FoldersMenu({
    id
}: FoldersMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="h-4 w-4" variant={"outline"}>
                    <Ellipsis className="text-black/50"></Ellipsis>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem>Lihat Berkas</DropdownMenuItem>
                <DropdownMenuItem>Ubah</DropdownMenuItem>
                {/* <DropdownMenuItem>Favorite</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Trash2></Trash2>Hapus Folder
                {/* <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut> */}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}