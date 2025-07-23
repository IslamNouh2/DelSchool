"use client"

import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import PaginationBar from "@/components/PaginationBar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import { role, subjectsData } from "@/lib/data";
import api from "@/lib/api";
import debounce from "lodash.debounce";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Subject = {
    subjectId: number;
    subjectName: string;
    totalGrads: number;

}
const subjectColumns = [
    { header: 'Subject Name', accessor: 'subjectName' },
    { header: 'Total Point', accessor: 'totalGrads' },
];


const sortMap: Record<string, string> = {
    top: "dateCreate",
    bottom: "subjectId",
    right: "subjectName",
};


const SubjectList = () => {

    const [subject, setSubject] = useState<Subject[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const [currentPage, setCurrentPage] = useState(pageParam);
    const router = useRouter();
    const [position, setPosition] = useState("top");


    const fetchSubject = useCallback(
        debounce(async (page: number, sortBy: string = "dateCreate") => {
            try {
                const url = `/subject?page=${page}&sortBy=${sortBy}`;
                const response = await api.get(url, { withCredentials: true });
                console.log("Full API response:", response.data);
                //console.log(url);
                const subjectArray = Array.isArray(response.data.subject) ? response.data.subject : [];
                setSubject(subjectArray);
                setTotalPages(response.data.totalPages || 1);
            } catch (err) {
                console.error("❌ Failed to fetch Subject:", err);
                setSubject([]);
            }
            finally {
                setLoading(false)
            }
        }, 500),
        []
    );

    const handleSuccess = () => {
        fetchSubject(currentPage);
    };


    useEffect(() => {
        fetchSubject(currentPage, sortMap[position]);
        //console.log(sortMap[position]);
        //return () => fetchSubject.cancel();
    }, [currentPage, position, fetchSubject]);


    useEffect(() => {
        setCurrentPage(pageParam)
    }, [pageParam]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        router.push(`subject?page=${newPage}`);
    };

    const handleDelete = async (id: number) => {


        try {
            await api.delete(`/subject/${id}`, { withCredentials: true });
            fetchSubject(currentPage);
            toast({ description: "Successfully deleted Subject" });
        } catch (error) {
            console.log("❌ Failed to delete Subject:", error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "Failed to delete Subject.",
            })
        }
    }

    const renderRow = (item: Subject, index: number) => (
        <tr
            key={item.subjectId}
            className="border-b border-gray-200 even:bg-slate-50 hover:bg-lamaPurpleLight text-sm"
        >
            <td className="p-4">{index + 1}</td>
            <td className="p-2 pl-4">{item.subjectName}</td>
            <td className="p-2 pl-4">{item.totalGrads}</td>
            <td className="p-2 pl-4">
                <div className="flex items-center gap-2">
                    <FormModal
                        table="subject"
                        type="update"
                        data={item}
                        onSuccess={handleSuccess}
                    >
                        <Button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
                            <Image src="/update.png" alt="Update" width={16} height={16} />
                        </Button>
                    </FormModal>
                    {role === "admin" && (
                        <AlertDialog >
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
                                    <AlertDialogCancel >Annule</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item.subjectId)}>Ok</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>


                    )}
                </div>
            </td>
        </tr>
    );

    return (
        <div className=''>

            <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
                {/* TOP */}
                <div className="flex items-center justify-between">
                    <h1 className="hidden md:block text-lg font-semibold">All Subjects</h1>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {/* <TableSearch onSearchChange={} /> */}
                        <div className="flex items-center gap-4 self-end">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
                                <Image src="/filter.png" alt="" width={14} height={14} />
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-delRed-500">
                                        <Image src="/sort.png" alt="Sort" width={14} height={14} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-50">
                                    <DropdownMenuRadioGroup
                                        value={position}
                                        onValueChange={setPosition}
                                    >
                                        <DropdownMenuRadioItem value="top">Date Creation</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="bottom">Code</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="right">Nom</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {role === "admin" && (
                                <FormModal table="subject" type="create" onSuccess={handleSuccess} />
                            )}
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* Table */}
                        <DataTable
                            columns={subjectColumns}
                            data={subject}
                            renderRow={renderRow}
                        />
                        {/* PAGINATION */}
                        <PaginationBar
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}


            </div>
        </div>
    )
}

export default SubjectList