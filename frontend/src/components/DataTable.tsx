// components/DataTable.tsx
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';


const DataTable = ({
    columns,
    renderRow,
    data,
}: {
    columns: { header: string; accessor: string; className?: string }[];
    renderRow: (item: any, index:number) => React.ReactNode;
    data: any[];
}) => {
    if (!Array.isArray(data)) {
        return <div className="text-red-500 p-4">Invalid data format</div>;
    }

    if (data.length === 0) {
        return <div className="text-gray-500 p-4">No records found</div>;
    }

    return (
        <div className="overflow-x-auto rounded-xl shadow-md mt-4">
            <table className="min-w-full text-sm text-left text-gray-700 bg-white">
                <thead className="bg-lamaPurpleLight text-xs uppercase text-gray-500">
                    <tr>
                        <th className="p-4">
                            <h1>N</h1>
                        </th>
                        {columns.map((col) => (
                            <th key={col.accessor} className={col.className || "px-4 py-3"}>
                                {col.header}
                            </th>
                        ))}
                        <th className="px-4 py-3">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <React.Fragment key={item.id || index}>
                            {renderRow(item, index)}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
export default DataTable;
