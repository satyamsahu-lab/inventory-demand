import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { api } from "../../shared/api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") ?? "", [params]);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
      <h1 className="text-xl font-semibold">Reset Password</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={password}
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-slate-900 text-white rounded-md py-2 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
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
