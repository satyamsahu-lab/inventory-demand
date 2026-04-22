import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Shield,
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
  const { token } = useAuth();
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
    <div className="h-screen w-screen overflow-hidden bg-surface-50 text-surface-900 font-sans">
      <div
        className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500",
          active
            ? "opacity-100 backdrop-blur-sm bg-surface-900/5"
            : "opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-white/80 backdrop-blur-2xl px-8 py-6 rounded-3xl shadow-2xl shadow-brand-200/20 border border-white flex flex-col items-center gap-4 scale-90 active:scale-100 transition-transform duration-500">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-1">
              Processing
            </span>
            <div className="h-1 w-32 bg-brand-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 animate-progress origin-left" />
            </div>
          </div>
        </div>
      </div>
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-surface-200 flex items-center px-6 shrink-0 z-40 relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-premium-gradient text-white shadow-lg shadow-brand-200 grid place-items-center">
            <Boxes size={22} />
          </div>
          <div
            className={cn(
              "transition-all duration-300",
              isSidebarCollapsed && "hidden",
            )}
          >
            <div className="font-bold text-lg tracking-tight text-surface-900">
              Inventory<span className="text-brand-600">Demand</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-surface-400">
              Forecasting & Control
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-surface-600 hover:bg-surface-100 transition-all hover:text-brand-600 active:scale-95"
            onClick={() => clear()}
          >
            <LogOut size={18} />
            <span className={cn(isSidebarCollapsed && "hidden")}>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {!hasZeroPermissions && (
          <aside
            className={cn(
              "bg-white border-r border-surface-100 shrink-0 transition-all duration-300 relative group/sidebar z-50",
              isSidebarCollapsed ? "w-20" : "w-72",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-surface-50/50 to-white pointer-events-none" />

            {/* Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-6 z-50 h-6 w-6 rounded-full bg-white border border-surface-200 shadow-sm flex items-center justify-center text-surface-400 hover:text-brand-600 transition-colors active:scale-95"
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={14} />
              ) : (
                <ChevronLeft size={14} />
              )}
            </button>

            <nav
              className={cn(
                "h-full p-4 relative no-scrollbar",
                isSidebarCollapsed ? "overflow-visible" : "overflow-y-auto",
              )}
            >
              <div className="space-y-1.5">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative",
                        active
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]"
                          : "text-surface-500 hover:bg-surface-100 hover:text-brand-600",
                        isSidebarCollapsed && "justify-center px-2",
                      )}
                    >
                      <Icon
                        size={20}
                        className={cn(
                          "transition-transform group-hover:scale-110 shrink-0",
                          active
                            ? "text-white"
                            : "text-surface-400 group-hover:text-brand-500",
                        )}
                      />

                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {/* Tooltip on Hover when collapsed */}
                      {isSidebarCollapsed && (
                        <div className="fixed left-20 ml-2 px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-2xl border border-white/10">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-brand-600" />
                        </div>
                      )}

                      {active && !isSidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0 overflow-auto bg-surface-50/30 transition-all duration-300">
          <div className="p-8 w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
