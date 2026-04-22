import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../utils/cn";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function PasswordInput({
  className,
  error,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="relative group">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn(
          "w-full bg-surface-50 border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none transition-all font-medium",
          error
            ? "border-rose-500 ring-4 ring-rose-500/10"
            : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          className,
        )}
      />
      <button
        type="button"
        onClick={togglePassword}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors focus:outline-none"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
