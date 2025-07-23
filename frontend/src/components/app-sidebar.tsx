"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarProvider,
    useSidebar,
} from "@/components/ui/sidebar";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ChevronRight, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import Link from "next/link";
import { items } from "@/lib/data";
import React, { useEffect } from "react";

export function AppSidebar() {
    const [open, setOpen] = React.useState(true);
    const { isMobile } = useSidebar?.() || { isMobile: false };

    // Close sidebar when clicking on mobile menu items
    const handleItemClick = () => {
        if (isMobile) {
            setOpen(false);
        }
    };

    return (
        <SidebarProvider open={open} onOpenChange={setOpen}>
            {/* Toggle Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`fixed z-50 p-2 rounded-md transition-all ${open ? 'left-64' : 'left-4'
                    } top-4 bg-gray-100 dark:bg-gray-800`}
            >
                {open ? (
                    <PanelLeftClose className="h-5 w-5" />
                ) : (
                    <PanelLeftOpen className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle Sidebar</span>
            </button>

            <Sidebar
                className={`h-screen w-64 fixed z-50 bg-white shadow-md transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"
                    } ${isMobile ? "absolute" : "relative"}`}
            >
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Menu</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <Collapsible key={item.title}>
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton>
                                                    <item.icon className="mr-2 h-4 w-4" />
                                                    <span>{item.title}</span>
                                                    {item.subItems && (
                                                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                                    )}
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            {item.subItems && (
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.subItems.map((sub) => (
                                                            <SidebarMenuSubItem
                                                                key={sub.title}
                                                                onClick={handleItemClick}
                                                            >
                                                                <Link href={sub.href}>
                                                                    {sub.title}
                                                                </Link>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            )}
                                        </SidebarMenuItem>
                                    </Collapsible>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </SidebarProvider>
    );
}