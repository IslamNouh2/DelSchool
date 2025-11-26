"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ArrowDownWideNarrow } from "lucide-react";

interface Local {
    id: number;
    name: string;
    capacity?: number;
    type?: string;
}

export default function LocalListPage() {
    const [data, setData] = useState<Local[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filterValue, setFilterValue] = useState("");

    const fetchData = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get("/locals", {
                params: {
                    page,
                    limit: pageSize,
                    search: filterValue,
                },
            });
            setData(response.data.locals);
            setTotalCount(response.data.total);
        } catch (error) {
            console.error("Error fetching locals:", error);
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
                    <h1 className="hidden md:block text-lg font-semibold">All Locals</h1>
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
                
                {/* Placeholder for local list */}
                <div className="text-center py-12 text-muted-foreground">
                    {loading ? "Loading locals..." : `${totalCount} locals found`}
                </div>
            </CardContent>
        </Card>
    );
}
