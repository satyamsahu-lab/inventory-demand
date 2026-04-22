import type React from "react";
import { Search } from "lucide-react";
import { FieldError } from "../../../components/ui/FieldError";
import { cn } from "../../../utils/cn";

interface SalesFormProps {
  productQuery: string;
  setProductQuery: (val: string) => void;
  products: any[];
  productId: string;
  setProductId: (val: string) => void;
  qty: string;
  setQty: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  errors: Record<string, string>;
}

export const SalesForm: React.FC<SalesFormProps> = ({
  productQuery,
  setProductQuery,
  products,
  productId,
  setProductId,
  qty,
  setQty,
  date,
  setDate,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Select Product
        </label>
        <div className="relative group">
          <Search
            className="absolute left-4 top-4 text-surface-400 group-focus-within:text-[hsl(var(--primary))] transition-colors"
            size={18}
          />
          <input
            className={cn(
              "w-full bg-surface-50 border rounded-xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none transition-all",
              errors.productId
                ? "border-rose-500 ring-4 ring-rose-500/10"
                : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
            )}
            value={productQuery}
            placeholder="Search products by name or SKU..."
            onChange={(e) => {
              setProductQuery(e.target.value);
              setProductId("");
            }}
          />
        </div>
        <FieldError error={errors.productId} />

        <div className="max-h-48 overflow-auto rounded-xl border border-surface-100 bg-surface-50/50 p-2 space-y-1 mt-3">
          {products.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-surface-400 uppercase tracking-widest">
              No products found
            </div>
          ) : (
            products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProductId(p.id);
                  setProductQuery(p.name);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all",
                  productId === p.id
                    ? "bg-[hsl(var(--primary))] text-white shadow-md shadow-[hsl(var(--primary)/0.2)]"
                    : "bg-white hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))]",
                )}
              >
                <div>
                  <div
                    className={cn(
                      "font-bold text-sm",
                      productId === p.id ? "text-white" : "text-surface-900",
                    )}
                  >
                    {p.name}
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      productId === p.id
                        ? "text-[hsl(var(--primary-foreground))]"
                        : "text-surface-400",
                    )}
                  >
                    SKU: {p.sku}
                  </div>
                </div>
                {productId === p.id && (
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Quantity Sold
        </label>
        <input
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-4 text-lg font-black focus:outline-none transition-all",
            errors.qty
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={qty}
          type="number"
          placeholder="1"
          onChange={(e) => setQty(e.target.value)}
        />
        <FieldError error={errors.qty} />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
          Transaction Date
        </label>
        <input
          type="date"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-4 text-sm font-bold focus:outline-none transition-all",
            errors.date
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <FieldError error={errors.date} />
      </div>
    </div>
  );
};
