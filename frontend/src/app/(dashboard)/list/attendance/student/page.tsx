"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, HouseIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { ComboboxDemo } from "@/components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import StudentAttendanceForm from "./StudentAttendanceForm";

export default function AttendancePage() {
    const [open, setOpen] = useState(false);
    const [loadingDialog, setLoadingDialog] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [classes, setClasses] = useState<{ classId: number; ClassName: string }[]>([]);
    const [formData, setFormData] = useState({ classId: 0 });
    const [students, setStudents] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        api.get("http://localhost:47005/attendance/class")
            .then((res) => setClasses(res.data))
            .catch((err) => console.error(err));
    }, []);

    const handleSubmit = async () => {
        if (!formData.classId || !date) return;
        setLoadingDialog(true);

        try {
            const res = await api.get(`http://localhost:47005/attendance/students/${formData.classId}`);
            setStudents(res.data);
            // open dialog
            console.log("DataTable data:", res.data);
            setIsDialogOpen(true);
        } catch (err) {
            console.error("Error fetching students:", err);
        } finally {
            setLoadingDialog(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-gray-50">
            <div className="flex flex-row justify-center items-center mb-6 w-full bg-white border border-gray-200 rounded-lg shadow-sm py-4 text-lg font-semibold text-gray-700">
                <h2 className="text-xl font-semibold tracking-wide">Présence</h2>
                <span className="mx-2 text-gray-400">|</span>
                <HouseIcon className="w-5 h-5 text-blue-600 mx-1" />
                <h2 className="text-lg text-gray-600">
                    Marquer ou mettre à jour la présence des étudiants
                </h2>
            </div>

            <div className="w-2/3 bg-white border border-gray-100 rounded-xl shadow-md p-6">
                <Tabs defaultValue="account">
                    <TabsList className="flex justify-center mb-6">
                        <TabsTrigger value="account">Étudiants</TabsTrigger>
                        <TabsTrigger value="Scan Card">Card</TabsTrigger>
                    </TabsList>

                    <TabsContent value="account">
                        <div className="flex flex-col items-center space-y-6 w-full">
                            <div className="w-full">
                                {/* Date Picker */}
                                <Label>Date</Label>
                                <div className="relative flex gap-2">
                                    <Input
                                        value={date?.toLocaleDateString() || ""}
                                        readOnly
                                    />
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="absolute top-1/2 right-2 -translate-y-1/2">
                                                <CalendarIcon className="size-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar mode="single" selected={date} onSelect={setDate} />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {/* Class Combobox */}
                                <div className="mt-6">
                                    <Label>Classe</Label>
                                    <ComboboxDemo
                                        frameworks={classes.map((c) => ({
                                            value: c.classId.toString(),
                                            label: c.ClassName,
                                        }))}
                                        type="Classe"
                                        value={formData.classId.toString()}
                                        onChange={(val) => setFormData({ classId: parseInt(val) })}
                                        width="w-full"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex justify-center mt-8">
                                    <Button
                                        className="w-1/3 text-lg py-5 font-medium"
                                        onClick={handleSubmit}
                                        disabled={loadingDialog}
                                    >
                                        {loadingDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loadingDialog ? "Chargement..." : "Enregistrer"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="Scan Card">
                        <p className="text-center text-gray-500">Coming soon</p>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialog for Attendance */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        
                        <DialogTitle>
                            Présence de la classe {
                                classes.find(c => c.classId === formData.classId)?.ClassName || "—"
                            } le {date?.toLocaleDateString()}
                        </DialogTitle>
                    </DialogHeader>

                    <StudentAttendanceForm
                        students={students}
                        classId={formData.classId}
                        date={date}
                        onClose={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
