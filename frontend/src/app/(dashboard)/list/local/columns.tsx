"use client";

import { ColumnDef } from "@tanstack/react-table";
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

export type Local = {
    localId: number;
    name: string;
    code: string;
    NumClass?: number;
    dateCreate?: string;
    dateModif?: string;
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
}: ColumnProps): ColumnDef<Local>[] => [
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
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "code",
            header: "Code",
        },
        {
            accessorKey: "NumClass",
            header: "Number of Classes",
            cell: ({ row }) => row.getValue("NumClass") || "0",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const local = row.original;

                const handleDelete = async () => {
                    try {
                        await api.delete(`/local/${local.localId}`, { withCredentials: true });
                        toast.success("Local deleted");

                        const newTotal = totalCount - 1;
                        const newTotalPages = Math.ceil(newTotal / pageSize);
                        const newPage = currentPage > newTotalPages ? newTotalPages : currentPage;

                        onRefresh(Math.max(newPage, 1));
                    } catch (err) {
                        console.error("Delete error:", err);
                        toast.error("Failed to delete local");
                    }
                };

                return (
                    <div className="flex items-center gap-2">
                        {/* Update Button */}
                        {role === "admin" && (
                            <Button
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky p-0"
                                onClick={() => onEdit(local.localId)}>
                                <Image src="/update.png" alt="Edit icon" width={16} height={16} />
                            </Button>
                        )}
                        <Separator orientation="vertical" />
                        {/* Delete with confirmation */}
                        {role === "admin" && <>
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
                                            local.
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
