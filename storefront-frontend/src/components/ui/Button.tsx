import { cn } from "../../utils/cn";

export function Button(props: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const v = props.variant ?? "primary";

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        v === "primary" &&
          "bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-brand-300 border-transparent",
        v === "secondary" &&
          "bg-white text-surface-700 border-surface-200 shadow-sm hover:bg-surface-50 hover:border-surface-300",
        v === "danger" &&
          "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 hover:shadow-rose-300 border-transparent",
        v === "ghost" &&
          "bg-transparent text-surface-600 border-transparent hover:bg-surface-100",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
