import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Shield,
  ShoppingCart,
  Sparkles,
  Tag,
  Tags,
  User,
  Users,
} from "lucide-react";

import { can } from "../../services/permissions";
import { cn } from "../../utils/cn";
import { useLoader } from "../../services/loader";
import { useAuth } from "../../store/auth";

export function AppLayout() {
  const { user, token } = useAuth();
  const { permissions, clear } = useAuth();
  const location = useLocation();
  const { active } = useLoader();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      module: "Dashboard",
      show: can(permissions as any, "Dashboard", "view"),
    },
    {
      to: "/users",
      label: "Users",
      icon: Users,
      module: "Users",
      show: can(permissions as any, "Users", "view"),
    },
    {
      to: "/roles",
      label: "Roles",
      icon: Shield,
      module: "Roles",
      show: can(permissions as any, "Roles", "view"),
    },
    {
      to: "/permissions",
      label: "Permissions",
      icon: KeyRound,
      module: "Permissions",
      show: can(permissions as any, "Permissions", "view"),
    },
    {
      to: "/products",
      label: "Products",
      icon: Boxes,
      module: "Products",
      show: can(permissions as any, "Products", "view"),
    },
    {
      to: "/categories",
      label: "Categories",
      icon: Tag,
      module: "categories",
      show: can(permissions as any, "Categories", "view"),
    },
    {
      to: "/subcategories",
      label: "Subcategories",
      icon: Tags,
      module: "categories",
      show: can(permissions as any, "Categories", "view"),
    },
    {
      to: "/inventory",
      label: "Inventory",
      icon: ClipboardList,
      module: "Inventory",
      show: can(permissions as any, "Inventory", "view"),
    },
    {
      to: "/sales",
      label: "Sales",
      icon: BarChart3,
      module: "Sales",
      show: can(permissions as any, "Sales", "view"),
    },
    {
      to: "/activity-logs",
      label: "Activity Logs",
      icon: History,
      module: "Audit Logs",
      show: can(permissions as any, "Audit Logs", "view"),
    },
    {
      to: "/orders",
      label: "Orders",
      icon: ShoppingCart,
      module: "Orders",
      show: can(permissions as any, "Orders", "view"),
    },
    {
      to: "/my-profile",
      label: "My Profile",
      icon: User,
      show: true,
    },
  ];

  const visibleNavItems = navItems.filter((i) => i.show);
  const hasZeroPermissions = !navItems.some((i) => i.module && i.show);

  // Redirect to no-permission if zero permissions (except when already there or on profile)
  if (
    hasZeroPermissions &&
    location.pathname !== "/no-permission" &&
    location.pathname !== "/my-profile"
  ) {
    return <Navigate to="/no-permission" replace />;
  }

  // Authorization check for current route
  const currentNavItem = navItems.find((i) => i.to === location.pathname);
  if (currentNavItem && !currentNavItem.show) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans">
      <div
        className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500",
          active
            ? "opacity-100 backdrop-blur-sm bg-black/20"
            : "opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-white/90 backdrop-blur-2xl px-8 py-6 rounded-3xl shadow-2xl border border-white/20 flex flex-col items-center gap-4 scale-90 active:scale-100 transition-transform duration-500">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-[hsl(var(--primary-glow)/0.2)] border-t-[hsl(var(--primary))] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-[0.2em] mb-1">
              Processing
            </span>
            <div className="h-1 w-32 bg-[hsl(var(--primary-glow)/0.1)] rounded-full overflow-hidden">
              <div className="h-full bg-[hsl(var(--primary))] animate-progress origin-left" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {!hasZeroPermissions && (
          <aside
            className={cn(
              "bg-[hsl(var(--sidebar-background))] shrink-0 transition-all duration-300 relative z-50 flex flex-col",
              isSidebarCollapsed ? "w-20" : "w-72",
            )}
          >
            {/* Sidebar Header/Logo */}
            <div className="p-6 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[0_0_20px_rgba(251,191,36,0.3)] grid place-items-center shrink-0">
                <Sparkles size={24} fill="currentColor" />
              </div>
              {!isSidebarCollapsed && (
                <div className="animate-fade-in">
                  <div className="font-bold text-lg tracking-tight text-white leading-tight">
                    Inventory
                    <span className="text-[hsl(var(--sidebar-primary))]">
                      Demand
                    </span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--sidebar-foreground)/0.6)] leading-tight">
                    Forecasting & Control
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 mb-6">
              <div className="h-px bg-[hsl(var(--sidebar-border)/0.5)] w-full" />
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-24 z-50 h-6 w-6 rounded-full bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={14} strokeWidth={3} />
              ) : (
                <ChevronLeft size={14} strokeWidth={3} />
              )}
            </button>

            <nav
              className={cn(
                "flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar",
              )}
            >
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group relative",
                      isActive
                        ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[0_8px_20px_-4px_rgba(251,191,36,0.4)]"
                        : "text-[hsl(var(--sidebar-foreground)/0.8)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white",
                      isSidebarCollapsed && "justify-center px-2",
                    )}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        "transition-transform group-hover:scale-110 shrink-0",
                        isActive
                          ? "text-[hsl(var(--sidebar-primary-foreground))]"
                          : "text-[hsl(var(--sidebar-foreground)/0.6)] group-hover:text-white",
                      )}
                    />

                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {/* Tooltip on Hover when collapsed */}
                    {isSidebarCollapsed && (
                      <div className="fixed left-20 ml-2 px-3 py-1.5 bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-xl border border-white/10">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[hsl(var(--sidebar-primary))]" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer - User Profile */}
            <div className="p-4 mt-auto">
              <div className="h-px bg-[hsl(var(--sidebar-border)/0.5)] w-full mb-4" />
              <div
                className={cn(
                  "bg-[hsl(var(--sidebar-accent)/0.5)] rounded-2xl p-3 flex items-center gap-3 transition-all",
                  isSidebarCollapsed ? "justify-center" : "px-4",
                )}
              >
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] flex items-center justify-center font-bold shrink-0 shadow-lg">
                  {user?.name?.charAt(0) || "U"}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm font-bold text-white truncate">
                      {user?.name || "User"}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--sidebar-foreground)/0.5)] truncate">
                      {user?.email || "user@example.com"}
                    </div>
                  </div>
                )}
                {!isSidebarCollapsed && (
                  <button
                    onClick={() => clear()}
                    className="p-1.5 rounded-lg text-[hsl(var(--sidebar-foreground)/0.4)] hover:text-[hsl(var(--sidebar-primary))] hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0 overflow-auto bg-[hsl(var(--background))] transition-all duration-300">
          <div className="p-8 w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
