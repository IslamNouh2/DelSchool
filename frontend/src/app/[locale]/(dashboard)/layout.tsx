// src/app/(dashboard)/layout.tsx
"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { MessageCircle, Megaphone, Moon, Sun, Bell } from "lucide-react";
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

export default function DashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    const { user } = useAuth();
    const pathname = usePathname();
    const { setTheme } = useTheme();
    const t = useTranslations("menu");
    const commonT = useTranslations("common");
    const locale = useLocale();
    const isRtl = locale === 'ar';

    // Helper to generate breadcrumbs
    const getBreadcrumbs = () => {
        const segments = pathname.split('/').filter(Boolean).filter(s => !['en', 'ar', 'fr'].includes(s));
        const items = [];

        // Always start with Dashboard
        items.push({ label: t("dashboard"), href: "/dashboard", isPage: pathname.includes("/dashboard") && segments.length === 1 });

        let pathContext = "";
        let currentPath = "";

        segments.forEach((segment) => {
            currentPath += `/${segment}`;
            
            // Skip "list" segment in visual breadcrumbs but keep it in path
            if (segment === "list" || segment === "dashboard") return;

            let label = segment;
            
            // Generate full key based on current context
            const fullKey = pathContext ? `${pathContext}.${segment}` : segment;

            // Resolver helper — use t.has() to avoid console errors for missing keys
            const resolveTranslation = (key: string) => {
                const titleKey = `${key}.title`;
                if (t.has(titleKey as any)) {
                    return { label: t(titleKey as any), context: key };
                }
                if (t.has(key as any)) {
                    return { label: t(key as any), context: key };
                }
                return null;
            };

            // Strategy: 1. Full context key -> 2. Isolated segment key -> 3. Common namespace -> 4. Fallback
            const resolved = resolveTranslation(fullKey) || resolveTranslation(segment);
            
            if (resolved) {
                label = resolved.label;
                pathContext = resolved.context;
            } else {
                try {
                    // Reset path context if we shift to common namespace or fallback
                    label = commonT(segment as any);
                } catch (e) {
                    label = segment.charAt(0).toUpperCase() + segment.slice(1);
                }
                pathContext = ""; 
            }
            
            // Check if it's the last item
            const isLast = pathname.endsWith(segment);

            items.push({ 
                label: label, 
                href: currentPath, 
                isPage: isLast 
            });
        });

        return items;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <ProtectedRoute>
            <SidebarProvider>
                <div className={`flex h-screen w-full overflow-hidden ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Sidebar */}
                    <AppSidebar side="left" />

                    {/* Main Content Area */}
                    <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-[#0b0d17] transition-colors duration-300">
                        {/* Header */}
                        <header className="flex h-20 shrink-0 items-center gap-2 bg-white dark:bg-[#1a1c2e] text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/5 transition-all duration-300">
                            <div className={`flex items-center justify-between gap-2 px-6 w-full ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex items-center gap-6 flex-1 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <SidebarTrigger className="text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10" />
                                        <Separator
                                            orientation="vertical"
                                            className="mx-2 h-4 bg-gray-200 dark:bg-white/20"
                                        />
                                        <h1 className="text-xl font-bold hidden lg:block tracking-tight text-gray-900 dark:text-white">
                                            {commonT("welcome")} {user?.username} 👋
                                        </h1>
                                    </div>
                                    
                                    {/* Integrated Search */}
                                    <div className={`hidden md:flex relative w-full max-w-md ${isRtl ? 'mr-4' : 'ml-4'}`}>
                                        <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                        </div>
                                        <input 
                                            type="search" 
                                            placeholder={commonT("search")} 
                                            className={`w-full bg-gray-100 dark:bg-[#252839] border border-gray-200 dark:border-none rounded-xl py-2 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-gray-900 dark:text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner`}
                                        />
                                    </div>
                                </div>
                                
                                {/* Right side: Icons and User Profile */}
                                <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <Button variant="ghost" size="icon" className="rounded-xl text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 relative">
                                            <Bell className="h-5 w-5" />
                                            <span className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1c2e]`}></span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-xl text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                                            <MessageCircle className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className={`flex items-center gap-3 ${isRtl ? 'pr-6 border-r' : 'pl-6 border-l'} border-gray-200 dark:border-white/10 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`hidden lg:flex flex-col ${isRtl ? 'items-start' : 'items-end'}`}>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.username}</span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{user?.role}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0052cc] to-blue-400 border-2 border-white/20 flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden">
                                            <span className="text-white">{user?.username?.charAt(0).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-xl text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10">
                                                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align={isRtl ? "start" : "end"} className="bg-white dark:bg-[#1a1c2e] border-gray-200 dark:border-white/5">
                                                <DropdownMenuItem className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-white/10" onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                                                <DropdownMenuItem className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-white/10" onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                                                <DropdownMenuItem className="text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-white/10" onClick={() => setTheme("system")}>System</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Breadcrumbs Row (Secondary) - Adaptive */}
                        <div className="bg-white/80 dark:bg-[#1a1c2e]/60 backdrop-blur-md border-b border-gray-200 dark:border-white/5 px-6 py-2 flex items-center justify-between transition-colors duration-300">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbs.map((item, index) => (
                                        <div key={index} className="flex items-center">
                                            <BreadcrumbItem className="hidden md:block">
                                                {item.isPage ? (
                                                    <BreadcrumbPage className="text-xs font-bold text-gray-900 dark:text-white/90">{item.label}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={item.href} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                                        {item.label}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {index < breadcrumbs.length - 1 && (
                                                <BreadcrumbSeparator className="hidden md:block mx-2 text-gray-300 dark:text-white/10" />
                                            )}
                                        </div>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                        {/* Page Content */}
                        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </ProtectedRoute>
    );
}