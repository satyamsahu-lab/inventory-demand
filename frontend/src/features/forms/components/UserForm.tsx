import type React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { FieldError } from "../../../components/ui/FieldError";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { cn } from "../../../utils/cn";

interface UserFormProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  roleId: string;
  setRoleId: (val: string) => void;
  roles: { id: string; name: string }[];
  status: string;
  setStatus: (val: string) => void;
  editing: any;
  errors: Record<string, string>;
}

export const UserForm: React.FC<UserFormProps> = ({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  roleId,
  setRoleId,
  roles,
  status,
  setStatus,
  editing,
  errors,
}) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="col-span-2 space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Full Name
        </label>
        <input
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            errors.fullName
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
          )}
          value={fullName}
          placeholder="e.g. John Doe"
          onChange={(e) => setFullName(e.target.value)}
        />
        <FieldError error={errors.fullName} />
      </div>
      <div className="col-span-2 space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Email Address
        </label>
        <input
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            errors.email
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
          )}
          value={email}
          placeholder="e.g. john@company.com"
          onChange={(e) => setEmail(e.target.value)}
          disabled={!!editing}
        />
        <FieldError error={errors.email} />
      </div>
      {!editing && setPassword && (
        <div className="col-span-2 space-y-1.5">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
            Initial Password
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            error={errors.password}
          />
          <FieldError error={errors.password} />
        </div>
      )}
      <div className="col-span-2 space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Assigned Role
        </label>
        <select
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium appearance-none",
            errors.roleId
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500",
          )}
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          <option value="" disabled>
            Select a role
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <FieldError error={errors.roleId} />
      </div>

      <div className="col-span-2 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
            User Status
          </label>
          <div className="flex gap-6 px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="user-status"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="peer appearance-none w-5 h-5 border-2 border-surface-200 rounded-full checked:border-brand-500 transition-all cursor-pointer"
                />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-brand-500 scale-0 peer-checked:scale-100 transition-transform" />
              </div>
              <span className="text-sm font-medium text-surface-600 group-hover:text-surface-900 transition-colors">
                Active
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="user-status"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                  className="peer appearance-none w-5 h-5 border-2 border-surface-200 rounded-full checked:border-rose-500 transition-all cursor-pointer"
                />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-rose-500 scale-0 peer-checked:scale-100 transition-transform" />
              </div>
              <span className="text-sm font-medium text-surface-600 group-hover:text-surface-900 transition-colors">
                Inactive
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
