'use client'

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";
import Link from "next/link";

type DecodedToken = {
    sub: number;
    username: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
};

const menuItems = [
    {
        title: "MENU",
        items: [
            { icon: "/home.png", label: "Home", href: "/", visible: ["admin", "teacher", "student", "parent"] },
            { icon: "/teacher.png", label: "Teachers", href: "/list/teachers", visible: ["admin"] },
            { icon: "/student.png", label: "Students", href: "/list/students", visible: ["admin"] },
            { icon: "/calendar.png", label: "Timetable", href: "/list/timetable", visible: ["admin"] },
            { icon: "/subject.png", label: "Subjects", href: "/list/subjects", visible: ["admin"] },
            { icon: "/class.png", label: "Classes", href: "/list/classes", visible: ["admin"] },
            { icon: "/phone.png", label: "Local", href: "/list/local", visible: ["admin"] },
            { icon: "/lesson.png", label: "Lessons", href: "/list/lessons", visible: ["admin", "teacher"] },
            { icon: "/exam.png", label: "Exams", href: "/list/exams", visible: ["admin", "teacher", "student", "parent"] },
            { icon: "/assignment.png", label: "Assignments", href: "/list/assignments", visible: ["admin", "teacher", "student", "parent"] },
            { icon: "/result.png", label: "Results", href: "/list/results", visible: ["admin", "teacher", "student", "parent"] },
            { icon: "/attendance.png", label: "Attendance", href: "/list/attendance", visible: ["admin"] },
            { icon: "/calendar.png", label: "Events", href: "/list/events", visible: ["admin", "teacher", "student", "parent"] },
        ],
    },
    {
        title: "OTHER",
        items: [
            { icon: "/profile.png", label: "Profile", href: "/profile", visible: ["admin", "teacher", "student", "parent"] },
            { icon: "/setting.png", label: "Settings", href: "/settings", visible: ["admin", "teacher", "student", "parent"] },
            { icon: "/logout.png", label: "Logout", href: "/logout", visible: ["admin", "teacher", "student", "parent"] },
        ],
    },
];

const Menu = () => {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const storedRole = localStorage.getItem("user_role");
        if (storedRole) {
            setRole(storedRole);
        } else {
            // Fallback if needed
            const getTokenFromCookie = (): string | null => {
                const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
                return match ? match[2] : null;
            };

            const token = getTokenFromCookie();
            if (token) {
                try {
                    const decoded = jwtDecode<DecodedToken>(token);
                    setRole(decoded.role?.toLowerCase());
                    localStorage.setItem("user_role", decoded.role?.toLowerCase());
                } catch (error) {
                    console.error("❌ Invalid token:", error);
                }
            }
        }
    }, []);

    if (!role) return null; // or loading spinner

    return (
        <div className="mt-4 text-sm">
            {menuItems.map((section) => (
                <div className="flex flex-col gap-2" key={section.title}>
                    <span className="hidden lg:block text-gray-400 font-light my-4">{section.title}</span>
                    {section.items.map((item) =>
                        item.visible.includes(role) ? (
                            <Link
                                href={item.href}
                                key={item.label}
                                className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                            >
                                <Image src={item.icon} alt={item.label} width={16} height={16} />
                                <span className="hidden lg:block">{item.label}</span>
                            </Link>
                        ) : null
                    )}
                </div>
            ))}
        </div>
    );
};

export default Menu;
