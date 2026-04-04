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
    // Radix Select only shows a selection when `value` matches a SelectItem exactly. Trim/case differences
    // from the API (e.g. "Female " vs "Female") must map to the canonical option value.
    const normalizedInput = String(value ?? "").trim().toLowerCase()
    const matched =
        normalizedInput.length > 0
            ? frameworks.find(
                (f) =>
                    String(f.value).trim().toLowerCase() === normalizedInput
            )
            : undefined

    const safeValue = matched ? String(matched.value) : undefined

    // console.log(`Combobox [${type}] value:`, value, "normalized:", normalizedInput, "matched:", matched?.value, "safeValue:", safeValue);

    return (
        <Select value={safeValue} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={`text-right ${width}`}>
                <SelectValue placeholder={`Select ${type}...`} />
            </SelectTrigger>
            <SelectContent className="z-[100] !w-[var(--radix-select-trigger-width)]">
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
