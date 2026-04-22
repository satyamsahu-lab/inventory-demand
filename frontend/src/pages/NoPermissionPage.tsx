import { Lock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../store/auth";

export function NoPermissionPage() {
  const { clear } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-fade-in">
      <div className="h-24 w-24 rounded-full bg-red-50 flex items-center justify-center mb-8 border border-red-100 shadow-sm">
        <Lock size={48} className="text-red-500" />
      </div>

      <h1 className="text-3xl font-black text-surface-900 mb-4">
        Access Restricted
      </h1>

      <p className="text-lg text-surface-500 max-w-md mb-10 font-medium">
        It looks like your account doesn't have any module permissions. Please
        contact your system administrator to assign a role with permissions.
      </p>

      <div className="flex gap-4">
        <Button
          variant="secondary"
          className="h-12 px-8 font-bold"
          onClick={() => (window.location.href = "/my-profile")}
        >
          View Profile
        </Button>
        <Button
          variant="ghost"
          className="h-12 px-8 font-bold text-red-600 hover:bg-red-50"
          onClick={() => clear()}
        >
          Log Out
        </Button>
      </div>

      <div className="mt-16 pt-8 border-t border-surface-100 w-full max-w-xs">
        <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">
          Inventory Demand System
        </p>
      </div>
    </div>
  );
}
