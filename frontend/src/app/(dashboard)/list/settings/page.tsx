"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/api";
import { CalendarIcon, Plus, Save, Trash2, GraduationCap } from "lucide-react";
import { useSocket } from "@/providers/SocketProvider";
import TransitionDialog from "@/components/TransitionDialog";

interface SchoolYear {
  id: number;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("school-year");
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitionMode, setTransitionMode] = useState<"auto" | "manual">("manual");
  const { refreshKey } = useSocket();

  // New Year Form
  const [newYear, setNewYear] = useState({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
  });

  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);

  useEffect(() => {
    fetchSchoolYears();
    fetchParameters();
  }, [refreshKey]);

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get("/school-year");
      setSchoolYears(response.data);
    } catch (error) {
      console.error("Error fetching school years:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParameters = async () => {
    try {
      const response = await api.get("/parameter/Transition_Mode");
      if (response.data) {
        setTransitionMode(response.data.okActive ? "auto" : "manual");
      }
    } catch (error) {
      console.error("Error fetching parameters:", error);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/school-year", newYear);
      toast.success("School year added successfully");
      setNewYear({ year: "", startDate: "", endDate: "", isCurrent: false });
      fetchSchoolYears();
    } catch (error) {
      toast.error("Failed to add school year");
    }
  };

  const handleDeleteYear = async (id: number) => {
    try {
      await api.delete(`/school-year/${id}`);
      toast.success("School year deleted");
      fetchSchoolYears();
    } catch (error) {
      toast.error("Failed to delete school year");
    }
  };

  const handleSaveParameters = async () => {
    try {
      await api.patch("/parameter/Transition_Mode", {
        okActive: transitionMode === "auto",
      });
      // If it doesn't exist, create it (backend should handle update or create)
      // For now assume update works if it exists, or use a specific endpoint
      toast.success("Parameters saved");
    } catch (error) {
        // Try create if update fails (simplistic fallback)
        try {
            await api.post("/parameter", {
                paramName: "Transition_Mode",
                okActive: transitionMode === "auto"
            });
            toast.success("Parameters saved");
        } catch (e) {
            toast.error("Failed to save parameters");
        }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage school configurations and system parameters.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="school-year">School Year</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>

        <TabsContent value="school-year" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Add School Year</CardTitle>
                <CardDescription>Define a new academic period.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddYear} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year Name (e.g. 2025-2026)</Label>
                    <Input
                      id="year"
                      placeholder="2025-2026"
                      value={newYear.year}
                      onChange={(e) => setNewYear({ ...newYear, year: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newYear.startDate}
                      onChange={(e) => setNewYear({ ...newYear, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newYear.endDate}
                      onChange={(e) => setNewYear({ ...newYear, endDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isCurrent"
                      checked={newYear.isCurrent}
                      onCheckedChange={(checked) => setNewYear({ ...newYear, isCurrent: !!checked })}
                    />
                    <Label htmlFor="isCurrent">Set as Current Year</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Add Year
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>School Years History</CardTitle>
                <CardDescription>Manage your academic chronology.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">End Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolYears.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                            No school years defined yet.
                          </td>
                        </tr>
                      ) : (
                        schoolYears.map((sy) => (
                          <tr key={sy.id} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{sy.year}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(sy.startDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(sy.endDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              {sy.isCurrent ? (
                                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                  Current
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                  Past
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteYear(sy.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Parameters</CardTitle>
              <CardDescription>Configure how the system behaves during transitions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-base">Student Transition Mode</Label>
                  <p className="text-sm text-muted-foreground font-normal">
                    Choose how students are assigned to the next level's classes.
                  </p>
                </div>
                <RadioGroup
                  value={transitionMode}
                  onValueChange={(val) => setTransitionMode(val as "auto" | "manual")}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value="auto" id="r1" />
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="r1" className="cursor-pointer">Automatic Distribution</Label>
                      <span className="text-xs text-muted-foreground">The system will balance classes automatically.</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 border p-4 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value="manual" id="r2" />
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="r2" className="cursor-pointer">Manual Distribution</Label>
                      <span className="text-xs text-muted-foreground">The admin chooses the class for each student.</span>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                <Button onClick={handleSaveParameters}>
                  <Save className="w-4 h-4 mr-2" /> Save Parameters
                </Button>

                {transitionMode === "manual" && (
                  <Button
                    variant="default"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/20"
                    onClick={() => setIsTransitionDialogOpen(true)}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" /> Transition to Next School Year
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TransitionDialog
        isOpen={isTransitionDialogOpen}
        onOpenChange={setIsTransitionDialogOpen}
      />
    </div>
  );
}
