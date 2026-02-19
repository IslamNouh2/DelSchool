"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarIcon, HouseIcon, Loader2, Users, ChevronDownIcon, Save } from "lucide-react";
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
import { useSocket } from "@/providers/SocketProvider";
import { motion, AnimatePresence } from "framer-motion";

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
    const { refreshKey } = useSocket();

    useEffect(() => {
        api.get("/attendance/employers")
            .then((res) => setEmployers(res.data))
            .catch((err) => console.error(err));
    }, [refreshKey]);

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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Staff Attendance
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage and track employee presence
                    </p>
                </div>
            </div>

            {/* Selection Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-slate-800"
            >
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-3xl">
                        <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Record Presence</h2>
                        <p className="text-gray-500 dark:text-slate-400">Select a date to mark staff attendance</p>
                    </div>

                    <div className="w-full space-y-6">
                        <div className="space-y-2 text-left">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Attendance Date</Label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                <Input 
                                    value={date ? date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""} 
                                    readOnly 
                                    className="pl-12 pr-12 py-7 rounded-2xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10"
                                />
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" className="absolute top-1/2 right-2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-none border-none">
                                            <ChevronDownIcon className="size-5 text-gray-400" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-gray-100 dark:border-slate-800" align="end">
                                        <Calendar mode="single" selected={date} onSelect={setDate} className="p-3" />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button 
                                onClick={handleOpen} 
                                disabled={loadingDialog}
                                className="h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all border-none font-bold text-base gap-3"
                            >
                                {loadingDialog ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                {loadingDialog ? "Loading..." : "Mark Attendance"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowLast7Days(true)}
                                className="h-16 rounded-2xl border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-400 font-bold text-base hover:bg-gray-50 dark:hover:bg-slate-800 transition-all gap-3"
                            >
                                <CalendarIcon className="h-5 w-5 text-emerald-500" />
                                7-Day History
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Dialogs */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                    <div className="p-8 bg-gray-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                                Staff Presence : {date?.toLocaleDateString()}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-8">
                        <EmployerAttendanceForm
                            employers={employers}
                            date={date}
                            existingAttendance={existingAttendance}
                            hasExistingData={hasExistingData}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* History Display */}
            <AnimatePresence>
                {showLast7Days && (
                    <div className="mt-8">
                        <Last7DaysAttendance type="employer" />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
