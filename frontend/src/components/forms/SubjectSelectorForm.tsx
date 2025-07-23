import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Props = {
    localId: number;
    onClose: () => void;

};

const SubjectSelectorForm: React.FC<Props> = ({ localId, onClose }) => {
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                // Fetch all available subjects
                const allRes = await api.get("/subject", { withCredentials: true });
                const all = allRes.data.subject || [];

                // Fetch already assigned subjects for this local
                const assignedRes = await api.get(`/subject-local/${localId}`, {
                    withCredentials: true,
                });
                const assignedRaw = assignedRes.data.subjects || [];
                const assigned = assignedRaw.map((s: any) => s.subject);
                //console.log(assigned);

                const assignedIds = new Set(assigned.map((s: any) => s.subjectId));
                const available = all.filter((s: any) => !assignedIds.has(s.subjectId));

                setAllSubjects(available);
                setSelectedSubjects(assigned);
            } catch (err) {
                console.error("❌ Error fetching subjects", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load subjects.",
                });
            }
        };

        fetchSubjects();
    }, [localId]);

    const moveToRight = (subject: any) => {
        setAllSubjects((prev) => prev.filter((s) => s.subjectId !== subject.subjectId));
        setSelectedSubjects((prev) => [...prev, { ...subject, __new: true }]);
    };
    const moveToLeft = async (subject: any) => {
        if (subject.__new) {
            // Not yet inserted to DB — just revert back in UI
            setSelectedSubjects((prev) =>
                prev.filter((s) => s.subjectId !== subject.subjectId)
            );
            setAllSubjects((prev) => [...prev, subject]);
        } else {
            try {
                await api.delete(`/subject-local/${localId}/${subject.subjectId}`, {
                    withCredentials: true,
                });

                setSelectedSubjects((prev) =>
                    prev.filter((s) => s.subjectId !== subject.subjectId)
                );
                setAllSubjects((prev) => [...prev, subject]);
            } catch (err: any) {
                console.error("❌ Remove subject error:", err);
                // toast({
                //     variant: "destructive",
                //     title: "Error",
                //     description:
                //         err.response?.data?.message || "Failed to remove subject.",
                // });
            }
        }
    };
    

    const handleSubmit = async () => {
        try {
            await api.post(
                "/subject-local/bulk-insert",
                {
                    localId,
                    subjectIds: selectedSubjects.map((s) => s.subjectId),
                },
                { withCredentials: true }
            );

            toast({
                title: "Success!",
                description: "Subjects linked successfully.",
            });

            onClose();
        } catch (err) {
            console.error("❌ Bulk assign error:", err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign subjects.",
            });
        }
    };

    return (
        <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Assign Subjects to Local</h2>
            <div className="grid grid-cols-2 gap-6">
                {/* Available Subjects */}
                <div className="border p-4 rounded shadow overflow-auto">
                    <h3 className="text-md font-medium mb-2">Available Subjects</h3>
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border px-4 py-2 text-left">Subject Name</th>
                                <th className="border px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="text-center text-gray-400 py-4">
                                        No subjects available.
                                    </td>
                                </tr>
                            ) : (
                                allSubjects.map((subject) => (
                                    <tr key={subject.subjectId} className="hover:bg-gray-100">
                                        <td className="border px-4 py-2">{subject.subjectName}</td>
                                        <td
                                            className="border px-4 py-2 text-center text-blue-600 hover:text-blue-800 cursor-pointer"
                                            onClick={() => moveToRight(subject)}
                                        >
                                            Select
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Selected Subjects */}
                <div className="border p-4 rounded shadow overflow-auto">
                    <h3 className="text-md font-medium mb-2">Selected Subjects</h3>
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-green-200">
                                <th className="border px-4 py-2 text-left">Subject Name</th>
                                <th className="border px-4 py-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="text-center text-gray-400 py-4">
                                        No subjects selected.
                                    </td>
                                </tr>
                            ) : (
                                selectedSubjects.map((subject) => (
                                    <tr key={subject.subjectId} className="hover:bg-green-100">
                                        <td className="border px-4 py-2">{subject.subjectName}</td>
                                        <td
                                            className="border px-4 py-2 text-center text-red-600 hover:text-red-800 cursor-pointer"
                                            onClick={() => moveToLeft(subject)}
                                        >
                                            Remove
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Button onClick={handleSubmit} className="mt-4">
                OK
            </Button>
        </div>
    );
};

export default SubjectSelectorForm;
