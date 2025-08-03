import { notFound } from "next/navigation";
import api from "@/lib/api";
import TeacherEmployer from "@/components/forms/page/teacherForm";
import EmployerForm from "@/components/forms/page/employerForm";

interface PageProps {
    params: {
        id: string;
    };
}

export default async function Page({ params }: PageProps) {
    const { id } = params;

    try {
        const res = await api.get(`/employer/${id}`, {
            withCredentials: true,
        });
        const employer = res.data;

        if (!employer) return notFound();

        const isTeacher = employer.type === "teacher";

        return (
            <div className="p-4">
                {isTeacher ? (
                    <TeacherEmployer employer={employer} />
                ) : (
                    <EmployerForm  />
                )}
            </div>
        );
    } catch (err) {
        console.error("Failed to fetch employer:", err);
        return notFound();
    }
}
