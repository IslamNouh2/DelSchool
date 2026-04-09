"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SaaSAdminSidebar } from "@/components/saas-admin-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { Moon, Sun, Bell, Settings, Search } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function SaaSAdminLayout({
    children,
}: {
    children: ReactNode
}) {
    const { user } = useAuth();
    const { setTheme } = useTheme();
    const locale = useLocale();
    const isRtl = locale === 'ar';

    return (
        <ProtectedRoute>
            <SidebarProvider>
                <div className={`flex h-screen w-full overflow-hidden bg-[#0a0c14] ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    <SaaSAdminSidebar side="left" />

                    <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-[#0a0c14]">
                        {/* Premium Header */}
                        <header className="flex h-20 shrink-0 items-center gap-2 bg-[#0d0f1a] border-b border-white/5 transition-all duration-300">
                            <div className={`flex items-center justify-between gap-2 px-8 w-full ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="flex items-center gap-4">
                                    <SidebarTrigger className="text-white hover:bg-white/10" />
                                    <Separator orientation="vertical" className="h-6 bg-white/10" />
                                    <h1 className="text-xl font-bold text-white tracking-tight">
                                        Platform Control Center
                                    </h1>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-xl text-white hover:bg-white/10">
                                            <Bell className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-xl text-white hover:bg-white/10">
                                            <Settings className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-white leading-tight">Master Admin</span>
                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Global Auth</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm shadow-xl border border-white/20">
                                            <span className="text-white">A</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Content Area */}
                        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </ProtectedRoute>
    );
}
