"use client";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { columns, classes } from "./columns";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ArrowDownWideNarrow } from "lucide-react";

export default function ClassListPage() {
    const [data, setData] = useState<classes[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");

    const fetchData = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/classes", {
                params: {
                    page,
                    limit: pageSize,
                    search: filterValue,
                },
            });
            setData(response.data.classes);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(currentPage);
    }, [currentPage, pageSize, filterValue]);

    return (
        <Card className="flex-1 m-4 mt-0">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="hidden md:block text-lg font-semibold">All Classes</h1>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 self-end">
                            <Button variant="outline" size="icon" className="rounded-full">
                                <Filter className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="rounded-full">
                                <ArrowDownWideNarrow className="w-4 h-4" />
                            </Button>
                            <Button size="icon" className="rounded-full">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
                <DataTable
                    title="Classes"
                    columns={columns({ 
                        currentPage, 
                        onRefresh: fetchData, 
                        totalCount, 
                        pageSize, 
                        onEdit: (id: number) => console.log("Edit", id),
                        role: null 
                    })}
                    data={data}
                    loading={loading}
                    currentPage={currentPage}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    onRefresh={() => fetchData(currentPage)}
                    onFilterChange={setFilterValue}
                    filterKey="subjectName"
                />
            </CardContent>
        </Card>
    );
}
