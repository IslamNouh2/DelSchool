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

type DecodedToken = {
  role?: string
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'))
  return match ? match[2] : null
}

import { useTranslations } from "next-intl"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<string | null>(null)
  const t = useTranslations("menu")

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role")
    if (storedRole) {
      setRole(storedRole)
      return
    }
    const token = getTokenFromCookie()
    if (!token) return
    // Lazy import to avoid bundling cost unless needed
    import("jwt-decode").then(({ jwtDecode }) => {
      try {
        const decoded = jwtDecode<DecodedToken>(token)
        const normalizedRole = decoded.role ? decoded.role.toLowerCase() : null
        if (normalizedRole) {
          setRole(normalizedRole)
          localStorage.setItem("user_role", normalizedRole)
        }
      } catch (_e) {
        // ignore invalid token
      }
    })
  }, [])


  const navItems = React.useMemo(() => {
    // Default minimal while role loads
    if (!role) {
      return [
        { title: t("dashboard"), url: "/dashboard", icon: SquareTerminal, isActive: true },
      ]
    }

    if (role === "TEACHER") {
      return [
        { title: t("dashboard"), url: "/dashboard", icon: SquareTerminal, isActive: true },
        { title: t("employers"), url: "/list/employers", icon: Bot },
        {
          title: t("exam"),
          url: "#",
          icon: FileBadge,
          items: [
            { title: t("exam"), url: "/list/exam", icon: FileBadge },
            { title: t("exam"), url: "/list/exam/grads" },
          ],
        },
        { title: t("events"), url: "/list/events", icon: Calendar },
      ]
    }

    // Admin: show all principal links (no submenus)
    return [
      { title: t("dashboard"), url: "/dashboard", icon: SquareTerminal, isActive: true },
      { title: t("employers"), url: "/list/employers", icon: User2 },
      { title: t("students"), url: "/list/students", icon: BookOpen },
      { title: t("timetable"), url: "/list/timetable", icon: GalleryVerticalEnd },
      { title: t("subjects"), url: "/list/subjects", icon: BookOpen },
      { title: t("classes"), url: "/list/classes", icon: Frame },
      { title: t("levels"), url: "/list/local", icon: Map },
      {
        title: t("attendance.title"),
        url: "#",
        icon: Settings2,
        items: [
          { title: t("attendance.employer"), url: "/list/attendance/employer" },
          { title: t("attendance.student"), url: "/list/attendance/student" },
        ],
      },
      { title: t("exam"), url: "/list/exam", icon: FileBadge },
      { title: t("events"), url: "/list/events", icon: Calendar },
      {
        title: t("finance.title"),
        url: "#",
        icon: BadgeDollarSign,
        items: [
          { title: t("finance.dashboard"), url: "/finance", icon: SquareTerminal }, // New Link
          { title: t("finance.fee_student"), url: "/list/studentfee", icon: BadgeDollarSign },
          { title: t("finance.fee_templates"), url: "/list/feestemplate", icon: BadgeDollarSign },
          { title: t("finance.comptes"), url: "/list/comptes", icon: BadgeDollarSign },
          { title: t("finance.payroll"), url: "/list/payroll", icon: BadgeDollarSign },
          { title: t("finance.expenses"), url: "/list/expenses", icon: BadgeDollarSign },
        ],
      },
      { title: t("treasury"), url: "/list/treasury", icon: Wallet },
      
      {
        title: t("settings.title"),
        url: "#",
        icon: Settings,
        items: [
          { title: t("settings.general"), url: "/list/settings", icon: Settings2 },
          { title: t("settings.users"), url: "#", icon: User2 },
          { title: t("settings.roles"), url: "#", icon: User2 },
          { title: t("settings.parameters"), url: "/list/settings/parameters", icon: Settings2 },
        ],
      },
    ]
  }, [role, t])

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
        {/* <NavProjects projects={staticData.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staticData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
