"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomTable } from "@/components/CustomTable";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, GraduationCap } from "lucide-react";
import ClassForm from "./forms/ClassForm";

interface TransitionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Class {
  classId: number;
  ClassName: string;
  localId: number;
}

interface Local {
  localId: number;
  name: string;
}

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  code: string;
  studentClassId: number;
  average: number;
}

interface TransitionData {
  studentId: number;
  studentClassId: number;
  nextClassId: number;
}

export default function TransitionDialog({ isOpen, onOpenChange }: TransitionDialogProps) {
  const [locals, setLocals] = useState<Local[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSourceLocalId, setSelectedSourceLocalId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTargetLocalId, setSelectedTargetLocalId] = useState<string>("");
  
  const [passingStudents, setPassingStudents] = useState<Student[]>([]);
  const [transitions, setTransitions] = useState<TransitionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [nextYear, setNextYear] = useState("");
  const [schoolYears, setSchoolYears] = useState<{id: number, year: string}[]>([]);

  // For adding new class
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLocals();
      fetchClasses();
      fetchSchoolYears();
    }
  }, [isOpen]);

  const fetchLocals = async () => {
    try {
      const response = await api.get("/local", { params: { limit: 100 } });
      setLocals(response.data.locals || []);
    } catch (error) {
      toast.error("Failed to load locations");
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get("/class", { params: { limit: 100 } });
      setClasses(response.data.classes);
    } catch (error) {
      toast.error("Failed to load classes");
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const response = await api.get("/school-year");
      setSchoolYears(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClassSelect = async (classId: string) => {
    setSelectedClassId(classId);
    setLoading(true);
    try {
      const response = await api.get(`/transition/passing-students`, {
        params: { classId: parseInt(classId) }
      });
      setPassingStudents(response.data);
      // Initialize transitions
      const initialTransitions = response.data.map((s: Student) => ({
        studentId: s.studentId,
        studentClassId: s.studentClassId,
        nextClassId: 0,
      }));
      setTransitions(initialTransitions);
    } catch (error) {
      toast.error("Failed to fetch passing students");
    } finally {
      setLoading(false);
    }
  };

  const handleNextClassChange = (studentId: number, nextClassId: number) => {
    setTransitions(prev =>
      prev.map(t => t.studentId === studentId ? { ...t, nextClassId } : t)
    );
  };

  const handleProcess = async () => {
    if (!nextYear) {
      toast.error("Please select the next school year");
      return;
    }

    const unassigned = transitions.filter(t => t.nextClassId === 0);
    if (unassigned.length > 0) {
      toast.error(`Please assign all students to a next class (${unassigned.length} remaining)`);
      return;
    }

    setProcessing(true);
    try {
      await api.post("/transition/process", {
        nextYear,
        transitions
      });
      toast.success("Students transitioned successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process transitions");
    } finally {
      setProcessing(false);
    }
  };

  const sourceClasses = classes.filter(c => c.localId === parseInt(selectedSourceLocalId));
  const targetClasses = classes.filter(c => c.localId === parseInt(selectedTargetLocalId));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
              Student Transition Level
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
            <div className="space-y-2">
              <Label>Source Local</Label>
              <Select onValueChange={(val) => {
                setSelectedSourceLocalId(val);
                setSelectedClassId("");
                setPassingStudents([]);
              }} value={selectedSourceLocalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select local" />
                </SelectTrigger>
                <SelectContent>
                  {locals.map((l) => (
                    <SelectItem key={l.localId} value={l.localId.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source Class</Label>
              <Select onValueChange={handleClassSelect} value={selectedClassId} disabled={!selectedSourceLocalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {sourceClasses.map((c) => (
                    <SelectItem key={c.classId} value={c.classId.toString()}>
                      {c.ClassName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Next School Year</Label>
              <Select onValueChange={setNextYear} value={nextYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {schoolYears.map((sy) => (
                    <SelectItem key={sy.id} value={sy.year}>
                      {sy.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Local</Label>
              <Select onValueChange={setSelectedTargetLocalId} value={selectedTargetLocalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target local" />
                </SelectTrigger>
                <SelectContent>
                  {locals.map((l) => (
                    <SelectItem key={l.localId} value={l.localId.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Passing Students (Average {'>'}= 10)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddClassOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Class
              </Button>
            </div>

            <div className="border rounded-xl overflow-hidden bg-muted/20">
              <CustomTable
                data={passingStudents}
                loading={loading}
                rowKey={(item: any) => item.studentId}
                columns={[
                  {
                    header: "Student Name",
                    key: "name",
                    render: (item) => `${item.firstName} ${item.lastName}`,
                  },
                  {
                    header: "Code",
                    key: "code",
                    render: (item) => item.code,
                  },
                  {
                    header: "Average",
                    key: "average",
                    render: (item) => (
                      <span className="font-bold text-green-600">
                        {item.average.toFixed(2)}
                      </span>
                    ),
                  },
                  {
                    header: "Next Class",
                    key: "nextClass",
                    render: (item) => (
                      <Select
                        onValueChange={(val) => handleNextClassChange(item.studentId, parseInt(val))}
                        value={transitions.find(t => t.studentId === item.studentId)?.nextClassId.toString() || "0"}
                        disabled={!selectedTargetLocalId}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder={selectedTargetLocalId ? "Select class" : "Select target local first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {targetClasses.map((c) => (
                            <SelectItem key={c.classId} value={c.classId.toString()}>
                              {c.ClassName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={processing || passingStudents.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <ClassForm
            type="create"
            setOpen={setIsAddClassOpen}
            onSuccess={() => {
              fetchClasses();
              setIsAddClassOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
