import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { api } from "../../shared/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <h1 className="text-xl font-semibold">Forgot Password</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded-md py-2 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <div className="mt-4 text-sm">
        <Link className="text-slate-900 underline" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}
