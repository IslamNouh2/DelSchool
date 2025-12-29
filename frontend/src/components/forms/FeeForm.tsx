"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = z.object({
  type: z.enum(["income", "expense"], { message: "Type is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  amount: z.coerce.number().min(0, { message: "Amount must be positive" }),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  classId: z.coerce.number().optional(),
  studentId: z.coerce.number().optional(),
  employerId: z.coerce.number().optional(),
  compteId: z.coerce.number().optional(),
  description: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

interface FeeFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
}

interface ClassItem {
  classId: number;
  ClassName: string;
}

interface StudentItem {
  studentId: number;
  firstName: string;
  lastName: string;
  code: string;
}

const FeeForm = ({ type, data, setOpen, onSuccess }: FeeFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "income", // Default to income
    },
  });

  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: number; name: string }[]>([]);
  const [comptes, setComptes] = useState<any[]>([]);
  
  const selectedCompteId = watch("compteId");
  const selectedCompte = comptes.find(c => c.id === selectedCompteId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, studentRes, compteRes] = await Promise.all([
          api.get("/class?limit=100"),
          api.get("/student/list?limit=100"),
          api.get("/compte?limit=1000"),
        ]);
        
        setClasses(
          (classRes.data.classes as ClassItem[]).map((c) => ({
            id: c.classId,
            name: c.ClassName,
          }))
        );

        setStudents(
          (studentRes.data.students as StudentItem[]).map((s) => ({
            id: s.studentId,
            name: `${s.firstName} ${s.lastName} (${s.code})`,
          }))
        );

        setComptes(compteRes.data.comptes || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load classes and students");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (type === "update" && data) {
      setValue("type", data.type || "income");
      setValue("title", data.title);
      setValue("amount", data.amount);
      setValue("dueDate", new Date(data.dueDate).toISOString().split('T')[0]);
      setValue("classId", data.classId);
      setValue("studentId", data.studentId);
      setValue("compteId", data.compteId);
      setValue("description", data.description);
    }
  }, [type, data, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      // Ensure we don't send empty strings for optional IDs
      const payload = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
        classId: formData.classId || undefined,
        studentId: formData.studentId || undefined,
        employerId: formData.employerId || undefined,
        compteId: formData.compteId || undefined,
      };

      if (type === "create") {
        await api.post("/fees", payload);
        toast.success("Fee created successfully!");
      } else {
        await api.patch(`/fees/${data.id}`, payload);
        toast.success("Fee updated successfully!");
      }
      
      // Use setTimeout to avoid potential Radix UI focus/pointer-events freeze
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          setOpen(false);
        }
      }, 0);
    } catch (error) {
      console.error("Error submitting fee form:", error);
      toast.error("Something went wrong!");
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Fee" : "Update Fee"}
      </h1>
      
      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="income" id="income" />
                <Label htmlFor="income" className="font-normal cursor-pointer">
                  Income (Fee)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="expense" id="expense" />
                <Label htmlFor="expense" className="font-normal cursor-pointer">
                  Expense
                </Label>
              </div>
            </RadioGroup>
          )}
        />
        {errors.type?.message && (
          <p className="text-xs text-red-500">{errors.type.message}</p>
        )}
      </div>
      
      <div className="flex flex-col gap-2">
        <Label>Title</Label>
        <Input {...register("title")} placeholder="Tuition Fee" />
        {errors.title?.message && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Amount</Label>
        <Input type="number" step="0.01" {...register("amount")} placeholder="100.00" />
        {errors.amount?.message && (
          <p className="text-xs text-red-500">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Due Date</Label>
        <Input type="date" {...register("dueDate")} />
        {errors.dueDate?.message && (
          <p className="text-xs text-red-500">{errors.dueDate.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Account (Compte)</Label>
        <Controller
          name="compteId"
          control={control}
          render={({ field }) => (
            <Select 
              onValueChange={(val) => field.onChange(Number(val))} 
              value={field.value ? String(field.value) : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {comptes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {selectedCompte && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg flex items-center gap-2">
            {selectedCompte.student ? (
              <>
                <span className="font-medium text-blue-600 dark:text-blue-400">Student Account:</span>
                {selectedCompte.student.firstName} {selectedCompte.student.lastName}
              </>
            ) : selectedCompte.employer ? (
              <>
                <span className="font-medium text-green-600 dark:text-green-400">Employer Account:</span>
                {selectedCompte.employer.firstName} {selectedCompte.employer.lastName}
              </>
            ) : (
              <span className="italic">General Account</span>
            )}
          </div>
        )}
        {errors.compteId?.message && (
          <p className="text-xs text-red-500">{errors.compteId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Class (Optional)</Label>
          <Controller
            name="classId"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={(val) => field.onChange(Number(val))} 
                value={field.value ? String(field.value) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Student (Optional)</Label>
          <Controller
            name="studentId"
            control={control}
            render={({ field }) => (
              <Select 
                onValueChange={(val) => field.onChange(Number(val))} 
                value={field.value ? String(field.value) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Description</Label>
        <Input {...register("description")} placeholder="Optional description" />
        {errors.description?.message && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" className="mt-4">
        {type === "create" ? "Create" : "Update"}
      </Button>
    </form>
  );
};

export default FeeForm;
