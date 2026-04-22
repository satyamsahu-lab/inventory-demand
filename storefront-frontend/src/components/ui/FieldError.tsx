import type React from "react";

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="text-rose-500 text-[10px] font-bold mt-1.5 animate-fade-in px-1 uppercase tracking-wider">
      {error}
    </div>
  );
}
