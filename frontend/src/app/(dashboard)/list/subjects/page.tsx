"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import debounce from "lodash.debounce";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { fetchUser } from "@/lib/getRoleFromToken";
import { DataTable } from "@/components/DataTable";
import { columns } from "./columns";
import SubjectForm from "@/components/forms/SubjectForm";

interface Subject {
    subjectId: number;
    subjectName: string;
    totalGrads: number;
    parentId: number;
    okBlock?: boolean;
    parentName: string;
}

interface SubjectResponse {
    subject: Subject[];
    total: number;
    page: number;
    totalPages: number;
}

const sortMap: Record<string, string> = {
    top: "dateCreate",
    bottom: "subjectId",
    right: "subjectName",
};

export default function SubjectList() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [subjectsData, setSubjectsData] = useState<Subject[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [position, setPosition] = useState("top");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Subject | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Load role
    useEffect(() => {
        const loadUser = async () => {
            const user = await fetchUser();
            if (user) setRole(user.role);
        };
        loadUser();
    }, []);

    const fetchSubject = useCallback(
        debounce(
            async (
                page = 1,
                name = nameFilter,
                limit = pageSize,
                status = statusFilter
            ) => {
                try {
                    setLoading(true);
                    const res = await api.get("/subject", {
                        params: { page, limit, name, status },
                        withCredentials: true,
                    });

                    const { subjects, total } = res.data;
                    setSubjectsData(subjects);
                    setTotalCount(total);
                    setCurrentPage(page);
                } catch (err) {
                    console.error("❌ Failed to fetch Subject:", err);
                } finally {
                    setLoading(false);
                }
            },
            400
        ),
        [nameFilter, statusFilter, pageSize]
    );

    useEffect(() => {
        const pageParam = parseInt(searchParams.get("page") || "1", 10);
        setCurrentPage(pageParam);
        fetchSubject(pageParam);
    }, [searchParams, position, fetchSubject]);

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);

            // 🔹 Fetch the subject by its ID
            const res = await api.get(`/subject/${id}`, { withCredentials: true });

            if (res.data) {
                // 🔹 Set the data to state so it fills the edit form
                setEditData(res.data);
                setDialogOpen(true);
            }
        } catch (err) {
            console.error("❌ Error loading subject:", err);
            toast({
                variant: "destructive",
                description: "Failed to load subject data.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => fetchSubject(currentPage);

    const handleEditSuccess = () => {
        setDialogOpen(false);
        setEditData(null);
        fetchSubject(currentPage);
    };

    return (
        <div className="bg-white p-4 flex-1 m-4 rounded-md mt-0" >
            <div className="container mx-auto py-4" >
                <DataTable
                    title="Subjects"
                    columns={
                        columns({
                            currentPage,
                            totalCount,
                            pageSize,
                            onRefresh: (page) => fetchSubject(page),
                            onEdit: handleEdit,
                            role,
                        })}
                    data={subjectsData}
                    loading={loading}
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onAddNew={handleCreateSuccess}
                    onRefresh={() => fetchSubject(currentPage)}
                    onPageChange={(page) => fetchSubject(page)}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        fetchSubject(1, nameFilter, size);
                    }}
                    onFilterChange={(name) => setNameFilter(name)}
                    onStatusFilterChange={(status) => setStatusFilter(status)}
                    filterKey="subjectName"
                    statusKey="okBlock"
                    renderCreateDialog={
                        < SubjectForm
                            open={createDialogOpen}
                            onOpenChange={setCreateDialogOpen}
                            onSuccess={handleCreateSuccess}
                        />
                    }
                />
            </div>

            {editData && (
                <SubjectForm
                    type="update"
                    data={editData}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={() => {
                        setDialogOpen(false);
                        setEditData(null);
                        fetchSubject(currentPage); // refresh list
                    }}
                    hideButton={true}
                />
            )}
        </div>
    );
}   