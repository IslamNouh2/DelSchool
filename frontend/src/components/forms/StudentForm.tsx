import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { ComboboxDemo } from "../ui/combobox";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import api from "@/lib/api";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon, Upload, X, Save, User, GraduationCap, Heart, Users, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type StudentFormProps = {
    type: "create" | "update";
    data?: any;
    relatedData?: any;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onSuccess?: (data: { studentId: number; localId: number }) => void;
};

type Local = {
    localId: number;
    name: string;
    classes?: {
        classId: number;
        ClassName: string;
    }[];
};

const StudentForm: React.FC<StudentFormProps> = ({
    type,
    data,
    relatedData,
    setOpen,
    onSuccess,
}) => {
    const [form, setForm] = useState({
        code: "",
        nom: "",
        prenom: "",
        dateNaissance: "",
        dateInscription: "",
        lieuNaissance: "",
        nationalite: "",
        genre: "",
        carteNationale: "",
        etatCivil: "",
        etatSante: "",
        groupeSanguin: "",
        identifiantScolaire: "",
        adresse: "",
        observation: "",
        classe: "",
        pereNom: "",
        pereTel: "",
        pereEmploi: "",
        pereCarte: "",
        mereNom: "",
        mereTel: "",
        mereEmploi: "",
        kafili: false,
        photo: null as File | null,
        localId: "",
        classId: "",
        academicYear: '', 
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
    const [registerDate, setRegisterDate] = useState<Date | undefined>(undefined);
    const [openBirth, setOpenBirth] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [locals, setLocals] = useState<Local[]>([]);

    useEffect(() => {
        console.log("StudentForm useEffect - type:", type, "data:", data);
        if (type === "update" && data) {
            const initialForm = {
                code: data.code || "",
                nom: data.firstName || "",
                prenom: data.lastName || "",
                dateNaissance: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : "",
                dateInscription: data.dateInscription ? new Date(data.dateInscription).toISOString() : "",
                lieuNaissance: data.lieuOfBirth || "",
                nationalite: data.nationality || "",
                genre: data.gender || "",
                groupeSanguin: data.bloodType || "",
                carteNationale: data.cid || "",
                etatCivil: data.etatCivil || "",
                etatSante: data.health || "",
                identifiantScolaire: data.numNumerisation || "",
                adresse: data.address || "",
                observation: data.observation || "",
                classe: "",
                pereNom: data.parent?.father || "",
                pereTel: data.parent?.fatherNumber || "",
                pereEmploi: data.parent?.fatherJob || "",
                pereCarte: "",
                mereNom: data.parent?.mother || "",
                mereTel: data.parent?.motherNumber || "",
                mereEmploi: data.parent?.motherJob || "",
                kafili: false,
                photo: null,
                localId: data.localId ? String(data.localId) : "",
                classId: data.classId ? String(data.classId) : "",
                academicYear: '', 
            };
            console.log("Setting form state to:", initialForm);
            setForm(initialForm);

            if (data.dateOfBirth) setBirthDate(new Date(data.dateOfBirth));
            if (data.dateInscription) setRegisterDate(new Date(data.dateInscription));
            if (data.photoUrl) setPhotoPreview(data.photoUrl);
        }
        fetchLocal();
    }, [type, data]);

    const fetchLocal = async () => {
        try {
            const res = await api.get('student/all-locals', { withCredentials: true, });
            setLocals(res.data);
        } catch (error) {
            console.error("Failed to fetch locals:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked, files } = e.target as HTMLInputElement;

        if (type === "file" && files?.[0]) {
            const file = files[0];
            if (file.size > 5 * 1024 * 1024) return;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) return;

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

    const removePhoto = () => {
        setForm((prev) => ({ ...prev, photo: null }));
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        formData.append("firstName", form.nom);
        formData.append("lastName", form.prenom);
        formData.append("dateOfBirth", form.dateNaissance);
        formData.append("gender", form.genre);
        formData.append("address", form.adresse);
        formData.append("parentId", "1");
        formData.append("code", form.code);
        formData.append("health", form.etatSante);
        formData.append("dateCreate", new Date().toISOString());
        formData.append("dateModif", new Date().toISOString());
        formData.append("lieuOfBirth", form.lieuNaissance);
        formData.append("bloodType", form.groupeSanguin);
        formData.append("etatCivil", form.etatCivil);
        formData.append("cid", form.carteNationale);
        formData.append("nationality", form.nationalite);
        formData.append("observation", form.observation);
        formData.append("numNumerisation", form.identifiantScolaire || "0001");
        formData.append("dateInscription", form.dateInscription);
        formData.append("okBlock", "false");
        formData.append("fatherName", form.pereNom);
        formData.append("fatherNumber", form.pereTel);
        formData.append("fatherJob", form.pereEmploi);
        formData.append("matherName", form.mereNom);
        formData.append("matherNumber", form.mereTel);
        formData.append("matherJob", form.mereEmploi);
        formData.append("localId", String(form.localId));
        formData.append("classId", String(form.classId));
        formData.append("academicYear", form.academicYear || "");

        if (form.photo) formData.append("photo", form.photo);

        try {
            const endpoint = type === "create" ? "/student/create" : `/student/update/${data.studentId}`;
            const method = type === "create" ? "post" : "put";
            const response = await api[method](endpoint, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            const { studentId, localId } = response.data;
            setOpen(false);
            if (onSuccess) onSuccess({ studentId, localId });
        } catch (err: any) {
            console.error("Error during form submission:", err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const localOptions = locals.map((l) => ({
        value: String(l.localId),
        label: l.name,
    }));

    const classOptions = form.localId 
        ? locals.find(l => String(l.localId) === form.localId)?.classes?.map(c => ({
            value: String(c.classId),
            label: c.ClassName
        })) || []
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative border border-gray-100"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {type === "create" ? "Add New Student" : "Edit Student Record"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {type === "create" ? "Enter the details to enroll a new student" : "Update the student's information below"}
                        </p>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Photo & Basic Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-3xl overflow-hidden bg-gray-100 border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300">
                                    {photoPreview ? (
                                        <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <Upload className="w-10 h-10 mb-2" />
                                            <span className="text-xs font-medium">Upload Photo</span>
                                        </div>
                                    )}
                                </div>
                                {photoPreview && (
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <label className="absolute inset-0 cursor-pointer">
                                    <input type="file" name="photo" accept="image/*" onChange={handleChange} className="hidden" />
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                                JPG, PNG or WebP • Max 5MB
                            </p>
                        </div>

                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem label="Student Code" required>
                                <Input name="code" value={form.code} onChange={handleChange} placeholder="e.g. STU001" required className="rounded-xl border-gray-200 focus:ring-blue-500" />
                            </FormItem>
                            <FormItem label="First Name" required>
                                <Input name="nom" value={form.nom} onChange={handleChange} placeholder="First Name" required className="rounded-xl border-gray-200" />
                            </FormItem>
                            <FormItem label="Last Name" required>
                                <Input name="prenom" value={form.prenom} onChange={handleChange} placeholder="Last Name" required className="rounded-xl border-gray-200" />
                            </FormItem>
                            <FormItem label="Gender">
                                <ComboboxDemo
                                    frameworks={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]}
                                    type="Gender"
                                    value={form.genre}
                                    onChange={(val) => setForm(prev => ({ ...prev, genre: val }))}
                                    width="w-full"
                                />
                            </FormItem>
                        </div>
                    </div>

                    {/* Personal Details Section */}
                    <Section title="Personal Details" icon={<User className="w-5 h-5 text-blue-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormItem label="Date of Birth">
                                <DatePicker value={birthDate} onChange={(date) => {
                                    setBirthDate(date);
                                    if (date) setForm(prev => ({ ...prev, dateNaissance: date.toISOString() }));
                                }} />
                            </FormItem>
                            <FormItem label="Lieu de Naissance">
                                <Input name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} placeholder="City/Country" className="rounded-xl border-gray-200" />
                            </FormItem>
                            <FormItem label="Nationality">
                                <Input name="nationalite" value={form.nationalite} onChange={handleChange} placeholder="Nationality" className="rounded-xl border-gray-200" />
                            </FormItem>
                            <FormItem label="Blood Group">
                                <ComboboxDemo
                                    frameworks={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(t => ({ value: t, label: t }))}
                                    type="Blood Type"
                                    value={form.groupeSanguin}
                                    onChange={(val) => setForm(prev => ({ ...prev, groupeSanguin: val }))}
                                    width="w-full"
                                />
                            </FormItem>
                            <FormItem label="National ID (CID)">
                                <Input name="carteNationale" value={form.carteNationale} onChange={handleChange} placeholder="ID Number" className="rounded-xl border-gray-200" />
                            </FormItem>
                            <FormItem label="Civil Status">
                                <Input name="etatCivil" value={form.etatCivil} onChange={handleChange} placeholder="Single/Married" className="rounded-xl border-gray-200" />
                            </FormItem>
                        </div>
                    </Section>

                    {/* Academic Section */}
                    <Section title="Academic & Enrollment" icon={<GraduationCap className="w-5 h-5 text-indigo-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormItem label="Enrollment Date">
                                <DatePicker value={registerDate} onChange={(date) => {
                                    setRegisterDate(date);
                                    if (date) setForm(prev => ({ ...prev, dateInscription: date.toISOString() }));
                                }} />
                            </FormItem>
                            <FormItem label="Assigned Local">
                                <ComboboxDemo
                                    frameworks={localOptions}
                                    type="Local"
                                    value={form.localId}
                                    onChange={(val) => setForm(prev => ({ ...prev, localId: val, classId: "" }))}
                                    width="w-full"
                                />
                            </FormItem>
                            <FormItem label="Assigned Class">
                                <ComboboxDemo
                                    frameworks={classOptions}
                                    type="Class"
                                    value={form.classId}
                                    onChange={(val) => setForm(prev => ({ ...prev, classId: val }))}
                                    width="w-full"
                                    disabled={!form.localId}
                                />
                            </FormItem>
                            <FormItem label="School Identifier">
                                <Input name="identifiantScolaire" value={form.identifiantScolaire} onChange={handleChange} placeholder="Numerisation Number" className="rounded-xl border-gray-200" />
                            </FormItem>
                        </div>
                    </Section>

                    {/* Health & Address Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Section title="Health Information" icon={<Heart className="w-5 h-5 text-red-500" />}>
                            <div className="space-y-4">
                                <FormItem label="Health Status">
                                    <Input name="etatSante" value={form.etatSante} onChange={handleChange} placeholder="General health notes" className="rounded-xl border-gray-200" />
                                </FormItem>
                                <FormItem label="Observations">
                                    <Textarea name="observation" value={form.observation} onChange={handleChange} placeholder="Any additional notes..." className="rounded-xl border-gray-200 min-h-[100px]" />
                                </FormItem>
                            </div>
                        </Section>

                        <Section title="Contact & Address" icon={<MapPin className="w-5 h-5 text-green-500" />}>
                            <div className="space-y-4">
                                <FormItem label="Full Address">
                                    <Textarea name="adresse" value={form.adresse} onChange={handleChange} placeholder="Street, City, Country" className="rounded-xl border-gray-200 min-h-[100px]" />
                                </FormItem>
                            </div>
                        </Section>
                    </div>

                    {/* Parent Information Section */}
                    <Section title="Parent/Guardian Information" icon={<Users className="w-5 h-5 text-orange-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wider">Father's Details</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input name="pereNom" value={form.pereNom} onChange={handleChange} placeholder="Father's Full Name" className="rounded-xl bg-white" />
                                    <Input name="pereTel" value={form.pereTel} onChange={handleChange} placeholder="Phone Number" className="rounded-xl bg-white" />
                                    <Input name="pereEmploi" value={form.pereEmploi} onChange={handleChange} placeholder="Occupation" className="rounded-xl bg-white" />
                                </div>
                            </div>
                            <div className="space-y-4 p-6 bg-pink-50/30 rounded-2xl border border-pink-100">
                                <h4 className="text-sm font-bold text-pink-700 uppercase tracking-wider">Mother's Details</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input name="mereNom" value={form.mereNom} onChange={handleChange} placeholder="Mother's Full Name" className="rounded-xl bg-white" />
                                    <Input name="mereTel" value={form.mereTel} onChange={handleChange} placeholder="Phone Number" className="rounded-xl bg-white" />
                                    <Input name="mereEmploi" value={form.mereEmploi} onChange={handleChange} placeholder="Occupation" className="rounded-xl bg-white" />
                                </div>
                            </div>
                        </div>
                    </Section>
                </form>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                        className="rounded-xl px-6 py-2.5 border-gray-200 hover:bg-white hover:shadow-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="rounded-xl px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {type === "create" ? "Create Student" : "Update Record"}
                            </div>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                {icon}
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FormItem({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
        </div>
    );
}

function DatePicker({ value, onChange }: { value?: Date; onChange: (date: Date | undefined) => void }) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal rounded-xl border-gray-200 hover:bg-gray-50">
                    {value ? value.toLocaleDateString() : <span className="text-gray-400">Select date</span>}
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-gray-100" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        onChange(date);
                        setOpen(false);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}

export default StudentForm;
