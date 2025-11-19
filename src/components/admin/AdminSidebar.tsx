import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  Briefcase,
  Store,
  Calendar,
  MessageSquare,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Verification", url: "/admin/verification", icon: ShieldCheck },
  { title: "Properties", url: "/admin/properties", icon: Home },
  { title: "Service Providers", url: "/admin/service-providers", icon: Briefcase },
  { title: "Vendors", url: "/admin/vendors", icon: Store },
  { title: "Bookings", url: "/admin/bookings", icon: Calendar },
  { title: "Reviews", url: "/admin/reviews", icon: MessageSquare },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"}>
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "text-center" : ""}>
            {isCollapsed ? "Admin" : "Admin Management"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 hover:bg-accent transition-all duration-200 active:scale-95 hover:scale-[1.02] ${
                          isActive ? "bg-primary/10 text-primary font-medium" : ""
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 transition-transform duration-200 group-active:scale-110" />
                      {!isCollapsed && <span className="transition-colors duration-200">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
