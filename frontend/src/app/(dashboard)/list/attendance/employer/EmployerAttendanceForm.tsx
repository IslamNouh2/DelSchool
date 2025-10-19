"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}

export function EmployerAttendanceForm({ open, onOpenChange }: Props) {
    const employers = [
        { id: 1, name: "Mr. Samir", status: "" },
        { id: 2, name: "Ms. Nadia", status: "" },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Employer Attendance</DialogTitle>
                </DialogHeader>

                <table className="w-full border text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-center">Last 7 Days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employers.map((s) => (
                            <tr key={s.id} className="border-b">
                                <td className="p-2">{s.name}</td>
                                <td className="p-2 text-center space-x-2">
                                    <Button size="sm" variant="default">Present</Button>
                                    <Button size="sm" variant="destructive">Absent</Button>
                                    <Button size="sm" variant="outline">Late</Button>
                                </td>
                                <td className="p-2 text-center text-muted-foreground">🟢🟢🔴🟡🟢🔴🟢</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end pt-4">
                    <Button onClick={() => onOpenChange(false)}>Save</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
