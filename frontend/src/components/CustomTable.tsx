"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export interface Column<T> {
    header: string;
    key: string;
    visible?: boolean;
    render?: (item: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface CustomTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    loadingMessage?: string;
    emptyMessage?: string;
    rowKey: (item: T) => string | number;
    footer?: React.ReactNode;
}

function CustomTableComponent<T>({
    columns,
    data,
    loading = false,
    loadingMessage = "Loading...",
    emptyMessage = "No records found.",
    rowKey,
    footer,
}: CustomTableProps<T>) {
    const visibleColumns = useMemo(() => columns.filter((col) => col.visible !== false), [columns]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-blue-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            {visibleColumns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider ${col.headerClassName || ""}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={visibleColumns.length}
                                    className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                                >
                                    {loadingMessage}
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={visibleColumns.length}
                                    className="px-6 py-12 text-center text-gray-500 dark:text-slate-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <motion.tr
                                    key={rowKey(item)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    {visibleColumns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || ""}`}
                                        >
                                            {col.render ? col.render(item) : (item as any)[col.key] || "-"}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {footer && (
                <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                    {footer}
                </div>
            )}
        </div>
    );
}

export const CustomTable = React.memo(CustomTableComponent) as typeof CustomTableComponent;
