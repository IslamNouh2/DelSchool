"use client"

import {
  BarChart3,
  CreditCard,
  Globe,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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

export function SaaSAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const t = useTranslations("saas_admin")

  const navItems = [
    {
      title: "Overview",
      url: "/saas-admin",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Subscriptions",
      url: "/saas-admin/subscriptions",
      icon: CreditCard,
    },
    {
      title: "Tenants",
      url: "/saas-admin/tenants",
      icon: Globe,
    },
    {
      title: "Security",
      url: "/saas-admin/security",
      icon: ShieldCheck,
    },
    {
      title: "Settings",
      url: "/saas-admin/settings",
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-white/5 bg-[#0d0f1a]">
      <SidebarHeader className="h-20 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight">DelSchool</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Platform Owner</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-white/5 p-4">
        <LanguageSwitcher />
        <NavUser user={{
            name: user?.username || 'SaaS Admin',
            email: user?.email || '',
            avatar: ''
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
