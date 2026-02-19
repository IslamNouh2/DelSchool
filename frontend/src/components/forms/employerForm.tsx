"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronDownIcon, Upload, X, Save, User, Briefcase, GraduationCap, Heart, MapPin, Users, Search, BookOpen, Plus, Trash2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

interface EmployerDialogProps {
    type?: "create" | "update"
    data?: any
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
    hideButton?: boolean
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                {icon}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FormItem({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
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
                <Button variant="outline" className="w-full justify-between font-normal rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800">
                    {value ? value.toLocaleDateString() : <span className="text-gray-400">Select date</span>}
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-gray-100 dark:border-slate-800" align="start">
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
        weeklyWorkload: 20,
        salary: 0,
        photo: null as File | null,
    })
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
    const [registerDate, setRegisterDate] = useState<Date | undefined>(undefined);
    const [openBirth, setOpenBirth] = useState(false);
    const [openRegister, setOpenRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);
    const [showSubjectDialog, setShowSubjectDialog] = useState(false);
    const [createdEmployerId, setCreatedEmployerId] = useState<string | null>(null);
    const [initialAssignedSubjects, setInitialAssignedSubjects] = useState<any[]>([]);
    const [opend, setOpen] = useState(false);
    const [isClassTeacher, setIsClassTeacher] = useState(false);
    const [showClassDialog, setShowClassDialog] = useState(false);
    const [locals, setLocals] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedLocalId, setSelectedLocalId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [subjectSearch, setSubjectSearch] = useState("");

    const handleClose = () => {
        if (onOpenChange) onOpenChange(false);
    };

    useEffect(() => {
        if (showSubjectDialog && (createdEmployerId || data?.employerId)) {
            const teacherId = createdEmployerId || data?.employerId;

            api.get(`/teacher-subject/${teacherId}`)
                .then(res => {
                    const assigned = res.data.map((item: any) => item.subject);
                    setSelectedSubjects(assigned);
                    setInitialAssignedSubjects(assigned); // Save the original list
                })
                .catch(err => {
                    console.error("Failed to load assigned subjects:", err);
                    toast.error("Failed to load assigned subjects");
                });
        }
    }, [showSubjectDialog]);

    // Check Class Teacher Parameter
    useEffect(() => {
        const checkClassTeacherParam = async () => {
            try {
                const res = await api.get("/parameter/classteacher");
                // The parameter might return { paramName: 'classteacher', okActive: true }
                setIsClassTeacher(res.data?.okActive === true);
            } catch (error) {
                console.error("Failed to fetch classteacher parameter:", error);
                // Default to false if param not found or error
                setIsClassTeacher(false);
            }
        };
        checkClassTeacherParam();
    }, []);

    // Load Locals and Classes when Class Dialog opens
    useEffect(() => {
        if (showClassDialog) {
            const loadLocals = async () => {
               try {
                   const res = await api.get("/local");
                   setLocals(res.data.locals || []);
               } catch (error) {
                   console.error("Failed to load locals", error);
                   toast.error("Failed to load locals");
               }
            };
            loadLocals();
        }
    }, [showClassDialog]);

    // Load Classes when Local is selected
    useEffect(() => {
        if (selectedLocalId) {
            const loadClasses = async () => {
                try {
                    const res = await api.get(`/class?localId=${selectedLocalId}&limit=100`);
                    setClasses(res.data.classes || []);
                } catch (error) {
                    console.error("Failed to load classes", error);
                }
            };
            loadClasses();
        } else {
            setClasses([]);
        }
    }, [selectedLocalId]);


    useEffect(() => {
        // console.log("👀 form.type:", form.type);
        if (form.type === "teacher") {
            // console.log("✅ Loaded subjects:");
            api.get("/subject")
                .then((res) => {
                    // Extract subjects from response data
                    const raw = res.data;
                    const subjectsData = Array.isArray(raw)
                        ? raw
                        : Array.isArray(raw.subjects)
                            ? raw.subjects
                            : Array.isArray(raw.subject)
                                ? raw.subject
                                : [];

                    if (subjectsData.length === 0) {
                        console.warn("🚫 No valid subjects found in response:", raw);
                    }
                    setSubjects(subjectsData);

                    // console.log("📦 Raw subject response:", raw);
                    // console.log("📋 subjects:", subjectsData);
                    // console.log("📋 selectedSubjects:", selectedSubjects);
                })
                .catch((err) => {
                    console.error("Failed to load subjects:", err);
                    toast.error("Failed to load subjects");
                    setSubjects([]);
                });
        }
    }, [form.type]);

    useEffect(() => {
        if (type === "update" && data) {
            console.log("TeacherForm useEffect - type: update, data:", data);
            
            // Normalize gender for pre-population (Select is case-sensitive)
            let normalizedGender = data.gender || "";
            if (normalizedGender.toLowerCase() === "male") normalizedGender = "Male";
            if (normalizedGender.toLowerCase() === "female") normalizedGender = "Female";

            const initialForm = {
                code: data.code || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                dateNaissance: data.dateOfBirth || "",
                dateInscription: data.dateInscription || "",
                lieuNaissance: data.lieuOfBirth || "",
                nationality: data.nationality || "",
                gender: normalizedGender,
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
                weeklyWorkload: data.weeklyWorkload || 20,
                salary: data.salary || 0,
                photo: null,
            };
            console.log("Setting teacher form state to:", initialForm);
            setForm(initialForm);

            setBirthDate(data.dateOfBirth ? new Date(data.dateOfBirth) : undefined)
            setRegisterDate(data.dateInscription ? new Date(data.dateInscription) : undefined)
            if (data.photoFileName) {
                setPhotoPreview(`http://localhost:47005/employer/photo/${data.photoFileName}`)
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
                weeklyWorkload: 20,
                salary: 0,
                photo: null,
            })
            setBirthDate(undefined)
            setRegisterDate(undefined)
            setPhotoPreview(null)
            setSelectedSubjects([])
            setCreatedEmployerId(null)
        }
    }, [type, data])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked, files } = e.target as HTMLInputElement
        if (type === "file" && files?.[0]) {
            const file = files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should be less than 5MB")
                return
            }
            const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
            if (!allowedTypes.includes(file.type)) {
                toast.error("Only JPEG, PNG, and WebP images are allowed")
                return
            }
            setForm((prev) => ({ ...prev, [name]: file }))
            const reader = new FileReader()
            reader.onload = (e) => setPhotoPreview(e.target?.result as string)
            reader.readAsDataURL(file)
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }))
        }
    }
    // useEffect(() => {
    //     console.log("🔥 showSubjectDialog changed:", showSubjectDialog);
    // }, [showSubjectDialog]);

    useEffect(() => {
        if (showSubjectDialog && (createdEmployerId || data?.employerId)) {
            const teacherId = createdEmployerId || data?.employerId;

            api.get(`/teacher-subject/${teacherId}`)
                .then(res => {
                    const assigned = res.data.map((item: any) => item.subject);
                    setSelectedSubjects(assigned);
                })
                .catch(err => {
                    console.error("Failed to load assigned subjects:", err);
                    toast.error("Failed to load assigned subjects");
                });
        }
    }, [showSubjectDialog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData()

            formData.append("code", form.code)
            formData.append("firstName", form.firstName)
            formData.append("lastName", form.lastName)
            if (birthDate) formData.append("dateOfBirth", birthDate.toISOString())
            if (registerDate) formData.append("dateInscription", registerDate.toISOString())
            formData.append("lieuOfBirth", form.lieuNaissance)
            formData.append("nationality", form.nationality)
            formData.append("gender", form.gender)
            formData.append("cid", form.carteNationale)
            formData.append("etatCivil", form.etatCivil)
            formData.append("health", form.etatSante)
            formData.append("bloodType", form.groupeSanguin)
            formData.append("numNumerisation", form.identifiantScolaire)
            formData.append("address", form.address)
            formData.append("observation", form.observation)
            formData.append("fatherName", form.pereNom)
            formData.append("motherName", form.mereNom)
            formData.append("phone", form.phone)
            formData.append("type", form.type)
            formData.append("weeklyWorkload", form.weeklyWorkload.toString())
            if (type === "create") {
                formData.append("salary", form.salary.toString())
            }

            // ✅ Serialize boolean correctly
            formData.append("okBlock", JSON.stringify(form.okBlock))

            // ✅ Append photo
            if (form.photo) {
                formData.append("photo", form.photo)
            }

            const endpoint = type === "create" ? "/employer/create" : `/employer/${data?.employerId}`
            const method = type === "create" ? "post" : "put"

            const response = await api[method](endpoint, formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            // console.log("🔥 CHECKPOINT — form.type:", form.type);
            // console.log("🔥 CHECKPOINT — type:", type);
            // console.log("🔥 CHECKPOINT — form.type.toLowerCase():", form.type.toLowerCase());
            // console.log("🔥 Condition result:", form.type.toLowerCase() === "teacher" && type === "create");

            toast.success(type === "create" ? "Employer created successfully!" : "Employer updated successfully!")

            // Check if this is a teacher creation and show subject dialog
            if (form.type.toLowerCase() === "teacher") {
                //console.log("Showing subject dialog for teacher")
                // Try different possible response formats for employerId
                const employerId =
                    response.data?.employerId || response.data?.id || response.data?.data?.employerId || response.data?.data?.id || data?.employerId
                console.log("Extracted employerId:", employerId)
                setCreatedEmployerId(employerId)

                if (isClassTeacher) {
                    setShowClassDialog(true);
                } else {
                     // Load subjects if not already loaded
                    if (subjects.length === 0) {
                        console.log("Loading subjects...")
                        try {
                            const subjectsResponse = await api.get("/subject");
                            const raw = subjectsResponse.data;
                            const subjectList = Array.isArray(raw) ? raw : raw.subjects || raw.subject || [];
                            setSubjects(subjectList);
                        } catch (err) {
                            console.error("Failed to load subjects:", err)
                            toast.error("Failed to load subjects")
                        }
                    }
                    setShowSubjectDialog(true)
                }

                // Do not close dialog here, wait for secondary dialog to finish
                // if (onSuccess) onSuccess()
                // if (onOpenChange) onOpenChange(false)
            } else {
                if (onSuccess) onSuccess()
                if (onOpenChange) onOpenChange(false)
                
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
                    weeklyWorkload: 20,
                    salary: 0,
                    photo: null,
                })
                setBirthDate(undefined)
                setRegisterDate(undefined)
                setPhotoPreview(null)
                setSelectedSubjects([])
                setCreatedEmployerId(null)
                setInitialAssignedSubjects([])

            }
        } catch (err: any) {
            console.error("Submit error:", err)
            const msg = err?.response?.data?.message || err?.message || "An error occurred"
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    const removePhoto = () => {
        setForm((prev) => ({ ...prev, photo: null }))
        setPhotoPreview(null)
        const fileInput = document.querySelector('input[name="photo"]') as HTMLInputElement
        if (fileInput) fileInput.value = ""
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative border border-gray-100 dark:border-slate-800"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {type === "create" ? "Add New Employer" : "Edit Employer Record"}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {type === "create" ? "Enter the details to add a new employer/teacher" : "Update the employer's information below"}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-transparent hover:border-gray-100 dark:hover:border-slate-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Photo & Basic Info Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-3xl overflow-hidden bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                                    {photoPreview ? (
                                        <div className="relative w-full h-full">
                                            <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                                        </div>
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
                                    <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
                                JPG, PNG or WebP • Max 5MB
                            </p>
                        </div>

                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem label="Code" required>
                                <Input name="code" value={form.code} onChange={handleChange} placeholder="Employer Code" required className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-blue-500" />
                            </FormItem>
                            <FormItem label="First Name" required>
                                <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" required className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900" />
                            </FormItem>
                            <FormItem label="Last Name" required>
                                <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" required className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900" />
                            </FormItem>
                            
                             <FormItem label="Type" required>
                                <Select value={form.type} onValueChange={(val) => setForm((prev) => ({ ...prev, type: val }))}>
                                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="employer">Employer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        </div>
                    </div>

                    {/* Personal Details Section */}
                    <Section title="Personal Details" icon={<User className="w-5 h-5 text-blue-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormItem label="Date of Birth">
                                <DatePicker value={birthDate} onChange={(date) => {
                                    setBirthDate(date);
                                }} />
                            </FormItem>
                            <FormItem label="Place of Birth">
                                <Input name="lieuNaissance" value={form.lieuNaissance} onChange={handleChange} placeholder="Place of Birth" className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900" />
                            </FormItem>
                            <FormItem label="Nationality" required>
                                <Input name="nationality" value={form.nationality} onChange={handleChange} placeholder="Nationality" className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900" />
                            </FormItem>
                            
                            <FormItem label="Gender" required>
                                <Select value={form.gender} onValueChange={(val) => setForm((prev) => ({ ...prev, gender: val }))}>
                                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                            
                             <FormItem label="Marital Status" required>
                                <Input name="etatCivil" value={form.etatCivil} onChange={handleChange} placeholder="Single/Married" className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900" />
                            </FormItem>
                            
                             <FormItem label="Blood Type" required>
                                <Select value={form.groupeSanguin} onValueChange={(val) => setForm((prev) => ({ ...prev, groupeSanguin: val }))}>
                                    <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900">
                                        <SelectValue placeholder="Select blood type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="O+">O+</SelectItem>
                                        <SelectItem value="O-">O-</SelectItem>
                                        <SelectItem value="AB+">AB+</SelectItem>
                                        <SelectItem value="AB-">AB-</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>

                            {form.type === "teacher" && (
                                <FormItem label="Base Salary (DA)">
                                    <Input
                                        type="number"
                                        name="salary"
                                        value={form.salary}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        min={0}
                                        step="0.01"
                                        disabled={isLoading}
                                        className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                </FormItem>
                            )}
                        </div>
                    </Section>

                        <div className="flex flex-col gap-4">
                            <div>
                                <Label>Observations</Label>
                                <Textarea name="observation" value={form.observation} onChange={handleChange} disabled={isLoading} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    if (onOpenChange) onOpenChange(false)
                                }}
                                disabled={isLoading}
                                className="rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                                {isLoading ? "Loading..." : "Submit"}
                            </Button>
                        </div>
                    </form>
            </motion.div>

            {/* Subject Assignment Dialog */}
            {showSubjectDialog && (
                <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                                Assign Subjects
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400">
                                Manage the subjects assigned to this teacher. Click items to move them between lists.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 min-h-0 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Available Subjects Panel */}
                            <div className="flex flex-col gap-3 h-full border rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-800">
                                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                                            Available Subjects
                                        </h3>
                                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
                                            {subjects.filter(s => !selectedSubjects.some(sel => sel.subjectId === s.subjectId)).length}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input 
                                            placeholder="Search subjects..." 
                                            className="pl-9 h-9 text-sm rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-800"
                                            value={subjectSearch}
                                            onChange={(e) => setSubjectSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {subjects
                                        .filter(s => 
                                            !selectedSubjects.some(sel => sel.subjectId === s.subjectId) &&
                                            s.subjectName.toLowerCase().includes(subjectSearch.toLowerCase())
                                        )
                                        .map(subject => (
                                            <div
                                                key={subject.subjectId}
                                                onClick={() => setSelectedSubjects([...selectedSubjects, subject])}
                                                className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-800">
                                                        <BookOpen size={14} />
                                                    </div>
                                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                                                        {subject.subjectName}
                                                    </span>
                                                </div>
                                                <Plus size={16} className="text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))
                                    }
                                    {subjects.filter(s => !selectedSubjects.some(sel => sel.subjectId === s.subjectId)).length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                                <Search className="w-6 h-6 opacity-30" />
                                            </div>
                                            <p className="text-sm">No subjects available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Subjects Panel */}
                            <div className="flex flex-col gap-3 h-full border rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm ring-1 ring-gray-200 dark:ring-slate-800">
                                <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-green-50/50 dark:bg-green-900/10">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                                            Assigned Subjects
                                        </h3>
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium">
                                            {selectedSubjects.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    {selectedSubjects.length > 0 ? (
                                        selectedSubjects.map(subject => (
                                            <div
                                                key={subject.subjectId}
                                                onClick={() => setSelectedSubjects(selectedSubjects.filter(s => s.subjectId !== subject.subjectId))}
                                                className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all duration-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-xs ring-1 ring-green-100 dark:ring-green-900/30">
                                                        {subject.subjectName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                                                        {subject.subjectName}
                                                    </span>
                                                </div>
                                                <div className="p-1 rounded-full text-red-400 hover:bg-red-200 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={14} />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center">
                                                <Plus className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-sm">Select subjects from the list</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowSubjectDialog(false)}
                                disabled={isLoading}
                                className="w-full sm:w-auto rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                onClick={async () => {
                                    try {
                                        const employerId = createdEmployerId || data?.employerId;
                                        if (!employerId) {
                                            toast.error("Employer ID not found");
                                            return;
                                        }

                                        const newSubjectIds = selectedSubjects
                                            .filter(s => !initialAssignedSubjects.some(init => init.subjectId === s.subjectId))
                                            .map(s => s.subjectId);

                                        const removedSubjectIds = initialAssignedSubjects
                                            .filter(init => !selectedSubjects.some(s => s.subjectId === init.subjectId))
                                            .map(s => s.subjectId);

                                        if (newSubjectIds.length > 0) {
                                            await api.post("/teacher-subject", { employerId, subjectIds: newSubjectIds });
                                        }

                                        if (removedSubjectIds.length > 0) {
                                            await Promise.all(
                                                removedSubjectIds.map(subjectId => api.delete(`/teacher-subject/${employerId}/${subjectId}`))
                                            );
                                        }

                                        toast.success("Subjects updated successfully!");
                                        setShowSubjectDialog(false);
                                        if (onSuccess) onSuccess();
                                        if (onOpenChange) onOpenChange(false);
                                    } catch (err) {
                                        console.error("Assignment error:", err);
                                        toast.error("Failed to assign/remove subjects");
                                    }
                                }}
                                disabled={selectedSubjects.length === 0}
                            >
                                Confirm Updates
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Class Assignment Dialog */}
            {showClassDialog && (
                <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
                    <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-gray-900 dark:text-white">Assign Class to Teacher</DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400">
                                Select the class this teacher will be responsible for.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Select Local</Label>
                                <Select 
                                    value={selectedLocalId} 
                                    onValueChange={(val) => {
                                        setSelectedLocalId(val);
                                        setSelectedClassId("");
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-800">
                                        <SelectValue placeholder="Select Local" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {locals.map((local: any) => (
                                            <SelectItem key={local.localId} value={local.localId.toString()}>
                                                {local.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">Select Class</Label>
                                <Select 
                                    value={selectedClassId} 
                                    onValueChange={(val) => setSelectedClassId(val)}
                                    disabled={!selectedLocalId}
                                >
                                    <SelectTrigger className="rounded-xl border-gray-200 dark:border-slate-700 dark:bg-slate-800">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.length > 0 ? (
                                            classes.map((cls: any) => (
                                                <SelectItem key={cls.classId} value={cls.classId.toString()}>
                                                    {cls.ClassName}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-gray-500 text-center">No classes found</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowClassDialog(false);
                                    if (onSuccess) onSuccess(); 
                                    if (onOpenChange) onOpenChange(false);
                                }}
                                className="rounded-xl border-gray-200 dark:border-slate-700"
                            >
                                Skip / Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    try {
                                        const employerId = createdEmployerId || data?.employerId;
                                        if (!employerId || !selectedClassId) {
                                            toast.error("Please select a class");
                                            return;
                                        }

                                        await api.post("/employer/assign-class", {
                                            employerId: parseInt(employerId),
                                            classId: parseInt(selectedClassId),
                                        });

                                        toast.success("Class assigned successfully!");
                                        setShowClassDialog(false);
                                        if (onSuccess) onSuccess();
                                        if (onOpenChange) onOpenChange(false);
                                    } catch (err) {
                                        console.error("Assignment error:", err);
                                        toast.error("Failed to assign class");
                                    }
                                }}
                                disabled={!selectedClassId}
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Confirm Assignment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
