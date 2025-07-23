import { useEffect, useState } from "react";
import axios from "axios";

interface Subject {
    subjectId: number;
    subjectName: string;
}

interface SubjectSelectorGridProps {
    selectedSubjects: Subject[];
    onChange: (subjects: Subject[]) => void;
}

export default function SubjectSelectorGrid({
    selectedSubjects,
    onChange,
}: SubjectSelectorGridProps) {
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        axios.get("http://localhost:5000/subjects")
            .then((res) => {
                const subjects = res.data;
                console.log("Fetched subjects:", subjects, typeof subjects);
                setAvailableSubjects(subjects);
            })
            .catch((error) => {
                console.error("Error fetching subjects:", error);
            });
    }, []);

    const handleAdd = (subject: Subject) => {
        if (!selectedSubjects.find((s) => s.subjectId === subject.subjectId)) {
            onChange([...selectedSubjects, subject]);
        }
    };

    const handleRemove = (subjectId: number) => {
        onChange(selectedSubjects.filter((s) => s.subjectId !== subjectId));
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="border p-2">
                <h3 className="font-medium mb-2">Available Subjects</h3>
                {Array.isArray(availableSubjects) && availableSubjects.length > 0 ? (
                    availableSubjects.map((subj) => (
                        <div
                            key={subj.subjectId}
                            className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                            onClick={() => handleAdd(subj)}
                        >
                            {subj.subjectName}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500">No subjects available</div>
                )}
            </div>

            <div className="border p-2">
                <h3 className="font-medium mb-2">Selected Subjects</h3>
                {selectedSubjects.length > 0 ? (
                    selectedSubjects.map((subj) => (
                        <div
                            key={subj.subjectId}
                            className="cursor-pointer hover:bg-red-100 p-2 rounded"
                            onClick={() => handleRemove(subj.subjectId)}
                        >
                            {subj.subjectName}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500">No subjects selected</div>
                )}
            </div>
        </div>
    );
}
