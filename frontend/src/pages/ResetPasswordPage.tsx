import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import { FieldError } from "../components/ui/FieldError";
import { PasswordInput } from "../components/ui/PasswordInput";
import { cn } from "../utils/cn";
import { Button } from "../components/ui/Button";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = resetSchema.safeParse({ password });
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
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.settings?.message ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-premium p-8 shadow-premium-xl animate-slide-up max-w-md w-full">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-premium-gradient text-white shadow-lg shadow-brand-200 grid place-items-center mb-4">
          <ShieldCheck size={30} />
        </div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">
          Set New Password
        </h1>
        <p className="text-surface-500 text-sm font-medium mt-1">
          Create a secure password for your account
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
            New Secure Password
          </label>
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
          disabled={loading || !token}
          className="w-full h-12 shadow-brand-200 text-base"
        >
          {loading ? "Updating..." : "Confirm New Password"}
        </Button>

        {!token && (
          <p className="text-rose-500 text-[10px] font-bold text-center uppercase tracking-widest bg-rose-50 p-3 rounded-xl border border-rose-100">
            Invalid or missing reset token. Please request a new link.
          </p>
        )}
      </form>

      <div className="mt-8 pt-6 border-t border-surface-100 text-center">
        <Link
          className="inline-flex items-center gap-2 text-xs text-brand-600 font-bold hover:text-brand-700 transition-colors uppercase tracking-wider"
          to="/login"
        >
          <ArrowLeft size={14} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
