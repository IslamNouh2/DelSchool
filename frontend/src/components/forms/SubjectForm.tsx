"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
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

interface SubjectDialogProps {
    type?: "create" | "update";
    data?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    hideButton?: boolean;
}

type Subject = {
    SubjectId: number;
    subjectNme: string;
    totalGrades: number;
    BG: number;
    BD: number;
    parentId: number | null;
};

function buildHierarchy(subjects: any[]) {
    const map = new Map<number | null, any[]>();

    subjects.forEach((s) => {
        const parentId = s.parentId ?? 0;
        if (!map.has(parentId)) map.set(parentId, []);
        map.get(parentId)!.push(s);
    });

    const result: { value: string; label: string }[] = [];

    const traverse = (parentId: number | null, level: number, prefix = "") => {
        const children = map.get(parentId ?? 0) || [];
        children.forEach((child, index) => {
            const id = child.SubjectId ?? child.subjectId;
            const name = child.subjectNme ?? child.subjectName;

            if (!id || !name) return;

            // ├─ for middle children, └─ for last child
            const isLast = index === children.length - 1;
            const branch = level === 0 ? "" : prefix + (isLast ? "└─ " : "├─ ");

            result.push({
                value: id.toString(),
                label: branch + name,
            });

            // update prefix for nested children
            const newPrefix = prefix + (isLast ? "   " : "│  ");
            traverse(id, level + 1, newPrefix);
        });
    };

    traverse(null, 0);
    return result;
}

export default function SubjectDialog({
    type = "create",
    data,
    open,
    onOpenChange,
    onSuccess,
    hideButton = false,
}: SubjectDialogProps) {
    const [form, setForm] = useState({
        subjectName: "",
        totalGrads: 0,
        parentId: -1,
        okBlock: false,
    });
    const [loading, setLoading] = useState(false);
    const [showSubSubject, setShowSubSubject] = useState(false);
    const [subSubjects, setSubSubjects] = useState<
        { value: string; label: string }[]
    >([]);
    const [selectedSubSubjectId, setSelectedSubSubjectId] = useState<number>(-1);

    useEffect(() => {
        const fetchParam = async () => {
            try {
                const res = await api.get("/parameter/Ok_Sub_subject");
                const isActive = res.data?.okActive === true;
                setShowSubSubject(isActive);
                console.log("📘 Ok_Sub_subject:", isActive);
            } catch (err) {
                console.error("❌ Failed to load parameter:", err);
                setShowSubSubject(false);
            }
        };
        fetchParam();
    }, []);

    useEffect(() => {
        if (!showSubSubject) return;
        const fetchSubSubjects = async () => {
            try {
                //console.log("📘 Fetching sub subjects...");
                // 👇 use the correct endpoint that your API actually supports
                const res = await api.get("/subject/sub-subjects", { withCredentials: true });
                const flat = res.data || [];
                const hierarchical = buildHierarchy(flat);
                setSubSubjects(hierarchical);
                //console.log("✅ Loaded sub subjects:", hierarchical);
            } catch (err) {
                console.error("❌ Failed to load sub subjects:", err);
                toast({
                    variant: "destructive",
                    title: "Failed to load sub subjects",
                    description: "Check your backend route /subject/sub",
                });
            }
        };
        fetchSubSubjects();
    }, [showSubSubject]);

    useEffect(() => {
        if (type === "update" && data) {
            setForm({
                subjectName: data.subjectName || "",
                totalGrads: data.totalGrads || 0,
                parentId: showSubSubject ? selectedSubSubjectId : -1,
                okBlock: data.okBlock ?? false,
            });
            if (data.parentId) setSelectedSubSubjectId(data.parentId);
        } else if (type === "create" && data?.parentId) {
            // Pre-fill parent ID for sub-subject creation
            setSelectedSubSubjectId(data.parentId);
        }
    }, [type, data, showSubSubject, selectedSubSubjectId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            subjectName: form.subjectName,
            totalGrads: parseInt(form.totalGrads as any, 10),
            parentId: showSubSubject ? selectedSubSubjectId : -1,
            okBlock: form.okBlock, 
        };

        try {
            if (type === "create") {
                console.log("✅ subjects:", payload);
                await api.post("/subject/createSub", payload, { withCredentials: true });
                toast({ title: "Subject created successfully" });
            } else {
                const id = data.subjectId ?? data.SubjectId;
                if (!id) {
                    console.error("❌ Missing subject ID in data:", data);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Missing subject ID — cannot update.",
                    });
                    setLoading(false);
                    return;
                }

                await api.patch(`/subject/${id}`, payload, { withCredentials: true });
                toast({ title: "Subject updated successfully" });
            }
            onOpenChange?.(false);
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            {!hideButton && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Subject
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>
                            {type === "create" ? "Create" : "Update"} Subject
                        </DialogTitle>
                        <DialogDescription>
                            Fill out the form to {type === "create" ? "add" : "edit"} a
                            subject.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Subject Name</Label>
                            <Input
                                name="subjectName"
                                value={form.subjectName}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, subjectName: e.target.value }))
                                }
                                required
                            />
                        </div>

                        <div>
                            <Label>Total Points</Label>
                            <Input
                                type="number"
                                name="totalGrads"
                                value={form.totalGrads}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        totalGrads: Number(e.target.value),
                                    }))
                                }
                                required
                            />
                        </div>

                        {showSubSubject && (
                            <div>
                                <Label>Parent Subject</Label>
                                <ComboboxDemo
                                    frameworks={subSubjects}
                                    value={
                                        selectedSubSubjectId > 0
                                            ? selectedSubSubjectId.toString()
                                            : ""
                                    }
                                    onChange={(val) => setSelectedSubSubjectId(parseInt(val, 10))}
                                    type="sub-subject"
                                    width="w-full"
                                />
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="okBlock"
                                checked={form.okBlock}
                                onCheckedChange={(checked) =>
                                    setForm((prev) => ({ ...prev, okBlock: checked === true }))
                                }
                            />
                            <Label htmlFor="okBlock">Block this subject</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange?.(false)}
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
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
