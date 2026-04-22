import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../store/auth";

export function AuthLayout() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/20 rounded-full blur-[120px] animate-pulse-soft" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-[120px] animate-pulse-soft"
        style={{ animationDelay: "1s" }}
      />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
}
