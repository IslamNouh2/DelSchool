"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, HouseIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import EmployerAttendanceForm from "./EmployerAttendanceForm";
import Last7DaysAttendance from "@/components/Last7DaysAttendance";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerAttendancePage() {
    const [open, setOpen] = useState(false);
    const [loadingDialog, setLoadingDialog] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [employers, setEmployers] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [existingAttendance, setExistingAttendance] = useState<any[]>([]);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [showLast7Days, setShowLast7Days] = useState(false);
    const [reload, setReload] = useState(false);

    useEffect(() => {
        api.get("/attendance/employers")
            .then((res) => setEmployers(res.data))
            .catch((err) => console.error(err));
    }, []);

    const handleOpen = async () => {
        if (!date) return;
        setLoadingDialog(true);
        try {
            const dateString = date.toISOString().split('T')[0];
            try {
                const existingRes = await api.get(`/attendance/employer-existing?date=${dateString}`);
                setExistingAttendance(existingRes.data);
                setHasExistingData(existingRes.data.length > 0);
            } catch (_err) {
                setExistingAttendance([]);
                setHasExistingData(false);
            }
            setIsDialogOpen(true);
        } catch (err) {
            console.error("Error opening employer attendance dialog:", err);
        } finally {
            setLoadingDialog(false);
        }
    };

    return (
        <Card className="w-full">
            <CardContent className="flex flex-col items-center w-full pt-6">
                <div className="flex flex-row justify-center items-center mb-6 w-full bg-card border rounded-lg shadow-sm py-4 text-lg font-semibold text-foreground">
                    <h2 className="text-xl font-semibold tracking-wide">Présence Employés</h2>
                    <span className="mx-2 text-muted-foreground">|</span>
                    <HouseIcon className="w-5 h-5 text-primary mx-1" />
                    <h2 className="text-lg text-muted-foreground">
                        Marquer ou mettre à jour la présence des employés
                    </h2>
                </div>

                <div className="w-2/3 bg-card border rounded-xl shadow-md p-6">
                    <Tabs defaultValue="employer">
                        <TabsList className="flex justify-center mb-6">
                            <TabsTrigger value="employer">Employés</TabsTrigger>
                        </TabsList>

                        <TabsContent value="employer">
                            <div className="flex flex-col items-center space-y-6 w-full">
                                <div className="w-full">
                                    <Label>Date</Label>
                                    <div className="relative flex gap-2">
                                        <Input value={date?.toLocaleDateString() || ""} readOnly />
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

                                    <div className="flex justify-center gap-4 mt-8">
                                        <Button className="w-1/3 py-5 font-medium" onClick={handleOpen} disabled={loadingDialog}>
                                            {loadingDialog && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {loadingDialog ? "Chargement..." : "Enregistrer"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-1/3 py-5 font-medium"
                                            onClick={() => setShowLast7Days(true)}
                                        >
                                            Historique 7 jours
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                Présence des employés le {date?.toLocaleDateString()}
                            </DialogTitle>
                        </DialogHeader>

                        <EmployerAttendanceForm
                            employers={employers}
                            date={date}
                            existingAttendance={existingAttendance}
                            hasExistingData={hasExistingData}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {/* Last 7 Days Display */}
                {showLast7Days && (
                    <Last7DaysAttendance
                        type="employer"
                    />
                )}
            </CardContent>
        </Card>
    );
}
