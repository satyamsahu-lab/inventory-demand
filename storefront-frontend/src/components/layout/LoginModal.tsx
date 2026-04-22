import { useState } from "react";
import { X, Mail, Lock, User, ArrowRight } from "lucide-react";
import { publicApi } from "../../services/public-api";
import { useUserAuth } from "../../store/user-auth";
import { PasswordInput } from "../ui/PasswordInput";
import { cn } from "../../utils/cn";
import toast from "react-hot-toast";

export function LoginModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setUserAuth } = useUserAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await publicApi.post("/public/auth/user/login", {
          email: formData.email,
          password: formData.password,
        });
        setUserAuth({ token: data.data.token, user: data.data.user });
        toast.success("Welcome back!");
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data } = await publicApi.post("/public/auth/user/register", {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        });
        setUserAuth({ token: data.data.token, user: data.data.user });
        toast.success("Account created successfully!");
      }
      onClose();
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.settings?.message ||
        "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-surface-100 text-surface-400 transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-12">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-surface-900 tracking-tight mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-surface-500 text-sm font-medium italic">
              {isLogin
                ? "Please enter your details to sign in."
                : "Join us for a premium shopping experience."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex p-1.5 bg-surface-100 rounded-2xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                isLogin
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-surface-500 hover:text-surface-700",
              )}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                !isLogin
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-surface-500 hover:text-surface-700",
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-600 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            )}

            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-600 transition-colors"
                size={18}
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-surface-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>

            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-600 transition-colors z-10"
                size={18}
              />
              <PasswordInput
                required
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            {!isLogin && (
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-600 transition-colors z-10"
                  size={18}
                />
                <PasswordInput
                  required
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-surface-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl shadow-surface-900/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {isLogin ? "Sign In" : "Register"}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6 text-center">
              <button className="text-[10px] font-black uppercase tracking-widest text-surface-400 hover:text-brand-600 transition-colors">
                Forgot Password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
