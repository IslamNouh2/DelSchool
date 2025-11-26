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
    import { ChevronDownIcon, Upload, X } from "lucide-react";
    //import { toast } from "sonner"; // or your preferred toast library

    type StudentFormProps = {
        type: "create" | "update";
        data?: any;
        relatedData?: any;
        setOpen: React.Dispatch<React.SetStateAction<boolean>>;
        onSuccess?: (data: { studentId: number; localId: number }) => void;
    };

    type Local = {
        localId: number;
        name: string; // or whatever field your local name is
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
            academicYear: '', 
        });

        const [photoPreview, setPhotoPreview] = useState<string | null>(null);
        const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
        const [registerDate, setRegisterDate] = useState<Date | undefined>(undefined);
        const [openBirth, setOpenBirth] = useState(false);
        const [openRegister, setOpenRegister] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const [locals, setLocals] = useState<Local[]>([]);

        // Populate form when updating
        useEffect(() => {
            console.log("Form Data Received:", data);
            if (type === "update" && data) {
                setForm({
                    code: data.code || "",
                    nom: data.firstName || "",  // Map firstName to nom
                    prenom: data.lastName || "", // Map lastName to prenom
                    dateNaissance: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : "",
                    dateInscription: data.dateInscription ? new Date(data.dateInscription).toISOString() : "",
                    lieuNaissance: data.lieuOfBirth || "",
                    nationalite: data.nationality || "",
                    genre: data.gender || "",  // Make sure this matches Combobox value format
                    groupeSanguin: data.bloodType || "",
                    carteNationale: data.cid || "",
                    etatCivil: data.etatCivil || "",
                    etatSante: data.health || "",

                    identifiantScolaire: data.numNumerisation || "",
                    adresse: data.address || "",
                    observation: data.observation || "",
                    classe: "",
                    pereNom: "",
                    pereTel: "",
                    pereEmploi: "",
                    pereCarte: "",
                    mereNom: "",
                    mereTel: "",
                    mereEmploi: "",
                    kafili: false,
                    photo: null,
                    localId: "",
                    academicYear: '', 
                });


                // Set dates
                if (data.dateOfBirth) {
                    setBirthDate(new Date(data.dateOfBirth));
                }
                if (data.dateInscription) {
                    setRegisterDate(new Date(data.dateInscription));
                }

                // Set photo preview if exists
                if (data.photoUrl) {
                    setPhotoPreview(data.photoUrl);
                }
                //console.log("Form Data Received:", data);
                
            }
            fetchLocal();
        }, [type, data]);

        const handleChange = (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        ) => {
            const { name, value, type, checked, files } = e.target as HTMLInputElement;

            if (type === "file" && files?.[0]) {
                const file = files[0];

                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    //toast.error("File size must be less than 5MB");
                    return;
                }

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.type)) {
                    //toast.error("Only JPEG, PNG, and WebP files are allowed");
                    return;
                }

                setForm((prev) => ({ ...prev, [name]: file }));

                // Create preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPhotoPreview(e.target?.result as string);
                };
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

            // Reset file input
            const fileInput = document.querySelector('input[name="photo"]') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
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

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);

            const formData = new FormData();

            // Add all form data
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

            // Add parent data
            formData.append("fatherName", form.pereNom);
            formData.append("fatherNumber", form.pereTel);
            formData.append("fatherJob", form.pereEmploi);
            formData.append("matherName", form.mereNom);
            formData.append("matherNumber", form.mereTel);
            formData.append("matherJob", form.mereEmploi);

            // Add localId and academicYear
            formData.append("localId", String(form.localId)); // Ensure it's string
            formData.append("academicYear", form.academicYear || "");

            // Add photo if selected
            if (form.photo) {
                formData.append("photo", form.photo);
            }

            try {
                const endpoint = type === "create"
                    ? "/student/create"
                    : `/student/update/${data.studentId}`;
                const method = type === "create" ? "post" : "put";

                const response = await api[method](endpoint, formData, {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                const { studentId, localId } = response.data;

                console.log("Student created/updated:", studentId, localId);

                setOpen(false);

                if (onSuccess) {
                    onSuccess({ studentId, localId });
                }

            } catch (err: any) {
                const message = err.response?.data?.message || err.message || "An error occurred";
                // toast.error(message);
                console.error("Error during form submission:", message);
            } finally {
                setIsLoading(false);
            }
        };


        const fetchLocal = async () => {
            try {
                const res = await api.get('student/all-locals', { withCredentials: true, });
                //console.log("local ", res.data);
                setLocals(res.data);
            } catch (error) {
                console.error("Failed to fetch locals:", error);
            }

        }

        const localOptions = locals.map((l) => ({
            value: String(l.localId), // must be a string
            label: l.name,
        }));

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
                <div className="max-h-screen overflow-y-auto p-6 bg-card rounded-2xl shadow-lg w-full max-w-6xl relative border border-border">
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg"
                        disabled={isLoading}
                    >
                        ✕
                    </button>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Photo upload */}
                        <div className="flex flex-col items-center space-y-4">
                            <h1 className="text-xl font-medium">
                                {type === "create" ? "Ajouter Student" : "Modifier Student"}
                            </h1>

                            <div className="relative">
                                {photoPreview ? (
                                    <div className="relative">
                                        <Image
                                            src={photoPreview}
                                            alt="Preview"
                                            width={96}
                                            height={96}
                                            className="h-24 w-24 rounded-full object-cover border-2 border-border"
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
                                    <div className="h-24 w-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-muted-foreground" />
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
                            <p className="text-xs text-muted-foreground">
                                Max 5MB. Formats: JPEG, PNG, WebP
                            </p>
                        </div>

                        {/* Section 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <h2>Code<span className="text-red-600">*</span></h2>
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
                                <h2>Nom<span className="text-red-600">*</span></h2>
                                <Input
                                    name="nom"
                                    value={form.nom}
                                    onChange={handleChange}
                                    placeholder="Nom *"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <h2>Prénom<span className="text-red-600">*</span></h2>
                                <Input
                                    name="prenom"
                                    value={form.prenom}
                                    onChange={handleChange}
                                    placeholder="Prénom *"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="dateNaissance" className="px-1">
                                    Date de Naissance
                                </Label>
                                <Popover open={openBirth} onOpenChange={setOpenBirth}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between font-normal" disabled={isLoading}>
                                            {birthDate ? birthDate.toLocaleDateString() : "Select date"}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={birthDate}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setBirthDate(date);
                                                setOpenBirth(false);
                                                if (date) {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        dateNaissance: date.toISOString(),
                                                    }));
                                                }
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Date d'inscription */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="dateInscription" className="px-1">
                                    Date d'inscription
                                </Label>
                                <Popover open={openRegister} onOpenChange={setOpenRegister}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between font-normal" disabled={isLoading}>
                                            {registerDate ? registerDate.toLocaleDateString() : "Select date"}
                                            <ChevronDownIcon />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={registerDate}
                                            captionLayout="dropdown"
                                            onSelect={(date) => {
                                                setRegisterDate(date);
                                                setOpenRegister(false);
                                                if (date) {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        dateInscription: date.toISOString(),
                                                    }));
                                                }
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <h2>Lieu de Naissance</h2>
                                <Input
                                    name="lieuNaissance"
                                    value={form.lieuNaissance}
                                    onChange={handleChange}
                                    placeholder="Lieu de Naissance"
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <h2>Nationalité</h2>
                                <Input
                                    name="nationalite"
                                    value={form.nationalite}
                                    onChange={handleChange}
                                    placeholder="Nationalité"
                                    disabled={isLoading}
                                />
                            </div>
                            {/* Gender Combobox */}
                            <div>
                                <h2>Genre</h2>
                                <ComboboxDemo
                                    frameworks={GenderFrameworks}
                                    type="Gender"
                                    value={form.genre}
                                    onChange={(val) => {
                                        setForm(prev => ({ ...prev, genre: val }));
                                    }}
                                    width="w-full"
                                />
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div>
                                <h2>N° Carte Nationale</h2>
                                <Input
                                    name="carteNationale"
                                    value={form.carteNationale}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <h2>État Civil</h2>
                                <Input
                                    name="etatCivil"
                                    value={form.etatCivil}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <h2>État de Santé</h2>
                                <Input
                                    name="etatSante"
                                    value={form.etatSante}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            {/* Blood Type Combobox */}
                            <div>
                                <h2>Groupage</h2>
                                <ComboboxDemo
                                    frameworks={BloodTypeFrameworks}
                                    type="Groupage"
                                    value={form.groupeSanguin}
                                    onChange={(val) => {
                                        setForm(prev => ({ ...prev, groupeSanguin: val }));
                                    }}
                                    width="w-full"
                                />
                            </div>
                        </div>

                        {/* Adresse & Observation */}
                        <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-2">
                            <div>
                                <Label>Adresse</Label>
                                <Input
                                    name="adresse"
                                    value={form.adresse}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="mb-4">
                                <Label>Local</Label>
                                <ComboboxDemo
                                    frameworks={localOptions}
                                    type="Local"
                                    value={form.localId}
                                    onChange={(val) => {
                                        setForm((prev) => ({ ...prev, localId: val }));
                                    }}
                                    width="w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <h2>Observation</h2>
                            <Textarea
                                name="observation"
                                value={form.observation}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Parents */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <Input
                                name="pereNom"
                                value={form.pereNom}
                                onChange={handleChange}
                                placeholder="Nom du père"
                                disabled={isLoading}
                            />
                            <Input
                                name="pereTel"
                                value={form.pereTel}
                                onChange={handleChange}
                                placeholder="Téléphone père"
                                disabled={isLoading}
                            />
                            <Input
                                name="pereEmploi"
                                value={form.pereEmploi}
                                onChange={handleChange}
                                placeholder="Emploi père"
                                disabled={isLoading}
                            />
                            <Input
                                name="pereCarte"
                                value={form.pereCarte}
                                onChange={handleChange}
                                placeholder="Carte père"
                                disabled={isLoading}
                            />
                            <Input
                                name="mereNom"
                                value={form.mereNom}
                                onChange={handleChange}
                                placeholder="Nom de la mère"
                                disabled={isLoading}
                            />
                            <Input
                                name="mereTel"
                                value={form.mereTel}
                                onChange={handleChange}
                                placeholder="Téléphone mère"
                                disabled={isLoading}
                            />
                            <Input
                                name="mereEmploi"
                                value={form.mereEmploi}
                                onChange={handleChange}
                                placeholder="Emploi mère"
                                disabled={isLoading}
                            />
                            <div className="flex items-center space-x-2">
                                <Input
                                    type="checkbox"
                                    name="kafili"
                                    checked={form.kafili}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <label>Kafil</label>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-center space-x-6 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Valider"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    export default StudentForm;
