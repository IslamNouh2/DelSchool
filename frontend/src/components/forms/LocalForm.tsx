"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Input } from "../ui/input";

import { useToast } from "@/hooks/use-toast";
import SubjectSelectorForm from "./SubjectSelectorForm";
import { DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import api from "@/lib/api";

type LocalFormProps = {
    type: "create" | "update";
    data?: any;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: any;
    onSuccess?: () => void;
};

const LocalForm: React.FC<LocalFormProps> = ({
    type,
    data,
    setOpen,
    relatedData,
    onSuccess,
}) => {
    const [form, setForm] = useState({
        LocalName: "",
        Code: "",
        NumClass: "",
        size: "",
    });

    const [localId, setLocalId] = useState<number | null>(null);
    const [showSubjectForm, setShowSubjectForm] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        if (type === "update" && data) {
            setForm({
                LocalName: data.name || "",
                Code: data.code || "",
                NumClass: data.NumClass?.toString() || "",
                size: data.size?.toString() || "",
            });
            setLocalId(data.localId);
        }
    }, [type, data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { LocalName, Code, NumClass } = form;
        if (!Code || !LocalName || !NumClass) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something wrong.",
                description: "All fields are required.",
            });
            return;
        }

        const numClassInt = parseInt(NumClass);
        if (isNaN(numClassInt)) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something wrong.",
                description: "NumClass must be a number.",
            });
            return;
        }

        const payload = {
            name: LocalName,
            code: Code,
            NumClass: numClassInt,
            size: parseInt(form.size) || 0,
        };

        try {
            if (type === "create") {
                const response = await api.post("/local/create", payload, {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const newLocal = response.data;
                setLocalId(newLocal.localId);
                setShowSubjectForm(true);
                return;
            } else if (type === "update") {
                await api.put(`/local/${data.localId}`, payload, {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                });

                setShowSubjectForm(true);
            }
        } catch (error: any) {
            const message =
                error.response?.data?.message || error.message || "Erreur inconnue";
            console.error("❌ Échec création local:", message);
        }
    };

    return (
        <>
            {!showSubjectForm ? (
                <form onSubmit={handleSubmit}>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/3">
                                <h1 className="text-sm text-gray-600 dark:text-slate-400">Code</h1>
                                <Input
                                    value={form.Code}
                                    onChange={(e) => setForm({ ...form, Code: e.target.value })}
                                    placeholder="Code"
                                    required
                                />
                            </div>
                            <div className="w-full md:w-2/3">
                                <h1 className="text-sm text-gray-600 dark:text-slate-400">Local name</h1>
                                <Input
                                    value={form.LocalName}
                                    onChange={(e) =>
                                        setForm({ ...form, LocalName: e.target.value })
                                    }
                                    placeholder="Local name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                            <div className="w-full md:w-1/3">
                                <h1 className="text-sm text-gray-600 dark:text-slate-400">Num</h1>
                                <Input
                                    type="number"
                                    value={form.NumClass}
                                    onChange={(e) =>
                                        setForm({ ...form, NumClass: e.target.value })
                                    }
                                    placeholder="Num"
                                    required
                                />
                            </div>

                            <div className="w-full md:w-1/3">
                                <h1 className="text-sm text-gray-600 dark:text-slate-400">Student Capacity (Size)</h1>
                                <Input
                                    type="number"
                                    value={form.size}
                                    onChange={(e) =>
                                        setForm({ ...form, size: e.target.value })
                                    }
                                    placeholder="e.g. 60"
                                    required
                                />
                            </div>

                            {type === "update" && (
                                <div className="w-fit self-end">
                                    <Button type="button" onClick={() => setShowSubjectForm(true)}>
                                        Show Subject
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="submit">
                            {type === "create" ? "Create" : "Update"}
                        </Button>
                    </DialogFooter>
                </form>
            ) : (
                localId && (
                    <SubjectSelectorForm
                        localId={localId}
                        onClose={() => {
                            setOpen(false); // Close the dialog
                            onSuccess?.();  // Refresh the list
                        }}
                    />
                )
            )}
        </>
    );
};

export default LocalForm;
