"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import api from "@/lib/api";

// Lazy load Combobox
const ComboboxDemo = dynamic(
    () => import("../ui/combobox").then((mod) => mod.ComboboxDemo),
    {
        ssr: false,
        loading: () => (
            <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse" />
        ),
    }
);

interface CompteFormProps {
    type?: "create" | "update";
    data?: any;
    onSuccess?: () => void;
    setOpen: (open: boolean) => void;
}

function buildHierarchy(comptes: any[]) {
    const map = new Map<number | null, any[]>();

    comptes.forEach((c) => {
        const pId = c.parentId;
        if (!map.has(pId)) map.set(pId, []);
        map.get(pId)!.push(c);
    });

    const result: { value: string; label: string }[] = [
        { value: "-1", label: "Root (None)" }
    ];

    const traverse = (parentId: number, level: number, prefix = "") => {
        const children = map.get(parentId) || [];
        children.forEach((child, index) => {
            const id = child.id;
            const name = child.name;

            if (!id || !name) return;

            const isLast = index === children.length - 1;
            const branch = level === 0 ? "" : prefix + (isLast ? "└─ " : "├─ ");

            result.push({
                value: id.toString(),
                label: branch + name,
            });

            const newPrefix = prefix + (isLast ? "   " : "│  ");
            traverse(id, level + 1, newPrefix);
        });
    };

    traverse(-1, 0);
    return result;
}

export default function CompteForm({
    type = "create",
    data,
    onSuccess,
    setOpen,
}: CompteFormProps) {
    const [form, setForm] = useState({
        name: "",
        parentId: -1,
        okBlock: false,
        employerId: null as number | null,
    });
    const [loading, setLoading] = useState(false);
    const [comptes, setComptes] = useState<{ value: string; label: string }[]>([]);
    const [employers, setEmployers] = useState<{ value: string; label: string }[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<number>(-1);
    const [selectedEmployerId, setSelectedEmployerId] = useState<number | null>(null);

    const fetchComptes = async () => {
        try {
            const res = await api.get("/compte", { params: { limit: 1000 } });
            const flat = res.data.comptes || [];
            const hierarchical = buildHierarchy(flat);
            setComptes(hierarchical);
        } catch (err) {
            console.error("Failed to load accounts:", err);
        }
    };

    const fetchEmployers = async () => {
        try {
            const res = await api.get("/employer/list", { params: { limit: 1000 } });
            const list = res.data.employers || [];
            setEmployers(list.map((e: any) => ({
                value: e.employerId.toString(),
                label: `${e.firstName} ${e.lastName}`
            })));
        } catch (err) {
            console.error("Failed to load employers:", err);
        }
    };

    useEffect(() => {
        fetchComptes();
        fetchEmployers();
    }, []);

    useEffect(() => {
        if (type === "update" && data) {
            setForm({
                name: data.name || "",
                parentId: data.parentId ?? -1,
                okBlock: data.okBlock ?? false,
                employerId: data.employerId || null,
            });
            setSelectedParentId(data.parentId ?? -1);
            setSelectedEmployerId(data.employerId || null);
        } else if (type === "create" && data?.parentId) {
            setSelectedParentId(data.parentId);
            setSelectedEmployerId(null);
        } else {
            setForm({
                name: "",
                parentId: -1,
                okBlock: false,
                employerId: null,
            });
            setSelectedParentId(-1);
            setSelectedEmployerId(null);
        }
    }, [type, data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: form.name,
            parentId: selectedParentId,
            okBlock: form.okBlock,
            employerId: selectedEmployerId,
        };

        try {
            if (type === "create") {
                await api.post("/compte", payload);
                toast({ title: "Account created successfully" });
            } else {
                await api.patch(`/compte/${data.id}`, payload);
                toast({ title: "Account updated successfully" });
            }
            setOpen(false);
            onSuccess?.();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.response?.data?.message || "An error occurred",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label>Account Name</Label>
                    <Input
                        value={form.name}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                        placeholder="e.g. SALAIRES"
                    />
                </div>

                <div>
                    <Label>Parent Account</Label>
                    <ComboboxDemo
                        frameworks={comptes}
                        value={selectedParentId.toString()}
                        onChange={(val) => setSelectedParentId(parseInt(val, 10))}
                        type="account"
                        width="w-full"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="okBlock"
                        checked={form.okBlock}
                        onCheckedChange={(checked) =>
                            setForm((prev) => ({ ...prev, okBlock: checked === true }))
                        }
                    />
                    <Label htmlFor="okBlock">Block this account</Label>
                </div>

                <div>
                    <Label>Link to Employer (Optional)</Label>
                    <ComboboxDemo
                        frameworks={employers}
                        value={selectedEmployerId?.toString() || ""}
                        onChange={(val) => setSelectedEmployerId(val ? parseInt(val, 10) : null)}
                        type="employer"
                        width="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Link this account to a staff member to track their status.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                        </>
                    ) : type === "create" ? (
                        "Create"
                    ) : (
                        "Update"
                    ) }
                </Button>
            </div>
        </form>
    );
}
