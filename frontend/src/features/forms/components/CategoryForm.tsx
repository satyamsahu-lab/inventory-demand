import type React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { FieldError } from "../../../components/ui/FieldError";
import { cn } from "../../../utils/cn";

interface Category {
  id: string;
  name: string;
}

interface CategoryFormProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  parentId?: string;
  setParentId?: (val: string) => void;
  categories?: Category[];
  type: "category" | "subcategory";
  status: string;
  setStatus: (val: string) => void;
  errors: Record<string, string>;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  name,
  setName,
  description,
  setDescription,
  parentId,
  setParentId,
  categories,
  type,
  status,
  setStatus,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <label
          htmlFor="category-name"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          {type === "category" ? "Category" : "Subcategory"} Name{" "}
          <span className="text-rose-500">*</span>
        </label>
        <input
          id="category-name"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            errors.name
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={name}
          placeholder={`e.g. ${type === "category" ? "Electronics" : "Mobile Phones"}`}
          onChange={(e) => setName(e.target.value)}
        />
        <FieldError error={errors.name} />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="category-description"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Description
        </label>
        <textarea
          id="category-description"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium min-h-[100px] resize-none",
            errors.description
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={description}
          placeholder="Brief description of this category..."
          onChange={(e) => setDescription(e.target.value)}
        />
        <FieldError error={errors.description} />
      </div>

      {type === "subcategory" && setParentId && categories && (
        <div className="space-y-1.5">
          <label
            htmlFor="parent-category"
            className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
          >
            Parent Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="parent-category"
            className={cn(
              "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
              errors.parent_id
                ? "border-rose-500 ring-4 ring-rose-500/10"
                : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
            )}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError error={errors.parent_id} />
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">
            Status
          </label>
          <div className="flex gap-6 px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="category-status"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                  className="peer appearance-none w-5 h-5 border-2 border-surface-200 rounded-full checked:border-[hsl(var(--primary))] transition-all cursor-pointer"
                />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))] scale-0 peer-checked:scale-100 transition-transform" />
              </div>
              <span className="text-sm font-medium text-surface-600 group-hover:text-surface-900 transition-colors">
                Active
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="category-status"
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
