import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { ComboboxDemo } from "../ui/combobox";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { api } from "@/lib/api";
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
import { useTranslations } from "next-intl";
import { useTranslateError } from "@/hooks/useTranslateError";
import { toast } from "sonner";

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
    const t = useTranslations("students");
    const actionsT = useTranslations("actions");
    const { translateError } = useTranslateError();

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
        email: "",
        phone: "",
    });

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
    const [registerDate, setRegisterDate] = useState<Date | undefined>(undefined);
    const [openBirth, setOpenBirth] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [locals, setLocals] = useState<Local[]>([]);

    useEffect(() => {
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
                etatCivil: data.civilStatus || "",
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
                email: data.email || "",
                phone: data.phone || "",
            };
            setForm(initialForm);

            if (data.dateOfBirth) setBirthDate(new Date(data.dateOfBirth));
            if (data.dateInscription) setRegisterDate(new Date(data.dateInscription));
            if (data.photoUrl) setPhotoPreview(`http://localhost:47005${data.photoUrl}`);
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

            setForm((prev) => ({ ...prev, photo: file }));
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
        
        if (!form.dateNaissance) {
            toast.error(t("messages.dob_required"));
            return;
        }
        if (!form.localId) {
            toast.error(t("messages.local_required"));
            return;
        }

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
        formData.append("motherName", form.mereNom);
        formData.append("motherNumber", form.mereTel);
        formData.append("motherJob", form.mereEmploi);
        formData.append("localId", String(form.localId));
        if (form.classId) formData.append("classId", String(form.classId));
        formData.append("academicYear", form.academicYear || "");
        formData.append("email", form.email);
        formData.append("phone", form.phone);

        if (form.photo) formData.append("photo", form.photo);

        try {
            if (!navigator.onLine) {
                const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';
                const pendingData = {
                    firstName: form.nom,
                    lastName: form.prenom,
                    dateOfBirth: form.dateNaissance,
                    gender: form.genre,
                    address: form.adresse,
                    code: form.code,
                    health: form.etatSante,
                    lieuOfBirth: form.lieuNaissance,
                    bloodType: form.groupeSanguin,
                    etatCivil: form.etatCivil,
                    cid: form.carteNationale,
                    nationality: form.nationalite,
                    observation: form.observation,
                    numNumerisation: form.identifiantScolaire || "0001",
                    dateInscription: form.dateInscription,
                    fatherName: form.pereNom,
                    fatherNumber: form.pereTel,
                    fatherJob: form.pereEmploi,
                    motherName: form.mereNom,
                    motherNumber: form.mereTel,
                    motherJob: form.mereEmploi,
                    localId: Number(form.localId),
                    classId: form.classId ? Number(form.classId) : undefined,
                    email: form.email,
                    phone: form.phone,
                };

                const { OfflineDB } = await import("@/lib/db");
                await OfflineDB.addToSyncQueue({
                    operationId: crypto.randomUUID(),
                    url: type === "create" ? "/student/create" : `/student/update/${data.studentId}`,
                    type: type === "create" ? "CREATE" : "UPDATE",
                    entity: "student",
                    data: pendingData,
                    timestamp: Date.now(),
                    tenantId,
                });

                toast.warning(t("messages.offline_save") || "Offline: Student saved locally and will sync when online.");
                setOpen(false);
                if (onSuccess) onSuccess({ studentId: -1, localId: Number(form.localId) });
                return;
            }

            const endpoint = type === "create" ? "/student/create" : `/student/update/${data.studentId}`;
            const method = type === "create" ? "post" : "put";
            const response = await api[method](endpoint, formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });
            const { studentId, localId } = response.data;
            setOpen(false);
            if (onSuccess) onSuccess({ studentId, localId });
            toast.success(type === "create" ? t("messages.create_success") : t("messages.update_success"));
        } catch (err: any) {
            console.error("Error during form submission:", err);
            toast.error(translateError(err));
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
                className="bg-white dark:bg-[#1a1c2e] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative border border-gray-100 dark:border-white/5"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-[#0b0d17]/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {type === "create" ? t("add_dialog_title") : t("update_dialog_title")}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {type === "create" ? t("add_dialog_subtitle") : t("update_dialog_subtitle")}
                        </p>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-2 hover:bg-white dark:hover:bg-[#1a1c2e] hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-transparent hover:border-gray-100 dark:hover:border-white/10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Photo & Basic Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-3xl overflow-hidden bg-gray-100 dark:bg-[#0b0d17] border-4 border-white dark:border-[#1a1c2e] shadow-xl group-hover:shadow-2xl transition-all duration-300">
                                    {photoPreview ? (
                                        <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                                            <Upload className="w-10 h-10 mb-2" />
                                            <span className="text-xs font-medium">{t("form.upload_photo")}</span>
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
                                {t("form.photo_rules")}
                            </p>
                        </div>

                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem label={t("form.labels.student_code")} required>
                                <Input name="code" value={form.code} onChange={handleChange} placeholder={t("form.placeholders.student_code")} required className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                            <FormItem label={t("form.labels.first_name")} required>
                                <Input name="nom" value={form.nom} onChange={handleChange} placeholder={t("form.placeholders.first_name")} required className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                            <FormItem label={t("form.labels.last_name")} required>
                                <Input name="prenom" value={form.prenom} onChange={handleChange} placeholder={t("form.placeholders.last_name")} required className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                            <FormItem label={t("form.labels.gender")}>
                                <ComboboxDemo
                                    frameworks={[{ value: "Male", label: t("form.labels.gender_male") || "Male" }, { value: "Female", label: t("form.labels.gender_female") || "Female" }]}
                                    type={t("form.labels.gender")}
                                    value={form.genre}
                                    onChange={(val) => setForm(prev => ({ ...prev, genre: val }))}
                                    width="w-full"
                                />
                            </FormItem>
                        </div>
                    </div>

                    {/* Personal Details Section */}
                    <Section title={t("form.sections.personal")} icon={<User className="w-5 h-5 text-blue-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormItem label={t("form.labels.dob")} required>
                                <DatePicker value={birthDate} placeholder={t("form.placeholders.select_date")} onChange={(date) => {
                                    setBirthDate(date);
                                    if (date) setForm(prev => ({ ...prev, dateNaissance: date.toISOString() }));
                                }} />
                            </FormItem>
                            <FormItem label={t("form.labels.pob")}>
                                <Input name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} placeholder={t("form.placeholders.pob")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                            <FormItem label={t("form.labels.nationality")}>
                                <Input name="nationalite" value={form.nationalite} onChange={handleChange} placeholder={t("form.placeholders.nationality")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                            <FormItem label={t("form.labels.blood_group")}>
                                <ComboboxDemo
                                    frameworks={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(t => ({ value: t, label: t }))}
                                    type={t("form.labels.blood_group")}
                                    value={form.groupeSanguin}
                                    onChange={(val) => setForm(prev => ({ ...prev, groupeSanguin: val }))}
                                    width="w-full"
                                />
                            </FormItem>
                            <FormItem label={t("form.labels.cid")}>
                                <Input name="carteNationale" value={form.carteNationale} onChange={handleChange} placeholder={t("form.placeholders.cid")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                            <FormItem label={t("form.labels.civil_status")}>
                                <Input name="etatCivil" value={form.etatCivil} onChange={handleChange} placeholder={t("form.placeholders.civil_status")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                        </div>
                    </Section>

                    {/* Academic Section */}
                    <Section title={t("form.sections.academic")} icon={<GraduationCap className="w-5 h-5 text-indigo-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormItem label={t("form.labels.enrollment_date")}>
                                <DatePicker value={registerDate} placeholder={t("form.placeholders.select_date")} onChange={(date) => {
                                    setRegisterDate(date);
                                    if (date) setForm(prev => ({ ...prev, dateInscription: date.toISOString() }));
                                }} />
                            </FormItem>
                            <FormItem label={t("form.labels.assigned_local")}>
                                <ComboboxDemo
                                    frameworks={localOptions}
                                    type={t("form.labels.assigned_local")}
                                    value={form.localId}
                                    onChange={(val) => setForm(prev => ({ ...prev, localId: val, classId: "" }))}
                                    width="w-full"
                                />
                            </FormItem>
                            <FormItem label={t("form.labels.assigned_class")}>
                                <ComboboxDemo
                                    frameworks={classOptions}
                                    type={t("form.labels.assigned_class")}
                                    value={form.classId}
                                    onChange={(val) => setForm(prev => ({ ...prev, classId: val }))}
                                    width="w-full"
                                    disabled={!form.localId}
                                />
                            </FormItem>
                            <FormItem label={t("form.labels.school_id")}>
                                <Input name="identifiantScolaire" value={form.identifiantScolaire} onChange={handleChange} placeholder={t("form.placeholders.school_id")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                            </FormItem>
                        </div>
                    </Section>

                    {/* Health & Address Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Section title={t("form.sections.health")} icon={<Heart className="w-5 h-5 text-red-500" />}>
                            <div className="space-y-4">
                                <FormItem label={t("form.labels.health_status")}>
                                    <Input name="etatSante" value={form.etatSante} onChange={handleChange} placeholder={t("form.placeholders.health_status")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                                </FormItem>
                                <FormItem label={t("form.labels.observations")}>
                                    <Textarea name="observation" value={form.observation} onChange={handleChange} placeholder={t("form.placeholders.observations")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white min-h-[100px] focus:ring-blue-500/50" />
                                </FormItem>
                            </div>
                        </Section>

                        <Section title={t("form.sections.contact")} icon={<MapPin className="w-5 h-5 text-green-500" />}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormItem label={t("form.labels.phone") || "Phone Number"}>
                                        <Input name="phone" value={form.phone} onChange={handleChange} placeholder={t("form.placeholders.phone") || "Phone Number"} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                                    </FormItem>
                                    <FormItem label={t("form.labels.email") || "Email Address"}>
                                        <Input type="email" name="email" value={form.email} onChange={handleChange} placeholder={t("form.placeholders.email") || "Email Address"} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white focus:ring-blue-500/50" />
                                    </FormItem>
                                </div>
                                <FormItem label={t("form.labels.full_address")}>
                                    <Textarea name="adresse" value={form.adresse} onChange={handleChange} placeholder={t("form.placeholders.full_address")} className="rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white min-h-[100px] focus:ring-blue-500/50" />
                                </FormItem>
                            </div>
                        </Section>
                    </div>

                    {/* Parent Information Section */}
                    <Section title={t("form.sections.parents")} icon={<Users className="w-5 h-5 text-orange-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-6 bg-blue-50/30 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t("form.labels.father_details")}</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input name="pereNom" value={form.pereNom} onChange={handleChange} placeholder={t("form.placeholders.father_name")} className="rounded-xl bg-white dark:bg-[#0b0d17] dark:border-white/10 dark:text-white focus:ring-blue-500/50" />
                                    <Input name="pereTel" value={form.pereTel} onChange={handleChange} placeholder={t("form.placeholders.phone")} className="rounded-xl bg-white dark:bg-[#0b0d17] dark:border-white/10 dark:text-white focus:ring-blue-500/50" />
                                    <Input name="pereEmploi" value={form.pereEmploi} onChange={handleChange} placeholder={t("form.placeholders.job")} className="rounded-xl bg-white dark:bg-[#0b0d17] dark:border-white/10 dark:text-white focus:ring-blue-500/50" />
                                </div>
                            </div>
                            <div className="space-y-4 p-6 bg-pink-50/30 dark:bg-pink-500/5 rounded-2xl border border-pink-100 dark:border-pink-500/20">
                                <h4 className="text-sm font-bold text-pink-700 dark:text-pink-400 uppercase tracking-wider">{t("form.labels.mother_details")}</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input name="mereNom" value={form.mereNom} onChange={handleChange} placeholder={t("form.placeholders.mother_name")} className="rounded-xl bg-white dark:bg-[#0b0d17] dark:border-white/10 dark:text-white focus:ring-blue-500/50" />
                                    <Input name="mereTel" value={form.mereTel} onChange={handleChange} placeholder={t("form.placeholders.phone")} className="rounded-xl bg-white dark:bg-[#0b0d17] dark:border-white/10 dark:text-white focus:ring-blue-500/50" />
                                    <Input name="mereEmploi" value={form.mereEmploi} onChange={handleChange} placeholder={t("form.placeholders.job")} className="rounded-xl bg-white dark:bg-[#0b0d17] dark:border-white/10 dark:text-white focus:ring-blue-500/50" />
                                </div>
                            </div>
                        </div>
                    </Section>
                </form>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#0b0d17]/50 flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                        className="rounded-xl px-6 py-2.5 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-[#1a1c2e] hover:shadow-sm dark:text-gray-300 transition-all font-bold"
                    >
                        {actionsT("cancel")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="rounded-xl px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all border-none font-bold"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t("form.saving")}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {type === "create" ? t("form.submit_create") : t("form.submit_update")}
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
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                {icon}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FormItem({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 ms-1 uppercase tracking-wide">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
        </div>
    );
}

function DatePicker({ value, onChange, placeholder }: { value?: Date; onChange: (date: Date | undefined) => void; placeholder?: string }) {
    const [open, setOpen] = useState(false);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal rounded-xl border-gray-200 dark:border-white/10 dark:bg-[#0b0d17] dark:text-white hover:bg-gray-50 dark:hover:bg-[#1a1c2e] transition-colors h-auto py-3">
                    {value ? value.toLocaleDateString() : <span className="text-gray-400">{placeholder || "Select date"}</span>}
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-gray-100 dark:border-white/5 dark:bg-[#1a1c2e]" align="start">
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
