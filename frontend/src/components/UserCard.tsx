import React from "react";
import { Eye, Trash2, Edit } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

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
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-200">
            {/* Photo Section */}
            <div className="flex justify-center mb-4">
                <div className="relative">
                    {photoUrl ? (
                        <Image
                            src={photoUrl}
                            alt={`${fullName} photo`}
                            width={80}
                            height={80}
                            className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                        />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                                {displayFirstName.charAt(0)}{displayLastName.charAt(0)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-4 space-y-2">
                {/* Name */}
                <h3 className="font-semibold text-lg text-gray-800 truncate">
                    {fullName || "No Name"}
                </h3>

                {/* Code */}
                <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    Code: {code}
                </p>

                {/* Email */}
                {email && (
                    <p className="text-sm text-gray-600 truncate" title={email}>
                        {email}
                    </p>
                )}

                {/* User Type Badge */}
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${userType === "student"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                    {userType.charAt(0).toUpperCase() + userType.slice(1)}
                </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-2">
                {/* View Detail Button */}
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewDetail}
                    className="flex items-center space-x-1 hover:bg-blue-50 hover:border-blue-300"
                    title="View Details"
                >
                    <Eye size={14} />
                    <span className="hidden sm:inline">View</span>
                </Button>

                {/* Update Button */}
                {onUpdate && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleUpdate}
                        className="flex items-center space-x-1 hover:bg-yellow-50 hover:border-yellow-300"
                        title="Update"
                    >
                        <Edit size={14} />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>
                )}

                {/* Delete Button */}
                {onDelete && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDelete}
                        className="flex items-center space-x-1 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default UserCard;