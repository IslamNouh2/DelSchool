"use client";

import Link from "next/link";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export type Exams = {
    id: number;
    examName: string;
    dateStart: string;
    dateEnd: string;
    publish: boolean;
};

type ColumnProps = {
    currentPage: number;
    onRefresh: (page: number) => void;
    totalCount: number;
    pageSize: number;
    onEdit: (exam: Exams) => void;
    role: string | null;
};

export const columns = ({
    onRefresh,
    currentPage,
    totalCount,
    pageSize,
    onEdit,
    role,
}: ColumnProps): ColumnDef<Exams>[] => [
        // ✅ Checkbox selector
        // {
        //     id: "select",
        //     header: ({ table }) => (
        //         <Checkbox
        //             checked={table.getIsAllPageRowsSelected()}
        //             onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        //             aria-label="Select all"
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             checked={row.getIsSelected()}
        //             onCheckedChange={(value) => row.toggleSelected(!!value)}
        //             aria-label="Select row"
        //         />
        //     ),
        //     enableSorting: false,
        //     enableHiding: false,
        // },

        // ✅ Exam name
        {
            accessorKey: "examName",
            header: "Nom de l'examen",
        },

        {
            accessorKey: "dateStart",
            header: "Date début",
            cell: ({ row }) => {
                const date = row.getValue("dateStart") as string;
                return new Date(date).toLocaleDateString("fr-FR");
            },
        },

        {
            accessorKey: "dateEnd",
            header: "Date fin",
            cell: ({ row }) => {
                const date = row.getValue("dateEnd") as string;
                return new Date(date).toLocaleDateString("fr-FR");
            },
        },

        // ✅ Status column with Switch
        {
            accessorKey: "publish",
            header: "Statut",
            cell: ({ row }) => {
                const exam = row.original;
                const [isPublish, setIsPublish] = useState(exam.publish);
                const [isLoading, setIsLoading] = useState(false);

                const handleToggle = async (checked: boolean) => {
                    setIsLoading(true);
                    try {
                        await api.patch(
                            `/exam/${exam.id}/publish`,
                            { publish: checked },
                            { withCredentials: true }
                        );
                        setIsPublish(checked);
                        toast.success(
                            checked
                                ? "Examen publié avec succès"
                                : "Examen dépublié avec succès"
                        );
                        // Refresh the table to get updated data
                        onRefresh(currentPage);
                    } catch (error) {
                        console.error("Toggle publish error:", error);
                        toast.error("Échec de la mise à jour du statut");
                        // Revert the switch if API call fails
                        setIsPublish(!checked);
                    } finally {
                        setIsLoading(false);
                    }
                };

                return (
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={isPublish}
                            onCheckedChange={handleToggle}
                            disabled={isLoading || role?.toLowerCase() !== "admin"}
                            className="data-[state=checked]:bg-green-500"
                        />
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${isPublish
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                        >
                            {isPublish ? "Publié" : "Non publié"}
                        </span>
                    </div>
                );
            },
        },

        // ✅ Actions
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const exam = row.original;

                const handleDelete = async () => {
                    try {
                        await api.delete(`/exam/${exam.id}`, { withCredentials: true });
                        toast.success("Examen supprimé avec succès");

                        // refresh logic
                        const newTotal = totalCount - 1;
                        const newTotalPages = Math.ceil(newTotal / pageSize);
                        const newPage =
                            currentPage > newTotalPages ? newTotalPages : currentPage;

                        onRefresh(Math.max(newPage, 1));
                    } catch (err) {
                        console.error("Delete error:", err);
                        toast.error("Échec de la suppression de l'examen");
                    }
                };

                return (
                    <div className="flex items-center gap-2">
                        {/* Grades Button */}
                        <Link href={`/list/exam/grads?examId=${exam.id}`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                                Notes
                            </Button>
                        </Link>

                        {/* Edit Button */}
                        {role?.toLowerCase() === "admin" && (
                            <>
                                <Button
                                    className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky p-0"
                                    onClick={() => onEdit(exam)}
                                >
                                    <Image src="/update.png" alt="Update" width={16} height={16} />
                                </Button>

                                <Separator orientation="vertical" />
                            </>
                        )}

                        {/* Delete Button with confirmation */}
                        {role?.toLowerCase() === "admin" && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaPurple">
                                        <Image src="/delete.png" alt="Delete" width={16} height={16} />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action supprimera définitivement cet examen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete}>
                                            Confirmer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                );
            },
        },
    ];