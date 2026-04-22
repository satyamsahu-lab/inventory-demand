import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Boxes } from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import { FieldError } from "../components/ui/FieldError";
import { PasswordInput } from "../components/ui/PasswordInput";
import { cn } from "../utils/cn";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export function LoginPage() {
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("hbadmin@yopmail.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

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
        <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.2)] grid place-items-center mb-4">
          <Boxes size={32} />
        </div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-surface-500 text-sm font-medium mt-1">
          Sign in to your inventory control
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
            Email Address
          </label>
          <input
            className={cn(
              "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
              errors.email
                ? "border-rose-500 ring-4 ring-rose-500/10"
                : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
            )}
            value={email}
            type="email"
            placeholder="name@company.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError error={errors.email} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
              Password
            </label>
            <Link
              className="text-[10px] font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.9)] uppercase tracking-wider"
              to="/forgot-password"
            >
              Forgot?
            </Link>
          </div>
          <PasswordInput
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <FieldError error={errors.password} />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] shadow-[0_0_20px_rgba(var(--primary),0.2)] text-base"
        >
          {loading ? "Authenticating..." : "Sign In to Dashboard"}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-surface-100 text-center">
        <p className="text-xs text-surface-400 font-medium">
          Don't have an account?{" "}
          <span className="text-[hsl(var(--primary))] font-bold cursor-pointer hover:underline">
            Contact Administrator
          </span>
        </p>
      </div>
    </div>
  );
}
