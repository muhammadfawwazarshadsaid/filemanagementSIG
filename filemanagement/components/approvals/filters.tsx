// File: components/approvals/filters.tsx
"use client";

import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, XIcon, RefreshCwIcon } from "lucide-react";
import { Approval } from "./schema";
import React from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


interface ApprovalDataTableToolbarProps<TData extends Approval> {
    table: Table<TData>;
    globalFilter: string;
    setGlobalFilter: (filterValue: string) => void;
    onRefreshApprovals: () => void;
    isFetchingApprovals: boolean;
}

export function ApprovalDataTableToolbar<TData extends Approval>({
    table, globalFilter, setGlobalFilter, onRefreshApprovals, isFetchingApprovals,
}: ApprovalDataTableToolbarProps<TData>) {

    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder="Cari approval (nama file, status, pengaju...)"
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="h-8 w-[250px] lg:w-[350px]" // Perlebar sedikit
                />
                {globalFilter && (
                     <Button variant="ghost" onClick={() => setGlobalFilter("")} className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground">
                        Reset
                        <XIcon className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex items-center space-x-2">
                <TooltipProvider>

                    {/* Tombol Refresh */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={onRefreshApprovals}
                                disabled={isFetchingApprovals}
                            >
                                {isFetchingApprovals ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCwIcon className="h-4 w-4" />}
                                <span className="sr-only">Refresh Approvals</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Refresh Daftar Approval</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}