"use client";

import React, { useState } from "react"
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
} from "@/components/ui/dropdown-menu"

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
import { Download, RefreshCw, Search } from "lucide-react";
import EmployerDialog from "@/components/forms/employerForm";
import { Input } from "@/components/ui/input"
import api from "@/lib/api";

interface Employer {
    employerId: number;
    firstName: String;
    lastName: String;
    dateOfBirth: Date;
    lieuOfBirth: String;
    gender: String;
    address: String;
    fatherName: String;
    motherName: String;
    code: String;
    health: String;
    dateCreate: Date;
    dateModif: Date;
    bloodType: String;
    etatCivil: String;
    cid: String;
    nationality: String;
    observation: String;
    numNumerisation: String;
    dateInscription: Date;
    okBlock: Boolean;
    type: String;
    photoFileName: String;
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    loading?: boolean;
    currentPage: number;
    totalCount: number;
    pageSize: number;
    onRefresh?: () => void;
    onAddNew?: () => void;
    onExport?: () => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onFilterChange?: (value: string) => void;
}

export function EmployerDataTable<TData, TValue>({
    columns,
    data = [],
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
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({
            code: true,
            address: false,
            numNumerisation : false,
        });
    const [rowSelection, setRowSelection] = React.useState({})
    const [selectedType, setSelectedType] = useState<string | undefined>(undefined);


    const table = useReactTable({
        data,
        columns,
        manualPagination: true,
        manualFiltering: true,
        pageCount: Math.ceil(totalCount / pageSize),
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: pageSize,
            },

        },
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: (updater) => {
            const newState =
                typeof updater === "function"
                    ? updater({
                        pageIndex: currentPage - 1,
                        pageSize,
                    })
                    : updater;

            const newPage = newState.pageIndex + 1;
            onPageChange?.(newPage);
        },
    });

    


    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-6">
                <h1 className="hidden md:block font-semibold text-lg">All Teachers</h1>
                <div className="flex items-center space-x-2">
                    {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Rafraîchir
                        </Button>
                    )}
                    {onExport && (
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                        </Button>
                    )}
                    {onAddNew && <EmployerDialog type="create" onSuccess={onAddNew} />}
                </div>
            </div>

            {/* Page Info */}
            <div className="flex items-center py-4">
                <Select value={selectedType} onValueChange={(value) => {
                    setSelectedType(value === "all" ? undefined : value);
                    table.getColumn("type")?.setFilterValue(value === "all" ? undefined : value);
                }}>
                    <SelectTrigger className="ml-4 w-[150px]">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Teacher">Teacher</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search Nom..."
                        value={table.getColumn("fullName")?.getFilterValue() as string || ""}
                        onChange={(event) => {
                            const val = event.target.value;
                            table.getColumn("fullName")?.setFilterValue(val);
                            onFilterChange?.(val);
                        }}
                        className="pl-8 max-w-sm"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) => column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table with Scrollable Container */}
            <div className="rounded-xl shadow-md border">
                <div className="overflow-auto h-[500px]">
                    <table className="min-w-full relative">
                        <TableHeader className="sticky top-0 z-20 bg-white" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-white" style={{ backgroundColor: 'white' }}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="bg-white border-b font-medium text-gray-900"
                                            style={{
                                                backgroundColor: 'white',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 20
                                            }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
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
                                            Chargement...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="even:bg-slate-50 hover:bg-lamaPurpleLight text-sm border-b"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-4 py-2">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Aucun enregistrement trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </table>
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
                            Page {currentPage} of{" "}
                            {Math.ceil(totalCount / pageSize)}
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
                    <div />
                </div>
            </div>
        </div>
    );
}