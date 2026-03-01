"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  AudioWaveform,
  BadgeDollarSign,
  BookOpen,
  Bot,
  Command,
  CreditCard,
  FileBadge,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  User2,
  Wallet,
  Calendar,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Static display data
const staticData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "DelSchool",
      logo: GalleryVerticalEnd,
      plan: "enterprise",
    },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
}

import { useAuth } from "@/components/contexts/AuthContext"
import { useTranslations } from "next-intl"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading, hasPermission, hasRole } = useAuth()
  const t = useTranslations("menu")

  const navItems = React.useMemo(() => {
    if (loading || !user) {
      return [
        { title: t("dashboard"), url: "/dashboard", icon: SquareTerminal, isActive: true },
      ]
    }

    const isAdmin = hasRole('ADMIN');

    const items: any[] = [
      { title: t("dashboard"), url: "/dashboard", icon: SquareTerminal, isActive: true },
    ];

    // Users and Roles
    if (isAdmin || hasPermission('user:read')) {
      items.push({ title: t("employers"), url: "/list/employers", icon: User2 });
    }
    
    if (isAdmin || hasPermission('user:read')) {
        items.push({ title: t("students"), url: "/list/students", icon: BookOpen });
    }

    // Classes / Subjects / Levels
    if (isAdmin || hasPermission('subject:read')) {
        items.push({ title: t("subjects"), url: "/list/subjects", icon: BookOpen });
    }
    if (isAdmin || hasPermission('subject:read')) {
        items.push({ title: t("classes"), url: "/list/classes", icon: Frame });
    }
    if (isAdmin || hasPermission('subject:read')) {
        items.push({ title: t("levels"), url: "/list/local", icon: Map });
    }

    // Attendance
    if (isAdmin || hasPermission('attendance:read')) {
        items.push({
            title: t("attendance.title"),
            url: "#",
            icon: Settings2,
            items: [
              { title: t("attendance.employer"), url: "/list/attendance/employer" },
              { title: t("attendance.student"), url: "/list/attendance/student" },
            ],
        });
    }

    // Exam / Grades
    if (isAdmin || hasPermission('exam:read') || hasPermission('grade:read')) {
        items.push({ title: t("exam"), url: "/list/exam", icon: FileBadge });
    }

    items.push({ title: t("timetable"), url: "/list/timetable", icon: GalleryVerticalEnd });
    items.push({ title: t("events"), url: "/list/events", icon: Calendar });

    // Finance (Admin/Manager only usually, but let's check permission)
    if (isAdmin || hasPermission('finance:read')) {
        items.push({
            title: t("finance.title"),
            url: "#",
            icon: BadgeDollarSign,
            items: [
              { title: t("finance.dashboard"), url: "/finance", icon: SquareTerminal },
              { title: t("finance.fee_student"), url: "/list/studentfee", icon: BadgeDollarSign },
              { title: t("finance.fee_templates"), url: "/list/feestemplate", icon: BadgeDollarSign },
              { title: t("finance.comptes"), url: "/list/comptes", icon: BadgeDollarSign },
              { title: t("finance.payroll"), url: "/list/payroll", icon: BadgeDollarSign },
              { title: t("finance.expenses"), url: "/list/expenses", icon: BadgeDollarSign },
            ],
        });
        items.push({ title: t("treasury"), url: "/list/treasury", icon: Wallet });
    }

    // Settings (Admin only)
    if (isAdmin) {
        items.push({
            title: t("settings.title"),
            url: "#",
            icon: Settings,
            items: [
              { title: t("settings.general"), url: "/list/settings", icon: Settings2 },
              { title: t("settings.users"), url: "/list/settings/users", icon: User2 },
              { title: t("settings.roles"), url: "/list/settings/roles", icon: User2 },
              { title: t("settings.parameters"), url: "/list/settings/parameters", icon: Settings2 },
            ],
        });
    }

    return items;
  }, [user, loading, t])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={staticData.teams.map(team => ({ ...team, plan: t(team.plan as any) }))} />
        <SidebarMenu>
          <SidebarMenuItem className="px-2 pb-2">
            <LanguageSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
            name: user?.username || 'Guest',
            email: user?.email || '',
            avatar: ''
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

