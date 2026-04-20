import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Boxes } from "lucide-react";

import { api } from "../../shared/api";
import { useAuth } from "../../state/auth";
import { Button } from "../../shared/components/Button";

export function LoginPage() {
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("hbadmin@yopmail.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data.data);
      toast.success("Logged in");
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.settings?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-premium p-8 shadow-premium-xl animate-slide-up">
      <div className="flex flex-col items-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-premium-gradient text-white shadow-lg shadow-brand-200 grid place-items-center mb-4">
          <Boxes size={32} />
        </div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">Welcome Back</h1>
        <p className="text-surface-500 text-sm font-medium mt-1">Sign in to your inventory control</p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Email Address</label>
          <input
            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
            value={email}
            type="email"
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Password</label>
            <Link className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider" to="/forgot-password">
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-2 shadow-brand-200 text-base"
        >
          {loading ? "Authenticating..." : "Sign In to Dashboard"}
        </Button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-surface-100 text-center">
        <p className="text-xs text-surface-400 font-medium">
          Don't have an account? <span className="text-brand-600 font-bold cursor-pointer hover:underline">Contact Administrator</span>
        </p>
      </div>
    </div>
  );
}
