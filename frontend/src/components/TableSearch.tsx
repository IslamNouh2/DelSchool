import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react";

type TableSearchProps = {
    onSearchChange: (value: string) => void;
};

const TableSearch = ({ onSearchChange }: TableSearchProps) => {
    const [value, setValue] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const search = e.target.value;
        setValue(search);
        onSearchChange(search);
    };

    return (
        <div className="w-full md:w-auto lg:block flex items-center text-xs gap-2 relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                type="search"
                placeholder="Search..."
                className="pl-10"
                value={value}
                onChange={handleChange}
            />
        </div>
    );
};

export default TableSearch;
