"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, Edit, Trash2, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncStatusBadge } from "@/components/pwa/SyncStatusBadge";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export interface Subject {
    subjectId: number;
    subjectName: string;
    totalGrads: number;
    parentId: number;
    okBlock?: boolean;
    parentName: string;
    pending?: boolean; // Added for sync status
    children?: Subject[]; // For grouped data
}

interface SubjectCardProps {
    subject: Subject;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAddSubSubject?: (parentId: number) => void;
    role: string;
    index: number;
}

// Helper to get color based on index or id to match the colorful design
const getSubjectColor = (index: number) => {
    const colors = [
        { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
        { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
        { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
        { bg: "bg-orange-50 dark:bg-orange-900/20", icon: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" },
        { bg: "bg-pink-50 dark:bg-pink-900/20", icon: "text-pink-600 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800" },
    ];
    return colors[index % colors.length];
};

export default function SubjectCard({ subject, onEdit, onDelete, onAddSubSubject, role, index }: SubjectCardProps) {
    const t = useTranslations("subjects.card");
    const [isExpanded, setIsExpanded] = useState(false);
    const theme = getSubjectColor(index);
    const hasChildren = subject.children && subject.children.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all duration-300"
        >
            <div
                className="w-full p-5 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                {/* Icon Box */}
                <div className={`p-3 rounded-xl ${theme.bg}`}>
                    <BookOpen className={`w-6 h-6 ${theme.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1 text-start">
                    <div className="flex items-center gap-2">
                        <h2 className="text-foreground font-semibold text-lg">{subject.subjectName}</h2>
                        {(subject as any).pending && (
                            <SyncStatusBadge id={subject.subjectId} isPending={true} />
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        {hasChildren ? (
                            <span>{t("sub_subjects", { count: subject.children?.length ?? 0 })}</span>
                        ) : (
                            <span>{t("no_sub_subjects")}</span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span>{t("points", { count: subject.totalGrads ?? 0 })}</span>
                    </div>
                </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <PermissionGuard permissions={['subject:create']}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                onClick={() => onAddSubSubject?.(subject.subjectId)}
                                title={t("add_sub_subject")}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </PermissionGuard>

                        <PermissionGuard permissions={['subject:update']}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                onClick={() => onEdit(subject.subjectId)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                        </PermissionGuard>
                        
                        <PermissionGuard permissions={['subject:delete']}>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t("delete_title")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t("delete_description", { name: subject.subjectName })}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t("cancel", { defaultValue: "Cancel" })}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(subject.subjectId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            {t("delete", { defaultValue: "Delete" })}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </PermissionGuard>
                        
                        {hasChildren && (
                            <ChevronRight 
                                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                            />
                        )}
                    </div>
                </div>

            {/* Expanded Sub-subjects (Recursive) */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-muted/10"
                    >
                        <div className="p-4 ps-8 flex flex-col gap-3">
                            {subject.children?.map((child, i) => (
                                <SubjectCard
                                    key={child.subjectId}
                                    subject={child}
                                    index={i}
                                    role={role}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onAddSubSubject={onAddSubSubject}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
