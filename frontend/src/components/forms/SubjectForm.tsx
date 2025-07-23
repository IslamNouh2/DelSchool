"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { Checkbox } from "../ui/checkbox";
import { toast } from "@/hooks/use-toast";

const ComboboxDemo = dynamic(
    () => import("../ui/combobox").then((mod) => mod.ComboboxDemo),
    {
        loading: () => (
            <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse" />
        ),
        ssr: false,
    }
);

type Subject = {
    SubjectId: number;
    subjectNme: string;
    totalGrades: number;
    BG: number;
    BD: number;
    parentId: number | null;
};

type SubjectFormProps = {
    type: "create" | "update";
    data?: any;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: any;
    onSuccess?: (selectedSubSubjectId?: number) => void;
};

function buildHierarchyWithIndentation(subjects: Subject[]) {
    const map = new Map<number | null, Subject[]>();

    subjects.forEach((s) => {
        const parentId = s.parentId ?? 0;
        if (!map.has(parentId)) {
            map.set(parentId, []);
        }
        map.get(parentId)!.push(s);
    });

    const result: { value: string; label: string }[] = [];

    const traverse = (parentId: number | null, level: number) => {
        const children = map.get(parentId ?? 0) || [];
        for (const child of children) {
            const indent = " ".repeat(level); // EM space for better alignment
            result.push({
                value: child.SubjectId.toString(),
                label: `${indent}${child.subjectNme}`,
            });
            traverse(child.SubjectId, level + 1);
        }
    };

    traverse(null, 0);
    return result;
}

const SubjectForm: React.FC<SubjectFormProps> = ({
    type,
    data,
    setOpen,
    onSuccess,
}) => {
    const [form, setForm] = useState({
        subjectName: "",
        totalGrads: 0,
    });

    const [subSubjects, setSubSubjects] = useState<
        { value: string; label: string }[]
    >([]);
    const [selectedSubSubjectId, setSelectedSubSubjectId] = useState<number>(-1);
    const [showSubSubject, setShowSubSubject] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchParams = async () => {
            try {
                const res = await api.get("/parameter/Ok_Sub_subject");
                //console.log("Parameter response:", res.data);

                const value = res.data?.okActive;
                setShowSubSubject(value === true);
            } catch (err) {
                console.error("Failed to fetch sub_subject param", err);
                setShowSubSubject(false); // fallback
            }
        };

        fetchParams();
    }, []);

    // useEffect(() => {
    //     console.log("Show Sub Subject:", showSubSubject);
    // }, [showSubSubject
    // ]);

    
    useEffect(() => {
        if (!showSubSubject) return;
        const fetchSubSubjects = async () => {
            try {
                setLoading(true);
                const subResponse = await api.get("/subject/sub");
                const flatSubjects = subResponse.data || [];
                const hierarchical = buildHierarchyWithIndentation(flatSubjects);
                setSubSubjects(hierarchical);
            } catch (err) {
                console.error("Failed to load sub subjects", err);
                setError("Failed to load sub subjects");
            } finally {
                setLoading(false);
            }
        };

        fetchSubSubjects();
    }, [showSubSubject]);

    useEffect(() => {
        if (type === "update" && data) {
            setForm({
                subjectName: data.subjectName || "",
                totalGrads: data.totalGrads || 0,
            });

            if (data.subSubject?.subjectId) {
                setSelectedSubSubjectId(data.subSubject.subjectId);
            }
        }
    }, [type, data]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubSubjectSelect = (value: string) => {
        const id = parseInt(value, 10);
        setSelectedSubSubjectId(id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (showSubSubject === true) {
            if (!selectedSubSubjectId || selectedSubSubjectId <= 0) {
                setError("Please select a sub subject.");
                setLoading(false);
                return;
            }
        } else {
            setSelectedSubSubjectId(-1);
        }

        const payload = {
            subjectName: form.subjectName,
            totalGrads: parseInt(form.totalGrads as any, 10),
            parentId: selectedSubSubjectId,
        };

        try {
            if (type === "create") {
                await api.post("/subject/createSub", payload, {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                });
            } else {
                await api.patch(`/subject/${data.classId}`, payload, {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                });
            }

            setOpen(false);
            onSuccess?.(selectedSubSubjectId);
        } catch (err: any) {
            console.error("Operation failed:", err);
            toast({
                variant: "destructive",
                title: "Uh oh! An error occurred.",
                description: err.response?.data?.message,
            })
            //setError(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Subject Name
                    </label>
                    <Input
                        name="subjectName"
                        value={form.subjectName}
                        onChange={handleChange}
                        placeholder="Enter subject name"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Total Points
                    </label>
                    <Input
                        type="number"
                        name="totalGrads"
                        value={form.totalGrads}
                        onChange={handleChange}
                        min="0"
                        placeholder="Enter total points"
                        required
                    />
                </div>

                {showSubSubject && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Sub Subject
                        </label>
                        {loading ? (
                            <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse" />
                        ) : (
                            <div className="space-y-2 w-11/12">
                                <ComboboxDemo
                                    frameworks={subSubjects}
                                    type="sub-subject"
                                    value={
                                        selectedSubSubjectId > 0
                                            ? selectedSubSubjectId.toString()
                                            : ""
                                    }
                                    onChange={handleSubSubjectSelect}
                                    width="w-[109%]"
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="items-top flex space-x-2">
                    <Checkbox id="terms1" />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="terms1"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Block this subject
                        </label>
                    </div>
                </div>
            </div>

            <DialogFooter className="mt-6">
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : type === "create" ? (
                        "Create Subject"
                    ) : (
                        "Update Subject"
                    )}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default SubjectForm;
