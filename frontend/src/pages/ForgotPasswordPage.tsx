import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { KeyRound, ArrowLeft } from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import { FieldError } from "../components/ui/FieldError";
import { cn } from "../utils/cn";
import { Button } from "../components/ui/Button";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const result = forgotSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("If the email exists, a reset link has been sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.settings?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-premium p-8 shadow-premium-xl animate-slide-up max-w-md w-full">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-14 w-14 rounded-2xl bg-premium-gradient text-white shadow-lg shadow-[hsl(var(--primary)/0.2)] grid place-items-center mb-4">
          <KeyRound size={30} />
        </div>
        <h1 className="text-2xl font-black text-surface-900 tracking-tight">
          Recover Password
        </h1>
        <p className="text-surface-500 text-sm font-medium mt-1">
          Enter your email to receive a recovery link
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
            Registered Email
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 shadow-[hsl(var(--primary)/0.1)] text-base"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-surface-100 text-center">
        <Link
          className="inline-flex items-center gap-2 text-xs text-[hsl(var(--primary))] font-bold hover:text-[hsl(var(--primary)/0.8)] transition-colors uppercase tracking-wider"
          to="/login"
        >
          <ArrowLeft size={14} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
