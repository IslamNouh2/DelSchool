"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { EmployerDataTable } from "./data-table";
import { columns } from "./columns";
import EmployerDialog from "@/components/forms/employerForm";
import { fetchUser } from "@/lib/getRoleFromToken";

interface Employer {
    employerId: number;
    firstName: string;
    lastName: string;
    address: string;
    code: string;
    cid: string;
    numNumerisation: string;
    okBlock: boolean;
    type: string;
    photoFileName: string;
}

interface TeacherResponse {
    employers: Employer[];
    total: number;
    page: number;
    totalPages: number;
}

export default function TeacherList() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [employers, setEmployers] = useState<Employer[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [nameFilter, setNameFilter] = useState("");

    const [editData, setEditData] = useState<Employer | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const [role, setRole] = useState<string | null>(null);
    useEffect(() => {
        const loadUser = async () => {
            const user = await fetchUser();
            if (user) setRole(user.role);
        };
        loadUser();
    }, []);
    const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
    const fetchEmployers = async (page = 1, name = nameFilter, limit = pageSize) => {
        try {
            setLoading(true);
            const res = await api.get<TeacherResponse>("/employer/search-by-name", {
                params: { page, limit, name, type: typeFilter, },
                withCredentials: true,
            });
            const { employers, total } = res.data;
            setEmployers(employers);
            setTotalCount(total);
            setCurrentPage(page);
        } catch (err) {
            console.error("Error fetching employers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        fetchEmployers(currentPage);
    };

    const handleEdit = async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get(`/employer/${id}`, { withCredentials: true });
            setEditData(res.data);
            setDialogOpen(true);
        } catch (err) {
            console.error("Error loading employer:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditData(null);
    };

    const handleEditSuccess = () => {
        handleDialogClose();
        fetchEmployers(currentPage); // Refresh the current page
    };

    useEffect(() => {
        fetchEmployers(1, nameFilter, pageSize);
    }, [typeFilter]);



    return (
        <div className="bg-white p-4 flex-1 m-4 rounded-md mt-0">
            <div className="container mx-auto py-4">
                <EmployerDataTable<Employer, any>
                    columns={columns({
                        currentPage,
                        totalCount,
                        pageSize,
                        onRefresh: (page) => fetchEmployers(page),
                        onEdit: handleEdit,
                        role: role,
                    })}
                    data={employers}
                    loading={loading}
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onAddNew={handleCreateSuccess}
                    onRefresh={() => fetchEmployers(currentPage)}
                    onExport={() => { }}
                    onPageChange={(page) => fetchEmployers(page)}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        fetchEmployers(1, nameFilter, size);
                    }}
                    onFilterChange={(name) => {
                        setNameFilter(name);
                        fetchEmployers(1, name);
                    }}
                    onTypeFilterChange={(val) => {
                        setTypeFilter(val);
                        fetchEmployers(1, nameFilter, pageSize); // re-fetch with new type
                    }}
                />
            </div>

            <EmployerDialog
                type="create"
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleCreateSuccess}
                hideButton={true}
            />

            {/* Edit Dialog - Render only when needed */}
            {editData && (
                <EmployerDialog
                    type="update"
                    data={editData}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={handleEditSuccess}
                    hideButton={true}  // Hide the trigger button
                />
            )}
        </div>
    );
}