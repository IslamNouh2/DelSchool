"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import dynamic from "next/dynamic";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

// Dynamically import ComboboxDemo with fallback
const ComboboxDemo = dynamic(
    () => import("../ui/combobox").then((mod) => mod.ComboboxDemo),
    {
        loading: () => <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse" />,
        ssr: false
    }
);

type Local = {
    localId: number;
    name: string;
    code: string;
};

type ClassFormProps = {
    type: "create" | "update";
    data?: any;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: any;
    onSuccess?: () => void;
};

import { useTranslations } from "next-intl";
import { useTranslateError } from "@/hooks/useTranslateError";

const ClassForm: React.FC<ClassFormProps> = ({
    type,
    data,
    setOpen,
    relatedData,
    onSuccess,
}) => {
    const t = useTranslations("classes");
    const actionsT = useTranslations("actions");
    const { translateError } = useTranslateError();

    const [form, setForm] = useState({
        ClassName: "",
        Code: "",
        NumStudent: "",
    });

    const [locals, setLocals] = useState<Local[]>([]);
    const [selectedLocalName, setSelectedLocalName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load locals from API
    useEffect(() => {
        const fetchLocals = async () => {
            try {
                setLoading(true);
                const response = await api.get("/local", { withCredentials: true });
                setLocals(response.data.locals || []);
            } catch (err) {
                console.error("Failed to load locals:", err);
                setError(t("messages.fetch_locals_error"));
            } finally {
                setLoading(false);
            }
        };

        fetchLocals();
    }, [t]);

    // Initialize form for update
    useEffect(() => {
        if (type === "update" && data && locals.length > 0) {
            setForm({
                ClassName: data.ClassName || "",
                Code: data.code || "",
                NumStudent: data.NumStudent?.toString() || "",
            });

            if (data.local?.name) {
                setSelectedLocalName(data.local.name);
            }
        }
    }, [type, data, locals]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedLocalName) {
            setError(t("messages.select_local_error"));
            setLoading(false);
            return;
        }

        const numStudents = parseInt(form.NumStudent);
        if (isNaN(numStudents) || numStudents <= 0) {
            setError(t("messages.positive_students_error"));
            setLoading(false);
            return;
        }

        const payload = {
            ClassName: form.ClassName,
            code: form.Code,
            NumStudent: numStudents,
            localName: selectedLocalName,
        };

        try {
            if (type === "create") {
                await api.post("/class/create", payload, {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                });
            } else {
                await api.put(`/class/${data.classId}`, payload, {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                });
            }

            setOpen(false);
            onSuccess?.();
        } catch (err: any) {
            console.error("Operation failed:", err);
            setError(translateError(err));
        } finally {
            setLoading(false);
        }
    };

    const localOptions = locals.map(local => ({
        value: local.name,
        label: `${local.name} (${local.code})`,
    }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t("form.name_label")}</label>
                    <Input
                        name="ClassName"
                        value={form.ClassName}
                        onChange={handleChange}
                        placeholder={t("form.name_placeholder")}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t("form.code_label")}</label>
                    <Input
                        name="Code"
                        value={form.Code}
                        onChange={handleChange}
                        placeholder={t("form.code_placeholder")}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t("form.students_label")}</label>
                    <Input
                        type="number"
                        name="NumStudent"
                        value={form.NumStudent}
                        onChange={handleChange}
                        min="1"
                        placeholder={t("form.students_placeholder")}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">{t("form.location_label")}</label>
                    {loading ? (
                        <div className="h-10 w-full rounded-md border bg-gray-100 animate-pulse" />
                    ) : (
                        <div className="space-y-2 w-11/12   ">
                            <ComboboxDemo
                                frameworks={localOptions}
                                type="Local"
                                value={selectedLocalName ?? ""}
                                    onChange={(val) => setSelectedLocalName(val)}
                                    width="w-[109%]"
                            />
                        </div>

                    )}
                </div>
                <div className="items-top flex space-x-2">
                    <Checkbox id="terms1" />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="terms1"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {t("form.block_label")}
                        </label>

                    </div>
                </div>
            </div>

            <DialogFooter className="mt-6">
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("form.processing")}
                        </>
                    ) : type === "create" ? (
                        t("form.submit_create")
                    ) : (
                        t("form.submit_update")
                    )}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default ClassForm;