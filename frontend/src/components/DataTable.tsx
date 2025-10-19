"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, RefreshCw, Search, X, Columns3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface DataTableProps<TData, TValue> {
    title?: string;
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    loading?: boolean;
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onAddNew?: () => void;
    onRefresh?: () => void;
    onExport?: () => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onFilterChange?: (filter: string) => void;
    onStatusFilterChange?: (status: string | undefined) => void;
    ontypeFilterChange?: (status: string | undefined) => void;
    renderCreateDialog?: React.ReactNode;
    filterKey?: keyof TData; // e.g. 'subjectName' or 'fullName'
    statusKey?: keyof TData;
    typeKey?: keyof TData;
}

export function DataTable<TData, TValue>({
    title = "All Records",
    columns,
    data,
    loading = false,
    currentPage,
    totalCount,
    pageSize,
    onAddNew,
    onRefresh,
    onExport,
    onPageChange,
    onPageSizeChange,
    onFilterChange,
    onStatusFilterChange,
    ontypeFilterChange,
    renderCreateDialog,
    filterKey,
    statusKey,
    typeKey,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const debouncedGlobalFilter = useDebouncedValue(globalFilter, 500);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, settypeFilter] = useState<string>("");

    const table = useReactTable({
        data,
        columns,
        getRowId: (row: any, index) => row.id?.toString() || index.toString(),
        manualPagination: true,
        manualFiltering: true,
        pageCount: Math.ceil(totalCount / pageSize),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter: debouncedGlobalFilter,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize,
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: (updater) => {
            const newState =
                typeof updater === "function"
                    ? updater({ pageIndex: currentPage - 1, pageSize })
                    : updater;
            const newPage = newState.pageIndex + 1;
            onPageChange?.(newPage);
        },
    });
    const uniqueTypes = useMemo(() => {
        if (!typeKey) return [];
        const types = data
            .map((item) => String(item[typeKey] || ""))
            .filter(Boolean);
        return Array.from(new Set(types)); // remove duplicates
    }, [data, typeKey]);

    // 🔍 External name filter debounce
    useEffect(() => {
        onFilterChange?.(debouncedGlobalFilter);
    }, [debouncedGlobalFilter]);

    // 🔄 External status filter sync
    useEffect(() => {
        onStatusFilterChange?.(statusFilter || undefined);
    }, [statusFilter]);


    useEffect(() => {
        ontypeFilterChange?.(typeFilter || undefined); // ✅
    }, [typeFilter]);

    // Restore column visibility from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`${title}-column-visibility`);
        if (saved) {
            setColumnVisibility(JSON.parse(saved));
        }
    }, [title]);

    // Save visibility changes
    useEffect(() => {
        localStorage.setItem(`${title}-column-visibility`, JSON.stringify(columnVisibility));
    }, [columnVisibility, title]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-6">
                <h1 className="hidden md:block font-semibold text-lg">{title}</h1>
                <div className="flex items-center space-x-2">
                    {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    )}
                    {onExport && (
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-2" />
                        </Button>
                    )}
                    {renderCreateDialog || (onAddNew && (
                        <Button onClick={onAddNew} size="sm">
                            + Add New
                        </Button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 py-4">
                {/* Name Search */}
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={`Search ${String(filterKey || "name")}...`}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-8 max-w-sm"
                    />
                </div>

                {/* Status Filter */}
                {statusKey && (
                    <div className="flex items-center space-x-2">
                        <Select
                            onValueChange={(value) => {
                                const filterValue = value === "all" ? undefined : value;
                                onStatusFilterChange?.(filterValue);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Type Filter */}
                {typeKey && (
                    <div className="flex items-center space-x-2">
                        <Select
                            onValueChange={(value) => {
                                const filterValue = value === "all" ? undefined : value;
                                ontypeFilterChange?.(filterValue);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {uniqueTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Column Visibility */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto flex items-center gap-2">
                            <Columns3 className="h-4 w-4" />
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {typeof column.columnDef.header === "string"
                                        ? column.columnDef.header
                                        : column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-xl shadow-md border">
                <div className="overflow-auto h-[500px]">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-20 text-center">
                                        <div className="flex items-center justify-center">
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel()?.rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="even:bg-slate-50 hover:bg-lamaPurpleLight text-sm border-b"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4 px-4">
                <div className="text-sm text-muted-foreground hidden sm:block">
                    Showing {table.getRowModel().rows.length} of {totalCount} row(s)
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                                onPageSizeChange?.(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => onPageChange?.(1)}
                            disabled={currentPage <= 1}
                        >
                            {"<<"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => onPageChange?.(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            {"<"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => onPageChange?.(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        >
                            {">"}
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => onPageChange?.(Math.ceil(totalCount / pageSize))}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        >
                            {">>"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
