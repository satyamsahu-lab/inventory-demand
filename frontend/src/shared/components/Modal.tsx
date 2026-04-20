import { X } from "lucide-react";
import { cn } from "../ui";

export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-[100] animate-fade-in">
      <button
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={props.onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-2xl bg-white border border-surface-200 shadow-premium-xl rounded-[2rem] overflow-hidden animate-slide-up",
            props.className,
          )}
        >
          <div className="px-8 py-6 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-white to-surface-50/50">
            <h3 className="text-xl font-black text-surface-900 tracking-tight">
              {props.title}
            </h3>
            <button
              className="h-10 w-10 flex items-center justify-center rounded-xl text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-all"
              onClick={props.onClose}
            >
              <X size={20} />
            </button>
          </div>
          <div className="px-8 py-8">{props.children}</div>
          {props.footer ? (
            <div className="px-8 py-6 border-t border-surface-100 bg-surface-50/30 flex justify-end gap-3">
              {props.footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
