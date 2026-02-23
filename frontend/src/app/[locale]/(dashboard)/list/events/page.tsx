"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Loader2, Calendar, Clock, Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { fetchUser } from "@/lib/getRoleFromToken";
import EventForm from "@/components/forms/EventForm";
import { motion } from "motion/react";

export type SchoolEvent = {
    id: number;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
};

export default function EventsListPage() {
    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [role, setRole] = useState<string>("guest");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<"create" | "update">("create");
    const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            const user = await fetchUser();
            setRole(user?.role || "guest");
        };
        loadUser();
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/event");
            setEvents(response.data);
        } catch (error) {
            console.error("Error fetching events:", error);
            toast({
                variant: "destructive",
                title: "Error loading events",
                description: "Could not fetch event list."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            await api.delete(`/event/${id}`);
            toast({ title: "Event deleted successfully" });
            fetchData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error deleting event",
            });
        }
    };

    const handleEdit = (event: SchoolEvent) => {
        setSelectedEvent(event);
        setFormType("update");
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setSelectedEvent(null);
        setFormType("create");
        setIsFormOpen(true);
    };

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isAdmin = role.toLowerCase() === "admin";
    const canManage = isAdmin || role.toLowerCase() === "teacher";

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        School Events
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        View and manage upcoming school programs and calendar
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                        <Input
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                        />
                    </div>

                    <Button
                        onClick={handleCreate}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg border-none"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <span>Add Event</span>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No events found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, idx) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group p-6 rounded-[32px] bg-white dark:bg-[#1a1c2e] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(event)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-blue-600"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(event.id)}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                            </div>

                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight line-clamp-1">
                                {event.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                                {event.description}
                            </p>

                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{new Date(event.startTime).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <div className="w-3.5 h-3.5" />
                                    <span>To: {new Date(event.endTime).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <EventForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                type={formType}
                data={selectedEvent}
                onSuccess={fetchData}
            />
        </div>
    );
}
