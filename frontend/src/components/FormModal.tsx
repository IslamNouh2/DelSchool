"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

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

// Lazy load forms
const StudentForm = dynamic(() => import("./forms/StudentForm"), { loading: () => <p>Loading...</p> });
const LocalForm = dynamic(() => import("./forms/LocalForm"), { loading: () => <p>Loading....</p> });
const ClassForm = dynamic(() => import("./forms/ClassForm"), { loading: () => <p>Loading....</p> });
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), { loading: () => <p>Loading....</p> });

type FormModalProps = {
    table: "student" | "local" | "class" | "subject" | "employer";
    type: "create" | "update";
    data?: any;
    relatedData?: any;
    onSuccess?: () => void;
    children?: React.ReactNode;
    enable?: boolean;
    director?: string;
};

const FormModal: React.FC<FormModalProps> = ({
    table,
    type,
    data,
    relatedData,
    onSuccess,
    children,
    enable = true,
    director,
}) => {
    const [open, setOpen] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    const renderForm = () => {
        switch (table) {
            case "student":
                return <StudentForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} onSuccess={onSuccess} />;
            case "local":
                return <LocalForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} onSuccess={onSuccess} />;
            case "class":
                return <ClassForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} onSuccess={onSuccess} />;
            case "subject":
                return <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} onSuccess={onSuccess} />;
            case "employer":
                return <SubjectForm type={type} data={data} setOpen={setOpen} relatedData={relatedData} onSuccess={onSuccess} />;
            default:
                return <p>Form not found</p>;
        }
    };

    const handleClick = () => {
        if (!enable) {
            setShowDialog(true);
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            {children ? (
                <div onClick={handleClick}>
                    {children}
                </div>
            ) : (
                <button
                    className={`${type === "create" ? "w-8 h-8" : "w-7 h-7"} flex items-center justify-center rounded-full ${type === "create" ? "bg-lamaYellow" : "bg-lamaSky"}`}
                    onClick={handleClick}
                >
                    <Image
                        src={type === "create" ? "/plus.png" : "/update.png"}
                        alt={type}
                        width={16}
                        height={16}
                    />
                </button>
            )}

            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[50%]">
                        {renderForm()}
                        <div
                            className="absolute top-4 right-4 cursor-pointer"
                            onClick={() => setOpen(false)}
                        >
                            <Image src="/close.png" alt="close" width={14} height={14} />
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>⚠️ Cannot create {table}</AlertDialogTitle>
                        <AlertDialogDescription>
                            You must first meet prerequisites before creating a {table}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Ok</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowDialog(false);
                                window.location.href = director!;
                            }}
                        >
                            Create
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default FormModal;
