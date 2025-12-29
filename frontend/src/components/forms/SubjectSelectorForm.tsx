"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
    localId: number;
    onClose: () => void;
};

type Subject = {
    subjectId: number;
    subjectName: string;
    __new?: boolean;
};

const SubjectSelectorForm: React.FC<Props> = ({ localId, onClose }) => {
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            try {
                // Fetch all available subjects (limit 1000 for now to get all)
                const allRes = await api.get("/subject?limit=1000", { withCredentials: true });
                const all = allRes.data.subjects || [];

                console.log("All subjects:", all);

                // Fetch already assigned subjects for this local
                const assignedRes = await api.get(`/subject-local/${localId}`, {
                    withCredentials: true,
                });
                const assignedRaw = assignedRes.data.subjects || [];
                const assigned = assignedRaw.map((s: any) => s.subject);

                const assignedIds = new Set(assigned.map((s: any) => s.subjectId));
                const available = all.filter((s: any) => !assignedIds.has(s.subjectId));

                setAllSubjects(available);
                setSelectedSubjects(assigned);
            } catch (err) {
                console.error("❌ Error fetching subjects", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load subjects.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [localId]);

    const moveToRight = (subject: Subject) => {
        setAllSubjects((prev) => prev.filter((s) => s.subjectId !== subject.subjectId));
        setSelectedSubjects((prev) => [...prev, { ...subject, __new: true }]);
    };

    const moveToLeft = async (subject: Subject) => {
        if (subject.__new) {
            // Not yet inserted to DB — just revert back in UI
            setSelectedSubjects((prev) =>
                prev.filter((s) => s.subjectId !== subject.subjectId)
            );
            setAllSubjects((prev) => [...prev, subject]);
        } else {
            // If it's an existing assignment, we might want to confirm or just remove it from the "to be saved" list if we were doing batch save.
            // But the current logic (from previous code) seems to imply immediate deletion for existing ones?
            // Actually, the previous code did immediate delete for existing ones.
            // Let's keep the logic consistent: if it's existing, we remove it via API immediately?
            // OR, better UX: just move it to "Available" and only commit on Save.
            // However, the previous implementation had a mix: immediate delete for existing, but batch insert for new.
            // To simplify and make it robust: let's make it fully batch-based if possible, OR keep the mixed mode but make it clear.
            // The user asked for "best UI". Best UI is usually "Make changes then Save".
            // But if the backend API for delete is single-item, we might have to do it one by one or change backend.
            // Let's stick to the previous logic to avoid breaking backend assumptions, but wrap it nicely.
            
            try {
                await api.delete(`/subject-local/${localId}/${subject.subjectId}`, {
                    withCredentials: true,
                });

                setSelectedSubjects((prev) =>
                    prev.filter((s) => s.subjectId !== subject.subjectId)
                );
                setAllSubjects((prev) => [...prev, subject]);
                toast({
                    description: "Subject removed.",
                });
            } catch (err: any) {
                console.error("❌ Remove subject error:", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to remove subject.",
                });
            }
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            // Only send the NEW ones for bulk insert
            const newSubjects = selectedSubjects.filter(s => s.__new);
            
            if (newSubjects.length > 0) {
                await api.post(
                    "/subject-local/bulk-insert",
                    {
                        localId,
                        subjectIds: newSubjects.map((s) => s.subjectId),
                    },
                    { withCredentials: true }
                );
            }

            toast({
                title: "Success!",
                description: "Subjects updated successfully.",
            });

            onClose();
        } catch (err) {
            console.error("❌ Bulk assign error:", err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save changes.",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 h-[500px]">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Manage Subjects</h2>
                <Badge variant="outline" className="text-xs">
                    {selectedSubjects.length} Selected
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Available Subjects */}
                <Card className="flex flex-col h-full border-muted">
                    <CardHeader className="p-3 border-b">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Search className="w-4 h-4" /> Available
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <Command className="h-full border-none shadow-none">
                            <CommandInput placeholder="Search subjects..." />
                            <CommandList className="h-full max-h-none overflow-y-auto p-2">
                                <CommandEmpty>No subjects found.</CommandEmpty>
                                <CommandGroup>
                                    {allSubjects.map((subject) => (
                                        <CommandItem
                                            key={subject.subjectId}
                                            value={subject.subjectName}
                                            onSelect={() => moveToRight(subject)}
                                            className="cursor-pointer flex items-center justify-between group"
                                        >
                                            <span>{subject.subjectName}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </CardContent>
                </Card>

                {/* Selected Subjects */}
                <Card className="flex flex-col h-full border-muted bg-muted/30">
                    <CardHeader className="p-3 border-b bg-background/50">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                            <Check className="w-4 h-4" /> Selected
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 flex-1 overflow-y-auto">
                        {selectedSubjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                <p>No subjects selected</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {selectedSubjects.map((subject) => (
                                    <div
                                        key={subject.subjectId}
                                        className="flex items-center justify-between p-2 rounded-md bg-background border shadow-sm group hover:border-destructive/50 transition-colors"
                                    >
                                        <span className="text-sm font-medium">{subject.subjectName}</span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => moveToLeft(subject)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default SubjectSelectorForm;
