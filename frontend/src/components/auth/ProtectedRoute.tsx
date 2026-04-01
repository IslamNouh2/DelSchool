"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router, mounted]);

    // ✅ السيرفر والكلاينت يرندران نفس الشيء أول مرة
    if (!mounted || loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-[#0b0d17]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}