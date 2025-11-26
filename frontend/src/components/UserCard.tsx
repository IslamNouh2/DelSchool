import React from "react";
import { Eye, Trash2, Edit } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

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

    const handleDelete = () => {
        if (onDelete) {
            // You might want to show a confirmation dialog here
            const confirmed = window.confirm(
                `Are you sure you want to delete this ${userType}?`
            );
            if (confirmed) {
                onDelete(id);
            }
        }
    };

    const handleUpdate = () => {
        if (onUpdate) {
            onUpdate(id);
        }
    };

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4">
                {/* Photo Section */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        {photoUrl ? (
                            <Image
                                src={photoUrl}
                                alt={`${fullName} photo`}
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-full object-cover border-2 border-border"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                                <span className="text-muted-foreground text-sm font-medium">
                                    {displayFirstName.charAt(0)}{displayLastName.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Info */}
                <div className="text-center mb-4 space-y-2">
                    {/* Name */}
                    <h3 className="font-semibold text-lg truncate">
                        {fullName || "No Name"}
                    </h3>

                    {/* Code */}
                    <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        Code: {code}
                    </p>

                    {/* Email */}
                    {email && (
                        <p className="text-sm text-muted-foreground truncate" title={email}>
                            {email}
                        </p>
                    )}

                    {/* User Type Badge */}
                    <Badge variant={userType === "student" ? "default" : "secondary"}>
                        {userType.charAt(0).toUpperCase() + userType.slice(1)}
                    </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-2">
                    {/* View Detail Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleViewDetail}
                        title="View Details"
                    >
                        <Eye size={14} className="mr-1" />
                        <span className="hidden sm:inline">View</span>
                    </Button>

                    {/* Update Button */}
                    {onUpdate && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleUpdate}
                            title="Update"
                        >
                            <Edit size={14} className="mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                    )}

                    {/* Delete Button */}
                    {onDelete && (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDelete}
                            title="Delete"
                        >
                            <Trash2 size={14} className="mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default UserCard;