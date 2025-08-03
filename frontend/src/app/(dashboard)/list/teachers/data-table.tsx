"use client";

import React, { useEffect, useState } from "react"
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
import { Download, RefreshCw, Search, X } from "lucide-react";
import EmployerDialog from "@/components/forms/employerForm";
import { Input } from "@/components/ui/input"
import api from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

interface DataTableProps<TData extends Employer = Employer, TValue = unknown> {
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
    onTypeFilterChange?: (type: string | undefined) => void;
}

export function EmployerDataTable<TData extends Employer = Employer, TValue = unknown>({
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
    onTypeFilterChange,
}: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = React.useState<SortingState>([])
    
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [open, setOpen] = useState(false);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({
            code: true,
            address: false,
            numNumerisation: false,
        });
    const [rowSelection, setRowSelection] = React.useState({})
    const debouncedGlobalFilter = useDebouncedValue(globalFilter, 500);
    // Get unique types from data for filter options
    const uniqueTypes = React.useMemo(() => {
        const types = data.map((item: any) => (item as any)?.type).filter(Boolean);
        return [...new Set(types)] as string[];
    }, [data]);


    const table = useReactTable({
        data,
        columns,
        getRowId: row => row.employerId.toString(),
        enableRowSelection: true,
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
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter: debouncedGlobalFilter, 
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: pageSize,
            },

        },

        onRowSelectionChange: setRowSelection,
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

    useEffect(() => {
        table.getColumn("fullName")?.setFilterValue(debouncedGlobalFilter);
        onFilterChange?.(debouncedGlobalFilter);
    }, [debouncedGlobalFilter]);

    // Get current type filter value
    const typeFilterValue = (table.getColumn("type")?.getFilterValue() as string) || "";

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-6">
                <h1 className="hidden md:block font-semibold text-lg">All Teachers</h1>
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
                    {onAddNew &&
                        <EmployerDialog
                            open={open}
                            onOpenChange={setOpen}
                            type="create"
                            onSuccess={onAddNew} />
                    }
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-4 py-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search Name..."
                        value={globalFilter}
                        onChange={(event) => {
                            const val = event.target.value;
                            setGlobalFilter(val);
                        }}
                        className="pl-8 max-w-sm"
                    />
                </div>

                {/* Type Filter */}
                {table.getColumn("type") && (
                    <div className="flex items-center space-x-2">
                        <Select
                            value={typeFilterValue}
                            onValueChange={(value) => {
                                const filterValue = value === "all" ? "" : value;
                                table.getColumn("type")?.setFilterValue(filterValue || undefined);
                                onTypeFilterChange?.(filterValue || undefined);
                            }}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {uniqueTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {typeFilterValue && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    table.getColumn("type")?.setFilterValue(undefined);
                                    onTypeFilterChange?.(undefined);
                                }}
                                className="h-8 px-2 lg:px-3"
                            >
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Column Visibility */}
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

            {/* Active Filters Display */}
            {(typeFilterValue || (table.getColumn("fullName")?.getFilterValue() as string)) && (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {typeFilterValue && (
                        <div className="flex items-center space-x-1 rounded-md border px-3 py-1">
                            <span className="text-sm">Type: {typeFilterValue}</span>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    table.getColumn("type")?.setFilterValue(undefined);
                                    onTypeFilterChange?.(undefined);
                                }}
                                className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    {(table.getColumn("fullName")?.getFilterValue() as string) && (
                        <div className="flex items-center space-x-1 rounded-md border px-3 py-1">
                            <span className="text-sm">Name: {table.getColumn("fullName")?.getFilterValue() as string}</span>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    table.getColumn("fullName")?.setFilterValue("");
                                    onFilterChange?.("");
                                }}
                                className="h-4 w-4 p-0 hover:bg-transparent"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Table with Scrollable Container */}
            <div className="rounded-xl shadow-md border">
                <div className="overflow-auto h-[500px]">
                    <table className="min-w-full relative">
                        <TableHeader className="sticky top-0 z-20 bg-lamaPurpleLight rounded-md" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-white" style={{ backgroundColor: 'white' }}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className="bg-lamaPurpleLight rounded-lg border-b font-medium text-gray-900"
                                            style={{
                                                backgroundColor: 'bg-lamaPurpleLight',
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