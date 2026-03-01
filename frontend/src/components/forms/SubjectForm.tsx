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
import { toast as sonnerToast } from "sonner";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { OfflineDB } from "@/lib/db";
import Cookies from "js-cookie";

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
    const t = useTranslations("subjects.form");
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
    const tenantId = Cookies.get("tenantId") as string;

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
                sonnerToast.error(t("load_parent_error"));
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
            let res;
            if (type === "create") {
                console.log("✅ subjects:", payload);
                res = await api.post("/subject/createSub", payload, { withCredentials: true });
                
                if (res.status === 202 || (res.data as any).offline) {
                    sonnerToast.success(t("creation_offline_success") || "Subject creation queued offline");
                } else {
                    sonnerToast.success(t("creation_success") || "Subject created successfully");
                }
            } else {
                const id = data.subjectId ?? data.SubjectId;
                if (!id) {
                    console.error("❌ Missing subject ID in data:", data);
                    sonnerToast.error(t("missing_id"));
                    setLoading(false);
                    return;
                }

                res = await api.patch(`/subject/${id}`, payload, { withCredentials: true });
                
                if (res.status === 202 || (res.data as any).offline) {
                    sonnerToast.success(t("update_offline_success") || "Subject update queued offline");
                } else {
                    sonnerToast.success(t("update_success") || "Subject updated successfully");
                }
            }
            onOpenChange?.(false);
            onSuccess?.();
        } catch (err: any) {
            sonnerToast.error(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {!hideButton && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="me-2 h-4 w-4" /> {t("create")}
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>
                            {type === "create" ? t("create_title") : t("update_title")}
                        </DialogTitle>
                        <DialogDescription>
                            {type === "create" ? t("description_create") : t("description_update")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>{t("name_label")}</Label>
                            <Input
                                name="subjectName"
                                value={form.subjectName}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, subjectName: e.target.value }))
                                }
                                required
                                className="rounded-xl border-gray-200 dark:border-slate-800"
                            />
                        </div>

                        <div>
                            <Label>{t("points_label")}</Label>
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
                                className="rounded-xl border-gray-200 dark:border-slate-800"
                            />
                        </div>

                        {showSubSubject && (
                            <div>
                                <Label>{t("parent_label")}</Label>
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
                        
                        <div className="flex items-center space-s-3 bg-gray-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800 self-end">
                            <Checkbox
                                id="okBlock"
                                checked={form.okBlock}
                                onCheckedChange={(checked) =>
                                    setForm((prev) => ({ ...prev, okBlock: checked === true }))
                                }
                                className="rounded-md border-gray-300 dark:border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label htmlFor="okBlock" className="text-sm font-medium leading-none cursor-pointer">
                                {t("block_label")}
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange?.(false)}
                            disabled={loading}
                            className="rounded-xl"
                        >
                            {t("cancel")}
                        </Button>
                        <Button type="submit" disabled={loading} className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all border-none font-bold">
                            {loading ? (
                                <>
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" /> {t("processing")}
                                </>
                            ) : type === "create" ? (
                                t("create")
                            ) : (
                                t("update")
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
