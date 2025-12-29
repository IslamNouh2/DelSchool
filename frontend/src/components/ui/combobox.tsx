"use client"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Framework = {
    value: string
    label: string
}

type ComboboxDemoProps = {
    frameworks: Framework[]
    type: string
    value: string
    onChange: (value: string) => void
    width?: string // Tailwind width class, e.g., "w-64"
    disabled?: boolean
}

export function ComboboxDemo({
    frameworks,
    type,
    value,
    onChange,
    width = "w-64",
    disabled = false,
}: ComboboxDemoProps) {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={`text-right ${width}`}>
                <SelectValue placeholder={`Select ${type}...`} />
            </SelectTrigger>
            <SelectContent className="!w-[var(--radix-select-trigger-width)]">
                <SelectGroup>
                    <SelectLabel className="text-gray-400 dark:text-slate-500 text-sm">{type}</SelectLabel>
                    {frameworks.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                            {f.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
