// src/app/(dashboard)/layout.tsx
"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { MessageCircle, Megaphone, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    const pathname = usePathname();
    const { setTheme } = useTheme();

    // Helper to generate breadcrumbs
    const getBreadcrumbs = () => {
        const segments = pathname.split('/').filter(Boolean);
        const items = [];

        // Always start with Dashboard
        items.push({ label: "Tableau de bord", href: "/dashbord", isPage: pathname === "/dashbord" });

        // Route mapping for user-friendly names
        const routeMapping: Record<string, string> = {
            "dashbord": "Tableau de bord",
            "list": "Liste",
            "teachers": "Enseignants",
            "students": "Étudiants",
            "timetable": "Emploi du temps",
            "subjects": "Matières",
            "classes": "Classes",
            "local": "Salles",
            "attendance": "Assiduité",
            "employer": "Personnel",
            "student": "Étudiants",
            "exam": "Examens",
            "grads": "Saisie des notes",
            "results": "Résultats",
            "profile": "Profil",
            "settings": "Paramètres"
        };

        let currentPath = "";

        segments.forEach((segment) => {
            currentPath += `/${segment}`;
            
            // Skip "list" segment in visual breadcrumbs but keep it in path
            if (segment === "list" || segment === "dashbord") return;

            const label = routeMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            
            // Check if it's the last item
            const isLast = currentPath === pathname;

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
        <ThemeProvider attribute="class" defaultTheme="light">
            <SidebarProvider>
                <div className="flex h-screen w-full overflow-hidden">
                    {/* Sidebar */}
                    <AppSidebar />

                    {/* Main Content Area */}
                    <SidebarInset className="flex flex-1 flex-col overflow-hidden">
                        {/* Header */}
                        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center justify-between gap-2 px-4 w-full">
                                <div className="flex items-center gap-2">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator
                                        orientation="vertical"
                                        className="mr-2 data-[orientation=vertical]:h-4"
                                    />
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            {breadcrumbs.map((item, index) => (
                                                <div key={index} className="flex items-center">
                                                    <BreadcrumbItem className="hidden md:block">
                                                        {item.isPage ? (
                                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                                        ) : (
                                                            <BreadcrumbLink href={item.href}>
                                                                {item.label}
                                                            </BreadcrumbLink>
                                                        )}
                                                    </BreadcrumbItem>
                                                    {index < breadcrumbs.length - 1 && (
                                                        <BreadcrumbSeparator className="hidden md:block mx-2" />
                                                    )}
                                                </div>
                                            ))}
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                                
                                {/* Right side: Icons and Theme Toggle */}
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                    <div className="hidden md:flex flex-col">
                                        <span className="text-xs leading-3 font-medium">Username</span>
                                        <span className="text-[10px] text-muted-foreground text-right">Admin</span>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon">
                                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                                <span className="sr-only">Toggle theme</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setTheme("light")}>
                                                Light
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                                                Dark
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setTheme("system")}>
                                                System
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </header>

                        {/* Page Content */}
                        <main className="flex-1 p-6 overflow-y-auto">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    );
}