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

export default function SubjectListPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [role, setRole] = useState<string>("guest");
    
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
            // Fetch all subjects to handle grouping on client side
            const response = await api.get("/subject", {
                params: {
                    page: 1,
                    limit: 1000, 
                },
            });
            
            const allSubjects: Subject[] = response.data.subjects;
            
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
                title: "Error loading subjects",
                description: "Could not fetch subject list."
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/subject/${id}`);
            toast({ title: "Subject deleted successfully" });
            fetchData(); // Refresh list
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error deleting subject",
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-1">Subjects</h1>
                    <p className="text-muted-foreground">Manage subjects and their hierarchy</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search subjects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                    
                    {isAdmin && (
                        <Button 
                            onClick={() => {
                                setSelectedSubject(null);
                                setIsCreateOpen(true);
                            }}
                            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all rounded-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Add Subject
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground">No subjects found.</p>
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