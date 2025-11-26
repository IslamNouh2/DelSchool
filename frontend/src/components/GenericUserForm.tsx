"use client";

import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import StudentForm from "./forms/StudentForm";

type UserType = 'student' | 'teacher' | 'employer' | 'staff';

type UserFormProps = {
    type: "create" | "update";
    userType: UserType;
    data?: any;
    setOpen: (open: boolean) => void;
    onSuccess?: () => void;
};

const GenericUserForm: React.FC<UserFormProps> = ({
    type,
    userType,
    data,
    setOpen,
    onSuccess
}) => {
    const [error, setError] = useState<string | null>(null);

    // Render specific form if available
    const renderSpecificForm = () => {
        switch (userType) {
            case 'student':
                return (
                    <StudentForm
                        type={type}
                        data={data}
                        setOpen={setOpen}
                        onSuccess={onSuccess}
                    />
                );
            case 'teacher':
                return (
                    // <TeacherForm
                    //     type={type}
                    //     data={data}
                    //     setOpen={setOpen}
                    //     onSuccess={onSuccess}
                    // />
                );
            default:
                return (
                    <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title className="text-xl font-semibold">
                                {type === "create" 
                                    ? `Create New ${userType}` 
                                    : `Edit ${userType}`}
                            </Dialog.Title>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                                {error}
                            </div>
                        )}
                        
                        <p className="text-gray-600">
                            No custom form available for {userType}. Using generic form.
                        </p>
                        
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue={data?.name || ''}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-lamaSky focus:border-lamaSky"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    defaultValue={data?.email || ''}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-lamaSky focus:border-lamaSky"
                                />
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lamaSky hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {type === "create" ? "Create" : "Update"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            {renderSpecificForm()}
        </div>
    );
};

export default GenericUserForm;
