import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  Users,
} from "lucide-react";

import { useAuth } from "../../state/auth";
import { can } from "../../shared/permissions";
import { cn } from "../../shared/ui";
import { useLoader } from "../../shared/loader";

export function AppLayout() {
  const { token } = useAuth();
  const { permissions, clear } = useAuth();
  const location = useLocation();
  const { active } = useLoader();

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
          active ? "opacity-100 backdrop-blur-sm bg-surface-900/5" : "opacity-0 pointer-events-none"
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
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-1">Processing</span>
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
          <div>
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
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-72 bg-white border-r border-surface-100 shrink-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-50/50 to-white pointer-events-none" />
          <nav className="h-full overflow-auto p-4 relative">
            <div className="space-y-1.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group",
                      active
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-100 scale-[1.02]"
                        : "text-surface-500 hover:bg-surface-100 hover:text-brand-600",
                    )}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        "transition-transform group-hover:scale-110",
                        active
                          ? "text-white"
                          : "text-surface-400 group-hover:text-brand-500",
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto bg-surface-50/30">
          <div className="p-8 max-w-[1600px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
