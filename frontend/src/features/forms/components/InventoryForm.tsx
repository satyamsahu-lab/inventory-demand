import type React from "react";
import { FieldError } from "../../../components/ui/FieldError";
import { cn } from "../../../utils/cn";

interface InventoryFormProps {
  qty: string;
  setQty: (val: string) => void;
  errors: Record<string, string>;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({
  qty,
  setQty,
  errors,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Current Stock Quantity
        </label>
        <div className="relative">
          <input
            className={cn(
              "w-full bg-surface-50 border rounded-xl px-4 py-4 text-lg font-black focus:outline-none transition-all",
              errors.qty
                ? "border-rose-500 ring-4 ring-rose-500/10"
                : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
            )}
            value={qty}
            type="number"
            placeholder="0"
            onChange={(e) => setQty(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400 uppercase tracking-widest">
            Units In Stock
          </div>
        </div>
        <FieldError error={errors.qty} />
      </div>
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
          <strong>Note:</strong> Adjusting stock levels directly will affect
          forecasting accuracy. Consider recording a sale or purchase order for
          routine movements.
        </p>
      </div>
    </div>
  );
};
