"use client"

import { useCallback, useEffect, useState } from "react"
import api from "@/lib/api"
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import debounce from "lodash.debounce"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { toast } from "sonner"
import { ComboboxDemo } from "./ui/combobox"

interface ClassType {
    classId: number;
    ClassName: string;
}

interface TimetableEntry {
    id: number
    day: string
    timeSlot: { start: string; end: string }
    subject: { name: string }
    teacher: { firstName: string; lastName: string }
}

export default function AdminTimetable() {
    const [classes, setClasses] = useState<ClassType[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("")
    const [timetable, setTimetable] = useState<TimetableEntry[]>([])
    const [openAddSlot, setOpenAddSlot] = useState(false);
    const [label, setLabel] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    const typeTimeSlotOptions = [
        { value: "Etude", label: "Etu" },
        { value: "Free", label: "Free" },
    ];

    const toISOStringTime = (time: string): string => {
        const today = new Date();
        const [hours, minutes] = time.split(":").map(Number);
        today.setHours(hours);
        today.setMinutes(minutes);
        today.setSeconds(0);
        today.setMilliseconds(0);
        return today.toISOString();
    };
    const [timeSlotForm, setTimeSlotForm] = useState({
        label: "",
    });

    const fetchClasses = useCallback(
        debounce(async () => {
            try {
                const url = `/class`;
                const response = await api.get(url, { withCredentials: true });
                //console.log("Full API response:", response.data);
                const classesArray = Array.isArray(response.data.classes) ? response.data.classes : [];
                setClasses(classesArray);
                console.log("Classes data:", classesArray);
            } catch (err) {
                console.error("❌ Failed to fetch Classes:", err);
                setClasses([]); // fallback
            }
        }, 500),
        []
    );
    useEffect(() => {
        fetchClasses();
    }, []);
    useEffect(() => {
        if (selectedClassId) {
            api.get(`/timetable/class/${selectedClassId}`).then(res => setTimetable(res.data))
        }
    }, [selectedClassId])

    const handleAddTimeSlot = async (e: React.FormEvent) => {
        e.preventDefault();

        const today = new Date();
        const startTime = new Date(today.setHours(8, 0, 0)); // 08:00
        const endTime = new Date(today.setHours(9, 0, 0));   // 09:00

        try {
            await api.post("/time-slots", {
                label: timeSlotForm.label,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            });

            toast.success("Créneau ajouté !");
            setOpenAddSlot(false);
        } catch (error) {
            toast.error("Erreur lors de l'ajout du créneau");
            console.error(error);
        }
    };
    return (
        <div className="p-4 space-y-6">
            <div className="w-64">
                <Select onValueChange={(val) => setSelectedClassId(val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.isArray(classes) &&
                            classes.map(cls => (
                                <SelectItem key={cls.classId} value={cls.classId?.toString()}>
                                    {cls.ClassName}
                                </SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>
            </div>

            {selectedClassId && (
                <div className="border rounded-xl p-4 shadow">
                    <h2 className="text-lg font-semibold mb-4">Emploi du temps</h2>
                    {timetable.length === 0 ? (
                        <p>Aucun horaire défini pour cette classe.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left border-b">
                                    <th>Jour</th>
                                    <th>Heure</th>
                                    <th>Matière</th>
                                    <th>Enseignant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timetable.map((entry) => (
                                    <tr key={entry.id} className="border-b">
                                        <td>{entry.day}</td>
                                        <td>{entry.timeSlot.start} - {entry.timeSlot.end}</td>
                                        <td>{entry.subject.name}</td>
                                        <td>{entry.teacher.firstName} {entry.teacher.lastName}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    <div className="mt-4">
                        <Button onClick={() => setOpenAddSlot(true)}>Ajouter un créneau</Button>
                        <Dialog open={openAddSlot} onOpenChange={setOpenAddSlot}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ajouter un créneau</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddTimeSlot}>
                                    <div>
                                        <Label>Type de créneau</Label>
                                        <ComboboxDemo
                                            frameworks={typeTimeSlotOptions}
                                            type="TimeSlot"
                                            value={timeSlotForm.label}
                                            onChange={(val) =>
                                                setTimeSlotForm((prev) => ({ ...prev, label: val }))
                                            }
                                            width="w-full"
                                        />
                                    </div>

                                    <Label htmlFor="startTime">Heure de début</Label>
                                    <Input type="time" id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

                                    <Label htmlFor="endTime">Heure de fin</Label>
                                    <Input type="time" id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

                                    <Button type="submit" className="mt-4">Ajouter</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}
        </div>
    )
}
