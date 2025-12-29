"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, Edit, Trash2, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface Subject {
    subjectId: number;
    subjectName: string;
    totalGrads: number;
    parentId: number;
    okBlock?: boolean;
    parentName: string;
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
    const [isExpanded, setIsExpanded] = useState(false);
    const theme = getSubjectColor(index);
    const hasChildren = subject.children && subject.children.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
        >
            <div
                className="w-full p-6 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                {/* Icon Box */}
                <div className={`p-3 rounded-xl ${theme.bg}`}>
                    <BookOpen className={`w-6 h-6 ${theme.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                    <h2 className="text-foreground font-semibold text-lg mb-1">{subject.subjectName}</h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {hasChildren ? (
                            <span>{subject.children?.length} Sub-subjects</span>
                        ) : (
                            <span>No Sub-subjects</span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span>{subject.totalGrads} Grads</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {role.toLowerCase() === "admin" && (
                        <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                onClick={() => onAddSubSubject?.(subject.subjectId)}
                                title="Add Sub-subject"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => onEdit(subject.subjectId)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete "{subject.subjectName}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(subject.subjectId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}

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
                        <div className="p-4 pl-8 flex flex-col gap-3">
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
