import type React from "react";
import { useEffect, useState } from "react";
import { X, Upload, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { FieldError } from "../../../components/ui/FieldError";
import { cn } from "../../../utils/cn";
import { api } from "../../../services/api";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  name: string;
  setName: (val: string) => void;
  sku: string;
  setSku: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  minStock: string;
  setMinStock: (val: string) => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  subcategoryId: string;
  setSubcategoryId: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  imageFiles: File[];
  setImageFiles: (val: React.SetStateAction<File[]>) => void;
  imagePreviewUrls: string[];
  editing: any;
  errors: Record<string, string>;
  removeExistingImage: (id: string) => Promise<void>;
  removeSelectedImageAt: (index: number) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  name,
  setName,
  sku,
  setSku,
  description,
  setDescription,
  price,
  setPrice,
  minStock,
  setMinStock,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  status,
  setStatus,
  imageFiles,
  setImageFiles,
  imagePreviewUrls,
  editing,
  errors,
  removeExistingImage,
  removeSelectedImageAt,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
      setSubcategoryId("");
    }
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories", {
        params: {
          parentId: "null",
          limit: 100,
          onlyActive: editing ? undefined : true,
        },
      });
      setCategories(res.data.data.records);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  const fetchSubcategories = async (parentId: string) => {
    try {
      const res = await api.get("/categories", {
        params: {
          parentId,
          limit: 100,
          onlyActive: editing ? undefined : true,
        },
      });
      setSubcategories(res.data.data.records);
    } catch (error) {
      console.error("Failed to fetch subcategories");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-1.5">
        <label
          htmlFor="product-name"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Product Name
        </label>
        <input
          id="product-name"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            errors.name
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={name}
          placeholder="e.g. Premium Wireless Headphones"
          onChange={(e) => setName(e.target.value)}
        />
        <FieldError error={errors.name} />
      </div>
      <div className="col-span-2 space-y-1.5">
        <label
          htmlFor="product-sku"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          SKU Reference
        </label>
        <input
          id="product-sku"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium font-mono",
            errors.sku
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={sku}
          placeholder="SKU-001"
          onChange={(e) => setSku(e.target.value)}
        />
        <FieldError error={errors.sku} />
      </div>

      <div className="col-span-2 space-y-1.5">
        <label
          htmlFor="product-description"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Description
        </label>
        <textarea
          id="product-description"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium min-h-[100px] resize-none",
            errors.description
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={description}
          placeholder="Detailed description of the product..."
          onChange={(e) => setDescription(e.target.value)}
        />
        <FieldError error={errors.description} />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="product-price"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Unit Price ($)
        </label>
        <input
          id="product-price"
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            errors.price
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          type="number"
          value={price}
          placeholder="0.00"
          onChange={(e) => setPrice(e.target.value)}
        />
        <FieldError error={errors.price} />
      </div>
      <div className="col-span-2 space-y-1.5">
        <label
          htmlFor="product-min-stock"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Min Stock Threshold
        </label>
        <div className="relative">
          <input
            id="product-min-stock"
            className={cn(
              "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
              errors.minStock
                ? "border-rose-500 ring-4 ring-rose-500/10"
                : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
            )}
            type="number"
            value={minStock}
            placeholder="Alert when stock falls below this"
            onChange={(e) => setMinStock(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-400">
            UNITS
          </div>
        </div>
        <FieldError error={errors.minStock} />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="product-category"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Category <span className="text-rose-500">*</span>
        </label>
        <select
          id="product-category"
          required
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            errors.category_id
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError error={errors.category_id} />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="product-subcategory"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Subcategory
        </label>
        <select
          id="product-subcategory"
          disabled={!categoryId}
          className={cn(
            "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
            !categoryId ? "opacity-50 cursor-not-allowed" : "",
            errors.subcategory_id
              ? "border-rose-500 ring-4 ring-rose-500/10"
              : "border-surface-200 focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))]",
          )}
          value={subcategoryId}
          onChange={(e) => setSubcategoryId(e.target.value)}
        >
          <option value="">Select Subcategory</option>
          {subcategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError error={errors.subcategory_id} />
      </div>

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
                  name="product-status"
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
                  name="product-status"
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

      <div className="col-span-2">
        <label
          htmlFor="product-image-upload"
          className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1"
        >
          Product Images
        </label>

        <input
          type="file"
          id="product-image-upload"
          accept="image/png,image/jpeg"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;
            setImageFiles((cur) => [...cur, ...files]);
            e.target.value = "";
          }}
        />

        <div className="mt-3 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() =>
              document.getElementById("product-image-upload")?.click()
            }
            className="h-20 w-full rounded-2xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center gap-1.5 text-surface-400 hover:border-[hsl(var(--primary)/0.4)] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary)/0.2)] transition-all group"
          >
            <Upload
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-[9px] font-black uppercase tracking-wider">
              Upload
            </span>
          </button>

          {(editing?.images?.length > 0 || imagePreviewUrls.length > 0) && (
            <div className="flex-1 flex flex-wrap gap-4 p-4 rounded-2xl bg-surface-50/50 border border-surface-100 border-dashed">
              {/* Existing Images (When Editing) */}
              {editing?.images?.map((img: any) => (
                <div
                  key={img.id}
                  className="relative group h-20 w-20 rounded-2xl overflow-hidden border border-surface-200 shadow-sm transition-all hover:shadow-md"
                >
                  <img
                    src={img.url}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="Existing product"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.id).catch(() => {})}
                    className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:scale-110 active:scale-90"
                    aria-label="Remove image"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}

              {/* Newly Uploaded Previews */}
              {imagePreviewUrls.map((u, idx) => (
                <div
                  key={u}
                  className="relative group h-20 w-20 rounded-2xl overflow-hidden border-2 border-[hsl(var(--primary)/0.2)] border-dashed bg-[hsl(var(--secondary)/0.2)] shadow-sm transition-all hover:border-[hsl(var(--primary)/0.4)] hover:shadow-md"
                >
                  <img
                    src={u}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="New image preview"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[hsl(var(--primary))] text-[8px] font-black text-white uppercase tracking-wider shadow-sm">
                    New
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedImageAt(idx)}
                    className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:scale-110 active:scale-90"
                    aria-label="Remove image"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
