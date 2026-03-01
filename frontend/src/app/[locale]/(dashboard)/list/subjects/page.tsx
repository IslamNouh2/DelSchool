"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import SubjectCard, { Subject } from "./components/SubjectCard";
import { fetchUser } from "@/lib/getRoleFromToken";
import SubjectForm from "@/components/forms/SubjectForm";
import { useSocket } from "@/providers/SocketProvider";
import { useTranslations } from "next-intl";
import { OfflineDB, SyncRecord } from "@/lib/db";
import Cookies from "js-cookie";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export default function SubjectListPage() {
    const t = useTranslations("subjects");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [role, setRole] = useState<string>("guest");
    const [syncQueue, setSyncQueue] = useState<SyncRecord[]>([]);
    const { refreshKey } = useSocket();
    const tenantId = Cookies.get("tenantId") as string;

    
    // Dialog states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const user = await fetchUser();
            setRole(user?.role || "guest");
        };
        loadUser();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [response, queue] = await Promise.all([
                api.get("/subject", {
                    params: {
                        page: 1,
                        limit: 1000, 
                    },
                }),
                OfflineDB.getSyncQueue(tenantId)
            ]);
            
            setSyncQueue(queue);
            let allSubjects: Subject[] = response.data.subjects || [];

            // 1. Merge pending updates (PATCH /subject/:id)
            const pendingUpdates = queue.filter(q => q.url.includes('/subject/') && q.method === 'PATCH');
            allSubjects = allSubjects.map(s => {
                const update = pendingUpdates.find(q => q.url.endsWith(`/subject/${s.subjectId}`));
                if (update) {
                    return {
                        ...s,
                        subjectName: update.data.subjectName,
                        totalGrads: update.data.totalGrads,
                        okBlock: update.data.okBlock,
                        pending: true
                    };
                }
                return s;
            });

            // 2. Merge pending creations (POST /subject/createSub)
            const pendingCreations = queue.filter(q => q.url.endsWith('/subject/createSub') && q.method === 'POST');
            pendingCreations.forEach(q => {
                const newSub: Subject = {
                    subjectId: (q as any).id || Date.now(), // Use record ID if available, otherwise fallback
                    subjectName: q.data.subjectName,
                    totalGrads: q.data.totalGrads,
                    parentId: q.data.parentId,
                    okBlock: q.data.okBlock,
                    parentName: "...", // Unknown until sync
                    pending: true,
                    children: []
                };
                allSubjects.push(newSub);
            });
            
            
            // Build tree structure
            const subjectMap = new Map<number, Subject>();
            
            // Initialize map with all subjects and empty children array
            allSubjects.forEach(s => {
                subjectMap.set(s.subjectId, { ...s, children: [] });
            });

            const rootSubjects: Subject[] = [];

            allSubjects.forEach(s => {
                const subject = subjectMap.get(s.subjectId)!;
                // Check for root: parentId is -1, 0, null, or undefined
                if (!s.parentId || s.parentId === 0 || s.parentId === -1) {
                    rootSubjects.push(subject);
                } else {
                    const parent = subjectMap.get(s.parentId);
                    if (parent) {
                        parent.children!.push(subject);
                    } else {
                        // If parent not found in current set, treat as root (safety fallback)
                        rootSubjects.push(subject);
                    }
                }
            });

            setSubjects(rootSubjects);
        } catch (error) {
            console.error("Error fetching subjects:", error);
            toast({
                variant: "destructive",
                title: t("load_error"),
                description: "Could not fetch subject list."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshKey]);

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/subject/${id}`);
            toast({ title: t("delete_success") });
            fetchData(); // Refresh list
        } catch (error) {
            toast({
                variant: "destructive",
                title: t("delete_error"),
                description: "Please try again."
            });
        }
    };

    const handleEdit = (id: number) => {
        // Find subject in flat list (need to flatten or search tree)
        const findSubject = (list: Subject[]): Subject | undefined => {
            for (const s of list) {
                if (s.subjectId === id) return s;
                if (s.children) {
                    const found = findSubject(s.children);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const subject = findSubject(subjects);
        if (subject) {
            setSelectedSubject(subject);
            setIsEditOpen(true);
        }
    };

    const handleAddSubSubject = (parentId: number) => {
        setSelectedSubject({ parentId });
        setIsCreateOpen(true);
    };

    const handleCreateOpen = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) setSelectedSubject(null);
    };

    // Filter subjects based on search
    const filteredSubjects = subjects.filter(s => 
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.children?.some(c => c.subjectName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isAdmin = role.toLowerCase() === "admin";

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {t("title")}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t("subtitle")}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <Input 
                            placeholder={t("search_placeholder")} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full ps-10 pe-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all shadow-sm"
                        />
                    </div>
                    
                    <PermissionGuard permissions={['subject:create']}>
                        <Button 
                            onClick={() => {
                                setSelectedSubject(null);
                                setIsCreateOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 border-none"
                        >
                            <Plus className="w-5 h-5" />
                            <span>{t("add_subject")}</span>
                        </Button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground">{t("no_subjects")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSubjects.map((subject, index) => (
                        <SubjectCard 
                            key={subject.subjectId} 
                            subject={subject} 
                            index={index}
                            role={role}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onAddSubSubject={handleAddSubSubject}
                        />
                    ))}
                </div>
            )}

            {/* Dialogs */}
            <SubjectForm 
                type="create" 
                open={isCreateOpen} 
                onOpenChange={handleCreateOpen} 
                onSuccess={fetchData} 
                hideButton={true}
                data={selectedSubject}
            />
            
            {selectedSubject && isEditOpen && (
                <SubjectForm 
                    type="update" 
                    data={selectedSubject}
                    open={isEditOpen} 
                    onOpenChange={setIsEditOpen} 
                    onSuccess={fetchData} 
                    hideButton={true}
                />
            )}
        </div>
    );
}