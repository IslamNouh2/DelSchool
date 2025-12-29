import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  amount: z.coerce.number().min(0, { message: "Amount must be positive" }),
  date: z.string().min(1, { message: "Date is required" }),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE"], { message: "Invalid payment method" }),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"], { message: "Invalid status" }),
  feeId: z.coerce.number().optional(),
  studentId: z.coerce.number().optional(),
  description: z.string().optional(),
});

interface PaymentFormProps {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess?: () => void;
}

interface FeeItem { id: number; title: string; }
interface StudentItem { id: number; name: string; }

const PaymentForm = ({ type, data, setOpen, onSuccess }: PaymentFormProps) => {
  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "COMPLETED",
      method: "CASH",
    }
  });

  const [fees, setFees] = useState<FeeItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feeRes, studentRes] = await Promise.all([
          api.get("/fees"),
          api.get("/student/list?limit=100"),
        ]);
        setFees(feeRes.data.map((f: any) => ({ id: f.id, title: f.title })));
        setStudents(
          studentRes.data.students.map((s: any) => ({
            id: s.studentId,
            name: `${s.firstName} ${s.lastName}`,
          }))
        );
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load fees and students");
      }
    };
    fetchData();
  }, []);

  // Ensure pre-filled data exists in options
  useEffect(() => {
    if (data?.feeId && data?.feeTitle) {
      setFees(prev => {
        if (prev.find(f => f.id === data.feeId)) return prev;
        return [...prev, { id: data.feeId, title: data.feeTitle }];
      });
    }
    if (data?.studentId && data?.studentName) {
      setStudents(prev => {
        if (prev.find(s => s.id === data.studentId)) return prev;
        return [...prev, { id: data.studentId, name: data.studentName }];
      });
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      if (type === "update") {
        setValue("amount", data.amount);
        setValue("date", data.date ? new Date(data.date).toISOString().split('T')[0] : "");
        setValue("method", data.method);
        setValue("status", data.status);
        setValue("feeId", data.feeId);
        setValue("studentId", data.studentId);
        setValue("description", data.description);
      } else if (type === "create") {
        // Pre-fill for creation (e.g. from Fee list)
        if (data.amount) setValue("amount", data.amount);
        if (data.feeId) setValue("feeId", data.feeId);
        if (data.studentId) setValue("studentId", data.studentId);
      }
    }
  }, [type, data, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        feeId: formData.feeId || undefined,
        studentId: formData.studentId || undefined,
      };
      if (type === "create") {
        await api.post("/payments", payload);
        toast.success("Payment created successfully!");
      } else {
        await api.patch(`/payments/${data.id}`, payload);
        toast.success("Payment updated successfully!");
      }
      if (onSuccess) {
        onSuccess();
      } else {
        setOpen(false);
      }
    } catch (error) {
      console.error("Error submitting payment form:", error);
      toast.error("Something went wrong!");
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" {...register("amount")} placeholder="100.00" />
          {errors.amount?.message && <p className="text-xs text-red-500">{errors.amount.message as string}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Date</Label>
          <Input type="date" {...register("date")} />
          {errors.date?.message && <p className="text-xs text-red-500">{errors.date.message as string}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Method</Label>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.method?.message && <p className="text-xs text-red-500">{errors.method.message as string}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status?.message && <p className="text-xs text-red-500">{errors.status.message as string}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Fee (Optional)</Label>
          <Controller
            name="feeId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value ? String(field.value) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a fee" />
                </SelectTrigger>
                <SelectContent>
                  {fees.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.feeId?.message && <p className="text-xs text-red-500">{errors.feeId.message as string}</p>}
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
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.studentId?.message && <p className="text-xs text-red-500">{errors.studentId.message as string}</p>}
          {data?.className && !data?.studentId && (
             <p className="text-xs text-muted-foreground">
               Target Class: <span className="font-medium">{data.className}</span>
             </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Description (Optional)</Label>
        <Input {...register("description")} placeholder="Optional description" />
        {errors.description?.message && <p className="text-xs text-red-500">{errors.description.message as string}</p>}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit">{type === "create" ? "Create" : "Update"}</Button>
      </div>
    </form>
  );
};

export default PaymentForm;
