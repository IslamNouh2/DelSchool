"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchUser } from "@/lib/getRoleFromToken";

export type classes = {
    subjectId: number;
    subjectName: string;
    totalGrads: number;
    parentId: number;
    okBlock?: boolean;
    parentName: string;
};

type ColumnProps = {
    currentPage: number;
    onRefresh: (page: number) => void;
    totalCount: number;
    pageSize: number;
    onEdit: (id: number) => void;
    role: string | null;
};



export const columns = ({
    onRefresh,
    currentPage,
    totalCount,
    pageSize,
    onEdit,
    role,
}: ColumnProps): ColumnDef<classes>[] => [


        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "subjectName",
            header: "subjectName",
        },

        {
            accessorKey: "totalGrads",
            header: "totalGrads",
        },
        {
            accessorKey: "parentName",
            header: "Parent Subject",
            cell: ({ row }) => {
                const name = row.getValue("parentName") as string;
                return name && name !== "subject" ? name : "-";
            },
        },
        {
            accessorKey: "okBlock",
            header: "Status",
            cell: ({ row }) => {
                const isBlocked = row.getValue("okBlock") as boolean;
                return (
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${isBlocked
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                            }`}
                    >
                        {isBlocked ? "Blocked" : "Active"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const subject = row.original;

                const handleDelete = async () => {
                    try {
                        await api.delete(`/subject/${subject.subjectId}`, { withCredentials: true });
                        toast.success("Employer deleted");

                        const newTotal = totalCount - 1;
                        const newTotalPages = Math.ceil(newTotal / pageSize);
                        const newPage = currentPage > newTotalPages ? newTotalPages : currentPage;

                        onRefresh(Math.max(newPage, 1));
                    } catch (err) {
                        console.error("Delete error:", err);
                        toast.error("Failed to delete employer");
                    }
                };


                return (
                    <div className="flex items-center gap-2">
                        {/* Update Button */}
                        {role?.toLowerCase() === "admin" && <>
                            <Button
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky p-0"
                                onClick={() => onEdit(subject.subjectId)}
                            >
                                <Image src="/update.png" alt="Update" width={16} height={16} />
                            </Button>

                            <Separator orientation="vertical" />
                        </>}
                        {/* Delete with confirmation */}
                        {role?.toLowerCase() === "admin" && <>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                                        <Image src="/delete.png" alt="Delete" width={16} height={16} />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. It will permanently remove this
                                            employer.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>
                                            Confirm
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>}
                    </div>
                );
            },
        },
    ];