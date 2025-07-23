"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CalendarIcon, ChevronDownIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ComboboxDemo } from "@/components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import api from "@/lib/api";
import { toast } from "sonner";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";

interface EmployerDialogProps {
    type?: "create" | "update";
    data?: any;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideButton?: boolean;
}

function formatDate(date: Date | undefined) {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function isValidDate(date: Date | undefined) {
    if (!date) return false;
    return !isNaN(date.getTime());
}

export default function EmployerDialog({
    type = "create",
    data,
    onSuccess,
    open,
    onOpenChange,
    hideButton = false,
}: EmployerDialogProps) {
    const [form, setForm] = useState({
        code: "",
        firstName: "",
        lastName: "",
        dateNaissance: "",
        dateInscription: "",
        lieuNaissance: "",
        nationality: "",
        gender: "",
        carteNationale: "",
        etatCivil: "",
        etatSante: "",
        groupeSanguin: "",
        identifiantScolaire: "",
        address: "",
        observation: "",
        pereNom: "",
        mereNom: "",
        phone: "",
        type: "",
        okBlock: false,
        photo: null as File | null,
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
    const [registerDate, setRegisterDate] = useState<Date | undefined>(undefined);
    const [openBirth, setOpenBirth] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (type === "update" && data) {
            setForm({   
                code: data.code || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                dateNaissance: data.dateOfBirth || "",
                dateInscription: data.dateInscription || "",
                lieuNaissance: data.lieuOfBirth || "",
                nationality: data.nationality || "",
                gender: data.gender || "",
                carteNationale: data.cid || "",
                etatCivil: data.etatCivil || "",
                etatSante: data.health || "",
                groupeSanguin: data.bloodType || "",
                identifiantScolaire: data.numNumerisation || "",
                address: data.address || "",
                observation: data.observation || "",
                pereNom: data.fatherName || "",
                mereNom: data.motherName || "",
                phone: data.phone || "",
                type: data.type || "",
                okBlock: data?.okBlock ?? false,
                photo: null,
            });
            setBirthDate(data.dateOfBirth ? new Date(data.dateOfBirth) : undefined);
            setRegisterDate(data.dateInscription ? new Date(data.dateInscription) : undefined);
            if (data.photoFileName) {
                setPhotoPreview(`http://localhost:47005/employer/photo/${data.photoFileName}`);
            }
        } else if (type === "create") {
            // Reset form for create
            setForm({
                code: "",
                firstName: "",
                lastName: "",
                dateNaissance: "",
                dateInscription: "",
                lieuNaissance: "",
                nationality: "",
                gender: "",
                carteNationale: "",
                etatCivil: "",
                etatSante: "",
                groupeSanguin: "",
                identifiantScolaire: "",
                address: "",
                observation: "",
                pereNom: "",
                mereNom: "",
                phone: "",
                type: "",
                okBlock: false,
                photo: null,
            });
            setBirthDate(undefined);
            setRegisterDate(undefined);
            setPhotoPreview(null);
        }
    }, [type, data]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked, files } = e.target as HTMLInputElement;
        if (type === "file" && files?.[0]) {
            const file = files[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should be less than 5MB");
                return;
            }
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                toast.error("Only JPEG, PNG, and WebP images are allowed");
                return;
            }
            setForm((prev) => ({ ...prev, [name]: file }));
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();

            formData.append("code", form.code);
            formData.append("firstName", form.firstName);
            formData.append("lastName", form.lastName);
            if (birthDate) formData.append("dateOfBirth", birthDate.toISOString());
            if (registerDate) formData.append("dateInscription", registerDate.toISOString());
            formData.append("lieuOfBirth", form.lieuNaissance);
            formData.append("nationality", form.nationality);
            formData.append("gender", form.gender);
            formData.append("cid", form.carteNationale);
            formData.append("etatCivil", form.etatCivil);
            formData.append("health", form.etatSante);
            formData.append("bloodType", form.groupeSanguin);
            formData.append("numNumerisation", form.identifiantScolaire);
            formData.append("address", form.address);
            formData.append("observation", form.observation);
            formData.append("fatherName", form.pereNom);
            formData.append("motherName", form.mereNom);
            formData.append("phone", form.phone);
            formData.append("type", form.type);

            // ✅ Serialize boolean correctly
            formData.append("okBlock", JSON.stringify(form.okBlock));

            // ✅ Append photo
            if (form.photo) {
                formData.append("photo", form.photo);
            }

            const endpoint = type === "create"
                ? "/employer/create"
                : `/employer/${data?.employerId}`;
            const method = type === "create" ? "post" : "put";

            await api[method](endpoint, formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("Submitted okBlock:", form.okBlock);

            toast.success(type === "create" ? "Employer created successfully!" : "Employer updated successfully!");
            if (onSuccess) onSuccess();
            if (onOpenChange) onOpenChange(false);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "An error occurred";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };
    

    const removePhoto = () => {
        setForm((prev) => ({ ...prev, photo: null }));
        setPhotoPreview(null);
        const fileInput = document.querySelector('input[name="photo"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const GenderFrameworks = [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
    ];

    const BloodTypeFrameworks = [
        { value: "A+", label: "A+" },
        { value: "A-", label: "A-" },
        { value: "B+", label: "B+" },
        { value: "B-", label: "B-" },
        { value: "O+", label: "O+" },
        { value: "O-", label: "O-" },
        { value: "AB+", label: "AB+" },
        { value: "AB-", label: "AB-" },
    ];

    const TypeFrameworks = [
        { value: "Admin", label: "Admin" },
        { value: "Teacher", label: "Teacher" },
        { value: "Employer", label: "Employer" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
            {!hideButton && (
                <DialogTrigger asChild>
                    <Button>
                        <Upload className="w-4 h-4 mr-2" />
                        Add Employer
                    </Button>
                </DialogTrigger>
            )}
            {open && (
                <div className="fixed inset-0 z-40 backdrop-blur-sm bg-black/30 transition-opacity" />
            )}
            <DialogContent
                className="z-50 max-w-4xl overflow-y-auto max-h-screen"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>{type === "create" ? "Add" : "Update"} Employer</DialogTitle>
                        <DialogDescription>Enter employer information</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center space-y-1">
                        <div className="relative">
                            {photoPreview ? (
                                <div className="relative">
                                    <Image
                                        src={photoPreview}
                                        alt="Preview"
                                        width={96}
                                        height={96}
                                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        disabled={isLoading}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                        </div>

                        <Input
                            type="file"
                            name="photo"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleChange}
                            className="w-full max-w-sm"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">
                            Max 5MB. Formats: JPEG, PNG, WebP
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div>
                            <Label>Code<span className="text-red-600">*</span></Label>
                            <Input
                                name="code"
                                value={form.code}
                                onChange={handleChange}
                                placeholder="Code *"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>First Name<span className="text-red-600">*</span></Label>
                            <Input
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="First Name"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label>Last Name<span className="text-red-600">*</span></Label>
                            <Input
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Last Name"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="dateNaissance" className="px-1">
                                Date of Birth
                            </Label>
                            <Popover open={openBirth} onOpenChange={setOpenBirth}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal" disabled={isLoading}>
                                        {birthDate ? birthDate.toLocaleDateString() : "Select date"}
                                        <ChevronDownIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="z-[1000] w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={birthDate}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setBirthDate(date);
                                            setOpenBirth(false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Registration Date */}
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="dateInscription" className="px-1">
                                Registration Date
                            </Label>
                            <Popover open={openRegister} onOpenChange={setOpenRegister}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal" disabled={isLoading}>
                                        {registerDate ? registerDate.toLocaleDateString() : "Select date"}
                                        <ChevronDownIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="z-[1000] w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={registerDate}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setRegisterDate(date);
                                            setOpenRegister(false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label>Place of Birth</Label>
                            <Input
                                name="lieuNaissance"
                                value={form.lieuNaissance}
                                onChange={handleChange}
                                placeholder="Place of Birth"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Nationality<span className="text-red-600">*</span></Label>
                            <Input
                                name="nationality"
                                value={form.nationality}
                                onChange={handleChange}
                                placeholder="Nationality"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Gender<span className="text-red-600">*</span></Label>
                            <ComboboxDemo
                                frameworks={GenderFrameworks}
                                type="Gender"
                                value={form.gender}
                                onChange={(val) => setForm((prev) => ({ ...prev, gender: val }))}
                                width="w-full"
                            />
                        </div>
                        <div>
                            <Label>Phone<span className="text-red-600">*</span></Label>
                            <Input
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Phone"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>National ID<span className="text-red-600">*</span></Label>
                            <Input
                                name="carteNationale"
                                value={form.carteNationale}
                                onChange={handleChange}
                                placeholder="National ID"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Marital Status<span className="text-red-600">*</span></Label>
                            <Input
                                name="etatCivil"
                                value={form.etatCivil}
                                onChange={handleChange}
                                placeholder="Marital Status"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Health Status<span className="text-red-600">*</span></Label>
                            <Input
                                name="etatSante"
                                value={form.etatSante}
                                onChange={handleChange}
                                placeholder="Health Status"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Blood Type<span className="text-red-600">*</span></Label>
                            <ComboboxDemo
                                frameworks={BloodTypeFrameworks}
                                type="Blood Type"
                                value={form.groupeSanguin}
                                onChange={(val) => setForm((prev) => ({ ...prev, groupeSanguin: val }))}
                                width="w-full"
                            />
                        </div>
                        <div>
                            <Label>Address<span className="text-red-600">*</span></Label>
                            <Input
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Address"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Type<span className="text-red-600">*</span></Label>
                            <ComboboxDemo
                                frameworks={TypeFrameworks}
                                type="Type"
                                value={form.type}
                                onChange={(val) => setForm((prev) => ({ ...prev, type: val }))}
                                width="w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="w-full">
                            <Label className="text-lg font-semibold mb-1">Additional Information</Label>
                            <Separator />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 py-3">
                            <div>
                                <Label>Mother's Name</Label>
                                <Input
                                    name="mereNom"
                                    value={form.mereNom}
                                    onChange={handleChange}
                                    placeholder="Mother's Name"
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <Label>Father's Name</Label>
                                <Input
                                    name="pereNom"
                                    value={form.pereNom}
                                    onChange={handleChange}
                                    placeholder="Father's Name"
                                    disabled={isLoading}
                                />
                            </div>
                            {type === "update" && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <Checkbox
                                        id="okBlock"
                                        checked={form.okBlock}
                                        onCheckedChange={(val) => setForm({ ...form, okBlock: val === true })}
                                        disabled={isLoading}
                                    />
                                    <Label htmlFor="okBlock">Block</Label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Label>Address</Label>
                            <Input
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label>Observations</Label>
                            <Textarea
                                name="observation"
                                value={form.observation}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (onOpenChange) onOpenChange(false);
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Loading..." : "Submit"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}