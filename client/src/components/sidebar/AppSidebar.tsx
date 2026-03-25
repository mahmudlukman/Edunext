import {
  Settings2,
  School,
  GraduationCap,
  Users,
  LayoutDashboard,
  Banknote,
  type LucideIcon,
  LogOut,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/navMain";
import { NavUser } from "@/components/sidebar/navUser";
import { TeamSwitcher } from "@/components/sidebar/teamSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { RootState, UserRole } from "@/types";
import { useLocation, useNavigate } from "react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useSelector } from "react-redux";
// import type { RootState } from "@/redux/store";
import { useLogoutMutation } from "@/redux/features/auth/authApi";

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  roles?: UserRole[];
  items?: {
    title: string;
    url: string;
    roles?: UserRole[];
  }[];
}

export const sidebardata = {
  teams: [
    {
      name: "Springfield High",
      logo: School,
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      roles: ["admin", "teacher", "student", "parent"],
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          roles: ["admin", "teacher", "student", "parent"],
        },
        {
          title: "Activities Log",
          url: "/activities-log",
          roles: ["admin"],
        },
      ],
    },
    {
      title: "Academics",
      url: "#",
      icon: School,
      roles: ["admin", "teacher", "student", "parent"],
      items: [
        {
          title: "Classes",
          url: "/classes",
          roles: ["admin", "teacher"],
        },
        {
          title: "Subjects",
          url: "/subjects",
          roles: ["admin", "teacher"],
        },
        {
          title: "Timetable",
          url: "/timetable",
        },
        {
          title: "Attendance",
          url: "/attendance",
        },
      ],
    },
    {
      title: "Learning (LMS)",
      url: "#",
      icon: GraduationCap,
      roles: ["teacher", "student", "admin"],
      items: [
        { title: "Assignments", url: "/lms/assignments" },
        { title: "Exams", url: "/lms/exams" },
        { title: "Study Materials", url: "/lms/materials" },
      ],
    },
    {
      title: "People",
      url: "#",
      icon: Users,
      roles: ["admin", "teacher"],
      items: [
        { title: "Students", url: "/users/students" },
        {
          title: "Teachers",
          url: "/users/teachers",
          roles: ["admin"],
        },
        {
          title: "Parents",
          url: "/users/parents",
          roles: ["admin"],
        },
        {
          title: "Admins",
          url: "/users/admins",
          roles: ["admin"],
        },
      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: Banknote,
      roles: ["admin"],
      items: [
        { title: "Fee Collection", url: "/finance/fees" },
        { title: "Expenses", url: "/finance/expenses" },
        { title: "Salary", url: "/finance/salary" },
      ],
    },
    {
      title: "System",
      url: "#",
      icon: Settings2,
      roles: ["admin"],
      items: [
        { title: "School Settings", url: "/settings/general" },
        { title: "Academic Years", url: "/settings/academic-years" },
        { title: "Roles & Permissions", url: "/settings/roles" },
      ],
    },
  ] as NavItem[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // ── Auth state from Redux (replaces useAuth()) ──────────────────────────────
  const { user } = useSelector((state: RootState) => state.auth);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const location = useLocation();
  const pathname = location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();

  const userData = {
    name: user?.name ?? "User",
    email: user?.email ?? "",
    avatar: "",
  };

  const userRole = (user?.role ?? "student") as UserRole;

  const filteredNav = useMemo(() => {
    return sidebardata.navMain
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .map((item) => {
        const isChildActive = item.items?.some((sub) => sub.url === pathname);
        const isMainActive = item.url === pathname;
        return {
          ...item,
          isActive: isMainActive || isChildActive,
          items: item.items
            ?.filter(
              (subItem) => !subItem.roles || subItem.roles.includes(userRole),
            )
            .map((subItem) => ({
              ...subItem,
              isActive: subItem.url === pathname,
            })),
        };
      });
  }, [pathname, userRole]);

  // ── Logout — mutation dispatches userLoggedOut() automatically ──────────────
  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  // ── year is still read from useAuth if you need it; otherwise remove ────────
  // If you have a separate year slice, read it from there instead:
  // const year = useSelector((state: RootState) => state.year);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Pass yearName as needed — replace with your year selector if available */}
        <TeamSwitcher teams={sidebardata.teams} yearName="" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
      </SidebarContent>
      <SidebarFooter>
        <div
          className={cn(
            "gap-2",
            isCollapsed ? "flex-row space-y-2" : "flex justify-between",
          )}
        >
          <SidebarMenuItem title="Logout">
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              variant="ghost"
              size="icon-sm"
            >
              <LogOut />
            </Button>
          </SidebarMenuItem>
          <ThemeToggle />
        </div>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
