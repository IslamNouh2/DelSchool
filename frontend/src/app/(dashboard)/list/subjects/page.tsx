"use client";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { columns, Subject } from "./columns";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function SubjectListPage() {
    const [data, setData] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");

    const fetchData = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/subjects", {
                params: {
                    page,
                    limit: pageSize,
                    search: filterValue,
                },
            });
            setData(response.data.subjects);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching subjects:", error);
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
                <div className="container mx-auto py-4" >
                    <DataTable
                        title="Subjects"
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
                </div>
            </CardContent>
        </Card>
    );
}