"use client"

import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import PaginationBar from "@/components/PaginationBar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { LocalData, role } from "@/lib/data";
import debounce from "lodash.debounce";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

type local = {
    localId: number;
    name: string;
    code: string;
    NumClass: number;
    subject_local: {
        subjectId: number;
        cloture: boolean;
        subject: {
            subjectId: number;
            subjectName: string;
            // other subject fields
        };
    }[];
};


const columns = [
    { header: "Local", accessor: "name" },
    { header: "Code", accessor: "code", hideOnMobile: true },
    { header: "Number", accessor: "NumClass", hideOnMobile: true },
    { header: "subject", accessor: "subjectName", hideOnMobile: true },
];

const sortMap: Record<string, string> = {
    top: "dateCreate",
    bottom: "code",
    right: "ClassName", // assuming 'Nom' maps to class name
};

const localList = () => {
    const [locals, setLocals] = useState<local[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(pageParam);
    const { toast } = useToast();
    const [position, setPosition] = React.useState("top");
    const [data, setData] = React.useState([]);
    const [subject, setSubject] = useState(0);



    useEffect(() => {
        const fetchSubject = async () => {
            try {
                const res = await api.get('/subject/count', { withCredentials: true });
                const subjects = res.data || 0;
                //console.log(subjects);
                setSubject(subjects);
            } catch (error) {
                console.log('Failed to fetch subject count:', error);
                setSubject(0)
            }
        };
        fetchSubject();
    });

    const fetchLocal = useCallback(
        debounce(async (page: number, sortBy: string = "dateCreate") => {
            try {
                const url = `/local?page=${page}&sortBy=${sortBy}`;
                const response = await api.get(url, { withCredentials: true });
                console.log("Full API response:", response.data);
                const localsArray = Array.isArray(response.data.locals) ? response.data.locals : [];;

                setLocals(localsArray);
                setTotalPages(response.data.totalPages || 1);
            } catch (err) {
                console.error("❌ Failed to fetch local:", err);
                setLocals([]); // fallback
            }
            finally {
                setLoading(false)
            }
        }, 500),
        []
    );



    // useEffect(() => {
    //     fetchLocal(currentPage);
    //     return () => fetchLocal.cancel();
    // }, [currentPage, fetchLocal]);

    useEffect(() => {
        fetchLocal(currentPage, sortMap[position]);
        return () => fetchLocal.cancel();
    }, [currentPage, position]);

    useEffect(() => {
        setCurrentPage(pageParam);
    }, [pageParam]);


    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        router.push(`/list/local?page=${newPage}`);
    };

    const handleDelete = async (id: number) => {

        try {
            console.log("deleted id ", id)
            await api.delete(`/local/${id}`, { withCredentials: true });
            fetchLocal(currentPage);
            toast({
                description: "Success Deleted Local."
            })
        } catch (err) {
            console.log("❌ Failed to delete local:", err);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to delete local.",
                action: <ToastAction altText="Try again">Try again</ToastAction>,
            })
        }
    }

    const handleSuccess = () => {
        fetchLocal(currentPage); // Refresh data after successful operation
    };

    const renderRow = (item: local, index: number) => {
        const isEmptySubject = item.subject_local.length === 0;

        return (
            <tr
                key={item.localId}
                className={`border-b border-gray-200 text-sm hover:bg-lamaPurpleLight ${isEmptySubject ? "bg-red-100" : "even:bg-slate-50"
                    }`}
            >
                <td className="p-4">{index + 1}</td>
                <td className="p-4">{item.name}</td>
                <td className="p-4 hidden sm:hidden md:table-cell lg:table-cell">{item.code}</td>
                <td className="p-4 hidden sm:hidden md:table-cell lg:table-cell">{item.NumClass}</td>
                <td className="p-4 hidden sm:hidden md:table-cell lg:table-cell">
                    {item.subject_local.length > 0
                        ? item.subject_local
                            .map((sl) => sl.subject?.subjectName || "(inconnu)")
                            .join(", ")
                        : <span className="text-red-600 italic">Aucun sujet</span>}
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <FormModal
                            table="local"
                            type="update"
                            data={item}
                            onSuccess={handleSuccess}
                        >
                            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                                <Image src="/update.png" alt="Update" width={16} height={16} />
                            </button>
                        </FormModal>
                        {role === "admin" && (
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
                                            This action cannot be undone. This will permanently delete your
                                            account and remove your data from our servers.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annule</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(item.localId)}>Ok</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div>
            <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
                <div className="flex items-center justify-between">
                    <h1 className="hidden md:block text-lg font-semibold">All Local</h1>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-4 self-end">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                                <Image src="/filter.png" alt="Filter" width={14} height={14} />
                            </button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                                        <Image src="/sort.png" alt="Filter" width={14} height={14} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-50">
                                    <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                                        <DropdownMenuRadioItem value="top">Date Creation</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="bottom">Code</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="right">Nom</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {role === "admin" && (
                                <FormModal
                                    table="local"
                                    type="create"
                                    onSuccess={handleSuccess}
                                    enable={subject > 0}
                                    director="/list/subjects"
                                />
                            )}



                        </div>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={locals}
                    renderRow={renderRow}
                />

                <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
}

export default localList;
