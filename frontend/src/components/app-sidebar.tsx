"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  User2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
      plan: "Enterprise",
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

type DecodedToken = {
  role?: string
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'))
  return match ? match[2] : null
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = useState<string | null>(null)

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
        { title: "Dashboard", url: "/dashbord", icon: SquareTerminal, isActive: true },
      ]
    }

    if (role === "teacher") {
      return [
        { title: "Dashboard", url: "/dashbord", icon: SquareTerminal, isActive: true },
        { title: "Teacher", url: "/list/teachers", icon: Bot },
      ]
    }

    // Admin: show all principal links (no submenus)
    return [
      { title: "Dashboard", url: "/dashbord", icon: SquareTerminal, isActive: true },
      { title: "Teachers", url: "/list/teachers", icon: User2 },
      { title: "Students", url: "/list/students", icon: BookOpen },
      { title: "Timetable", url: "/list/timetable", icon: GalleryVerticalEnd },
      { title: "Subjects", url: "/list/subjects", icon: BookOpen },
      { title: "Classes", url: "/list/classes", icon: Frame },
      { title: "Local", url: "/list/local", icon: Map },
      {
        title: "Attendance",
        url: "#",
        icon: Settings2,
        items: [
          { title: "Employer", url: "/list/attendance/employer" },
          { title: "Student", url: "/list/attendance/student" },
        ],
      },
    ]
  }, [role])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={staticData.teams} />
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={navItems} />
        <NavProjects projects={staticData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={staticData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
