import React from "react";
import { Eye, Trash2, Edit, Mail, Hash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

type UserCardProps = {
    // Common fields for both student and teacher
    id: number;
    code: string;
    firstName?: string;
    lastName?: string;
    nom?: string; // Alternative naming
    prenom?: string; // Alternative naming
    email?: string;
    photoUrl?: string;

    // Card configuration
    userType: "student" | "teacher";

    // Action handlers
    onDelete?: (id: number) => void;
    onUpdate?: (id: number) => void;

    // Optional: custom route override
    detailRoute?: string;
};

const UserCard: React.FC<UserCardProps> = ({
    id,
    code,
    firstName,
    lastName,
    nom,
    prenom,
    email,
    photoUrl,
    userType,
    onDelete,
    onUpdate,
    detailRoute,
}) => {
    const router = useRouter();

    // Handle different naming conventions
    const displayFirstName = firstName || nom || "";
    const displayLastName = lastName || prenom || "";
    const fullName = `${displayFirstName} ${displayLastName}`.trim();

    // Default route based on user type
    const defaultRoute = userType === "student" ? `/student/${id}` : `/teacher/${id}`;
    const viewRoute = detailRoute || defaultRoute;

    const handleViewDetail = () => {
        router.push(viewRoute);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            const confirmed = window.confirm(
                `Êtes-vous sûr de vouloir supprimer ce ${userType === "student" ? "étudiant" : "enseignant"}?`
            );
            if (confirmed) {
                onDelete(id);
            }
        }
    };

    const handleUpdate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onUpdate) {
            onUpdate(id);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <Card
                className="h-full overflow-hidden border-none shadow-sm hover:shadow-xl dark:shadow-2xl dark:shadow-black/20 transition-all duration-300 bg-white dark:bg-[#1a1c2e] group cursor-pointer"
                onClick={handleViewDetail}
            >
                <CardContent className="p-0">
                    {/* Top Decorative Banner */}
                    <div className={`h-20 w-full ${userType === "student" ? "bg-gradient-to-r from-blue-500 to-indigo-600" : "bg-gradient-to-r from-purple-500 to-pink-600"} opacity-90 group-hover:opacity-100 transition-opacity`} />

                    <div className="px-6 pb-6 -mt-10">
                        {/* Photo Section */}
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-2xl overflow-hidden border-4 border-white dark:border-[#1a1c2e] shadow-lg bg-white dark:bg-[#0b0d17]">
                                    {photoUrl ? (
                                        <Image
                                            src={photoUrl}
                                            alt={`${fullName} photo`}
                                            width={96}
                                            height={96}
                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className={`h-full w-full flex items-center justify-center ${userType === "student" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                                            <span className="text-2xl font-bold">
                                                {displayFirstName.charAt(0)}{displayLastName.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Badge
                                    className={`absolute -bottom-2 -right-2 px-3 py-1 border-2 border-white dark:border-[#1a1c2e] shadow-sm ${userType === "student" ? "bg-blue-500 hover:bg-blue-600" : "bg-purple-500 hover:bg-purple-600"}`}
                                >
                                    {userType === "student" ? "Étudiant" : "Enseignant"}
                                </Badge>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="text-center space-y-3">
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {fullName || "Sans Nom"}
                            </h3>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#0b0d17]/50 py-1.5 px-3 rounded-xl border border-gray-100 dark:border-white/5 transition-colors">
                                    <Hash size={14} className="text-gray-400 dark:text-gray-500" />
                                    <span className="font-mono font-medium">{code}</span>
                                </div>

                                {email && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 truncate px-2" title={email}>
                                        <Mail size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                                        <span className="truncate">{email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-2 mt-6 pt-6 border-t border-gray-50 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all"
                                onClick={(e) => { e.stopPropagation(); handleViewDetail(); }}
                            >
                                <Eye size={16} className="mr-2" />
                                Détails
                            </Button>

                            {onUpdate && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-500/30 transition-all"
                                    onClick={handleUpdate}
                                >
                                    <Edit size={16} className="mr-2" />
                                    Modifier
                                </Button>
                            )}

                            {onDelete && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/30 transition-all"
                                    onClick={handleDelete}
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Supprimer
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default UserCard;