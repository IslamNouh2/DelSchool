"use client";

import { useParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { role } from "@/lib/data";
import StudentForm from "./forms/StudentForm";
import api from "@/lib/api";
import { Button } from "./ui/button";

type UserCardProps = {
    studentId: number;
    firstName: string;
    lastName: string;
    email?: string;
    photoUrl?: string | null;
    onDelete?: () => void;
};

const CardList: React.FC<UserCardProps> = ({
    studentId,
    firstName,
    lastName,
    email,
    photoUrl,
    onDelete
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [studentData, setStudentData] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const getPhotoSrc = () => {
        if (photoUrl && typeof photoUrl === "string" && photoUrl.trim() !== "") {
            if (photoUrl.startsWith("http") || photoUrl.startsWith("/api/") || photoUrl.startsWith("data:image/")) {
                return photoUrl;
            }
            return `/api/student/photo/${photoUrl}`;
        }
        return "/avatar.png";
    };

    const handleUpdateClick = async () => {
        setIsLoadingData(true);
        try {
            const response = await api.get(`/student/${studentId}`, {
                withCredentials: true,
            });

            const student = response.data;
            if (student) {
                setStudentData({
                    ...student,
                    photoUrl: student.photoFileName
                        ? `/api/student/photo/${student.photoFileName}`
                        : null
                });
                setShowUpdateForm(true);
            }
        } catch (error) {
            console.error("Failed to fetch student data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${firstName} ${lastName}?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/student/delete/${studentId}`, {
                withCredentials: true,
            });
            if (onDelete) onDelete();
        } catch (error) {
            console.error("Failed to delete student:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="rounded-2xl shadow-md bg-card p-4 hover:shadow-lg transition duration-200 space-y-3">
                {/* Card content remains the same */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                        <img
                            src={getPhotoSrc()}
                            alt={`${firstName} ${lastName}`}
                            width={80}
                            height={80}
                            className="w-[80px] h-[80px] rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/avatar.png";
                            }}
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800 truncate max-w-[200px]">
                            {firstName} {lastName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate max-w-[150px]">
                            {email || 'No email provided'}
                        </p>
                        <p className="text-xs text-gray-400">
                            ID: {   }
                        </p>
                    </div>
                </div>

                <div className="flex flex-row justify-center items-center space-x-4">
                    <Link href={`/list/students/${studentId}`}>
                        <Button
                            type="button"
                            className="flex items-center justify-center w-8 h-8 bg-lamaSky hover:bg-blue-600 rounded-full transition-colors duration-200"
                            title="View student details"
                        >
                            <Image src="/view.png" alt="view" width={20} height={20} />
                        </Button>
                    </Link>

                    {role === "admin" && (
                        <>
                            <button
                                type="button"
                                onClick={handleUpdateClick}
                                disabled={isLoadingData}
                                className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200 disabled:opacity-50"
                                title="Edit student"
                            >
                                {isLoadingData ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Image src="/update.png" alt="edit" width={16} height={16} />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center justify-center w-8 h-8 bg-lamaPurple hover:bg-purple-600 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete student"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Image src="/delete-white.png" alt="delete" width={16} height={16} />
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showUpdateForm && studentData && (
                <StudentForm
                    type="update"
                    data={studentData}
                    setOpen={setShowUpdateForm}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
};

export default CardList;
