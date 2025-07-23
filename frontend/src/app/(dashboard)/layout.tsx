// src/app/(dashboard)/layout.tsx
"use client";

import { ReactNode } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Link from "next/link";
import Image from "next/image";
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <div className="h-screen flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-[13%] md:w-[8%] lg:w-[16%] xl:w-[13%] p-4 bg-white border-r">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 lg:justify-start mb-6"
                    >
                        <Image src="/logo.png" alt="logo" width={32} height={32} />
                        <span className="hidden lg:block font-semibold text-lg">Del.School</span>
                    </Link>
                    <Menu />
                </div>

                {/* Main Content */}
                <div className="w-[87%] md:w-[92%] lg:w-[84%] xl:w-[87%] bg-slate-100 flex-1 flex flex-col overflow-hidden">
                    <Navbar />
                    <main className="flex-1 overflow-auto p-6">
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            
                            {children}
                            <Toaster richColors position="top-right" />
                        </ThemeProvider>
                    </main>
                </div>
            </div>
        </ThemeProvider>

    );
}

function MainLayout({ children }: { children: ReactNode }) {
    const { open, isMobile } = useSidebar();

    return (
        <div className="flex h-screen w-screen overflow-hidden relative">
            {/* Optional overlay for mobile */}
            {isMobile && open && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50"
                    onClick={() => {
                        // Close sidebar on overlay click
                        const event = new CustomEvent("sidebar-toggle", { detail: false });
                        window.dispatchEvent(event);
                    }}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed z-50 h-full w-64 bg-white border-r shadow transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"
                    } ${isMobile ? "absolute" : "relative"}`}
            >
                <AppSidebar />
            </div>

            {/* Main Content */}
            <div
                className={`transition-all duration-300 h-full overflow-y-auto ${open && !isMobile ? "ml-4" : "ml-0 w-full"
                    }`}
            >
                <main className="p-4 min-h-full bg-gray-50">{children}</main>
            </div>
        </div>
    );
}
