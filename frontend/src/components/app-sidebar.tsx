"use client"

import { useEffect, useState, useMemo } from "react"
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
  Settings,
  Settings2,
  SquareTerminal,
  User2,
  Wallet,
  Calendar,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
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
import { useAuth } from "@/components/contexts/AuthContext"
import { useTranslations } from "next-intl"

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



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading, hasPermission, hasRole } = useAuth()
  const t = useTranslations("menu")

  const navItems = useMemo(() => {
    // if (loading || !user) {
    //   return [
    //     { title: t("dashboard"), url: "/", icon: SquareTerminal, isActive: true },
    //   ]
    // }

    const isAdmin = hasRole('ADMIN');
    const isTeacher = hasRole('TEACHER');
    const isStudent = hasRole('STUDENT');

    // Generic dashboard URL mapping
    const dashboardUrl = isAdmin
      ? "/admin"
      : isTeacher
        ? "/teachers"
        : isStudent
          ? "/student"
          : "/";

    const items: any[] = [
      { title: t("dashboard"), url: dashboardUrl, icon: SquareTerminal, isActive: true },
    ];

    // Students only items
    if (isStudent && user?.profileId) {
      items.push({ title: t("report_card"), url: `/report-card/${user.profileId}`, icon: FileBadge });
    }

    // Users and Roles (Admin/Manager)
    if (isAdmin || hasPermission('user:read')) {
      items.push({ title: t("employers"), url: "/list/employers", icon: User2 });
    }
    
    if (isAdmin || hasPermission('user:read')) {
        items.push({ title: t("students"), url: "/list/students", icon: BookOpen });
    }

    // Academic items (Admin/Teacher)
    if (isAdmin || isTeacher || hasPermission('subject:read')) {
        items.push({ title: t("subjects"), url: "/list/subjects", icon: BookOpen });
    }
    if (isAdmin || isTeacher || hasPermission('subject:read')) {
        items.push({ title: t("classes"), url: "/list/classes", icon: Frame });
    }
    if (isAdmin || isTeacher || hasPermission('subject:read')) {
        items.push({ title: t("levels"), url: "/list/local", icon: Map });
    }

    // Attendance (Admin/Teacher)
    if (isAdmin || isTeacher || hasPermission('attendance:read')) {
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

    // Exam / Grades (Admin/Teacher/Student)
    if (isAdmin || isTeacher || isStudent || hasPermission('exam:read') || hasPermission('grade:read')) {
        items.push({ title: t("exam"), url: "/list/exam", icon: FileBadge });
    }

    // General items (Every authenticated user usually)
    items.push({ title: t("timetable"), url: "/list/timetable", icon: GalleryVerticalEnd });
    items.push({ title: t("events"), url: "/list/events", icon: Calendar });

    // Finance (Admin/Finance only)
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
  }, [user, loading, t, hasPermission, hasRole])

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

