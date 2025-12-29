"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronDown, Folder, FileText, Edit, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Compte {
    id: number;
    name: string;
    parentId: number;
    children?: Compte[];
    okBlock: boolean;
}

interface CompteTreeProps {
    comptes: Compte[];
    onEdit: (compte: Compte) => void;
    onDelete: (id: number) => void;
    onAddSub: (parentId: number) => void;
}

const CompteNode = ({ 
    node, 
    level, 
    onEdit, 
    onDelete, 
    onAddSub 
}: { 
    node: Compte; 
    level: number;
    onEdit: (compte: Compte) => void;
    onDelete: (id: number) => void;
    onAddSub: (parentId: number) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div 
                className={`flex items-center group py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors ${node.okBlock ? 'opacity-50' : ''}`}
                style={{ paddingLeft: `${level * 1.5}rem` }}
            >
                <div className="flex items-center flex-1 gap-2">
                    {hasChildren ? (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                        </button>
                    ) : (
                        <div className="w-5" />
                    )}
                    
                    {hasChildren ? (
                        <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                    ) : (
                        <FileText className="w-4 h-4 text-gray-400" />
                    )}
                    
                    <span className="text-sm font-medium text-foreground">
                        {node.name}
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onAddSub(node.id)}
                    >
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEdit(node)}
                    >
                        <Edit className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onDelete(node.id)}
                    >
                        <Trash className="w-3.5 h-3.5 text-red-600" />
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-2 border-l border-border/50">
                            {node.children!.map((child) => (
                                <CompteNode 
                                    key={child.id} 
                                    node={child} 
                                    level={level + 1}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onAddSub={onAddSub}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function CompteTree({ comptes, onEdit, onDelete, onAddSub }: CompteTreeProps) {
    return (
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
            <div className="space-y-1">
                {comptes.map((compte) => (
                    <CompteNode 
                        key={compte.id} 
                        node={compte} 
                        level={0}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onAddSub={onAddSub}
                    />
                ))}
            </div>
        </div>
    );
}
