"use client"

import * as React from "react"
import {
  CalendarDaysIcon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const mainMenu = [
  { title: "Dashboard", url: "/p", icon: <LayoutDashboardIcon /> },
  { title: "Presence", url: "/p/presence", icon: <ClipboardCheckIcon /> },
  { title: "Work Permit", url: "/p/work-permit", icon: <ShieldCheckIcon /> },
]

const userManagement = [
  { title: "Employee", url: "/p/employee", icon: <UsersIcon /> },
  { title: "Working calendar", url: "/p/working-calendar", icon: <CalendarDaysIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()
  const user = {
    name: session?.user.name ?? "",
    email: session?.user.email ?? "",
    avatar: session?.user.image ?? "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <p className="px-2 py-1 font-semibold group-data-[collapsible=icon]:hidden">
          Afia Care
        </p>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Main Menu" items={mainMenu} />
        <NavMain label="User Management" items={userManagement} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
