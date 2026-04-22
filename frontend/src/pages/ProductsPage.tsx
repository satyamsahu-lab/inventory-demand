import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  Search,
  Plus,
  Upload,
  Download,
  Boxes,
  LayoutGrid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import type { ApiResponse, Paginated } from "../types/index";
import { Button } from "../components/ui/Button";
import { Grid } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Toolbar } from "../components/layout/Toolbar";
import { formatDateMMDDYYYY } from "../utils/formatDate";
import { FieldError } from "../components/ui/FieldError";
import { cn } from "../utils/cn";
import { Pagination } from "../components/ui/Pagination";
import { ImportModal } from "../components/ui/ImportModal";
import { EmptyState } from "../components/ui/EmptyState";
import { ProductForm } from "../features/forms/components/ProductForm";
import { useAuth } from "../store/auth";
import { ConfirmStatusChangeModal } from "../components/ui/ConfirmStatusChangeModal";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(150),
  sku: z.string().min(1, "SKU is required").max(50),
  description: z.string().max(1000, "Description is too long").optional(),
  price: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Price must be a positive number",
    ),
  minStock: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Threshold must be a positive number",
    ),
  categoryId: z.string().uuid("Category is required"),
  subcategoryId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  min_stock_threshold: number;
  status: string;
  category_id: string;
  subcategory_id?: string | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  image_urls?: string[];
  images?: Array<{ id: string; url: string }>;
  created_at: string;
  added_by?: string;
};

function ProductImageCarousel({ urls }: { urls: string[] }) {
  const safeUrls = urls.filter(Boolean);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (safeUrls.length <= 1) return;
    if (paused || previewOpen) return;
    const id = window.setInterval(() => {
      setActive((cur) => (cur + 1) % safeUrls.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [safeUrls.length, paused, previewOpen]);

  const canNavigate = safeUrls.length > 1;

  const next = () => setActive((cur) => (cur + 1) % safeUrls.length);
  const prev = () =>
    setActive((cur) => (cur - 1 + safeUrls.length) % safeUrls.length);

  return (
    <>
      <div
        className="group relative h-52 w-full overflow-hidden rounded-2xl bg-surface-100 border border-surface-200"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {safeUrls.length > 0 ? (
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {safeUrls.map((url, i) => (
              <button
                type="button"
                key={url + i}
                className="h-full w-full shrink-0 cursor-zoom-in relative"
                onClick={() => setPreviewOpen(true)}
              >
                <img
                  src={url}
                  alt={`Product view ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover object-center select-none"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full w-full grid place-items-center text-brand-600 bg-surface-50/50">
            <img
              src="https://placehold.co/400x400?text=No+Image"
              className="h-full w-full object-cover opacity-20"
              alt="No image available"
            />
          </div>
        )}

        {canNavigate && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/60 active:scale-95 z-10"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/60 active:scale-95 z-10"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full z-10">
              {safeUrls.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to image ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(i);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === active ? "bg-white w-6" : "bg-white/50 w-1.5",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Custom Full-screen Preview Overlay */}
      {previewOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 animate-fade-in">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 z-[100]"
            aria-label="Close preview"
          >
            <X size={28} strokeWidth={2} />
          </button>

          {/* Main Carousel Area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {safeUrls.map((url, i) => (
                <div
                  key={url + i}
                  className="w-full shrink-0 flex items-center justify-center p-8"
                >
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-lg animate-scale-up"
                  />
                </div>
              ))}
            </div>

            {canNavigate && (
              <>
                <button
                  type="button"
                  className="absolute left-8 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl"
                  onClick={prev}
                >
                  <ChevronLeft size={32} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="absolute right-8 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/5 text-white border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl"
                  onClick={next}
                >
                  <ChevronRight size={32} strokeWidth={2} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Gallery at Bottom */}
          {safeUrls.length > 0 && (
            <div className="h-28 bg-black/50 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-3 px-6 overflow-x-auto">
              {safeUrls.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative h-16 w-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 hover:scale-105 active:scale-95",
                    i === active
                      ? "border-brand-500 scale-110"
                      : "border-transparent opacity-50 hover:opacity-100",
                  )}
                >
                  <img
                    src={url}
                    className="h-full w-full object-cover"
                    alt={`Thumbnail ${i + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function ProductsPage() {
  const { user, permissions } = useAuth();
  const isSuperAdmin = user?.role?.name === "Super Admin";

  const hasPermission = (action: "add" | "edit" | "delete") => {
    if (isSuperAdmin) return true;
    return permissions.some(
      (p) => p.module_name === "Products" && p.action === action,
    );
  };

  const canAdd = hasPermission("add");
  const canEdit = hasPermission("edit");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportScope, setExportScope] = useState<"selected" | "page" | "all">(
    "all",
  );
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    open: boolean;
    status: "active" | "inactive";
    ids: string[];
  }>({
    open: false,
    status: "active",
    ids: [],
  });
  const [statusLoading, setStatusLoading] = useState(false);

  const gridRef = useRef<AgGridReact<Product>>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [minStock, setMinStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [status, setStatus] = useState("active");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ id: string; url: string }>
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const imagePreviewUrls = useMemo(
    () => imageFiles.map((f) => URL.createObjectURL(f)),
    [imageFiles],
  );

  async function removeExistingImage(imageId: string) {
    if (!editing) return;
    await api.delete(`/products/${editing.id}/images/${imageId}`);
    setExistingImages((cur) => cur.filter((i) => i.id !== imageId));
  }

  function removeSelectedImageAt(index: number) {
    setImageFiles((cur) => cur.filter((_, i) => i !== index));
  }

  const columns = useMemo<ColDef<Product>[]>(
    () => [
      {
        headerName: "",
        width: 52,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        headerCheckboxSelection: true,
        checkboxSelection: true,
      },
      {
        field: "image_urls",
        headerName: "Image",
        width: 90,
        sortable: false,
        cellRenderer: (p: any) => {
          const urls = (p.value as string[] | undefined) ?? [];
          const url = urls[0];
          const moreCount = Math.max(0, urls.length - 1);
          return (
            <div className="relative h-10 w-10 rounded-xl bg-surface-50 border border-surface-200 grid place-items-center">
              <div className="h-full w-full rounded-xl overflow-hidden">
                {url ? (
                  <img src={url} className="h-full w-full object-cover" />
                ) : (
                  <img
                    src="https://placehold.co/400x400?text=No+Image"
                    className="h-full w-full object-cover opacity-50"
                  />
                )}
              </div>
              {moreCount > 0 && (
                <div className="absolute -right-2 bottom-1 h-5 min-w-5 px-1 rounded-full bg-surface-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-white z-10 shadow-sm">
                  +{moreCount}
                </div>
              )}
            </div>
          );
        },
      },
      {
        field: "name",
        headerName: "Product Name",
        minWidth: 220,
        cellRenderer: (p: any) => {
          const row: Product = p.data;
          return (
            <button
              className="text-left font-bold text-surface-900 hover:text-brand-600 transition-all hover:translate-x-1"
              onClick={() => onEdit(row)}
              type="button"
            >
              {row.name}
            </button>
          );
        },
      },
      {
        field: "sku",
        headerName: "SKU Identifier",
        width: 180,
        cellRenderer: (p: any) => (
          <div>
            <span className="px-2 py-2 rounded bg-surface-100 text-surface-600 font-mono text-[10px] font-bold border border-surface-200 uppercase">
              {p.value}
            </span>
          </div>
        ),
      },
      {
        field: "price",
        headerName: "Unit Price",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="font-black text-surface-900">
            ${Number(p.value).toLocaleString()}
          </span>
        ),
      },
      {
        field: "min_stock_threshold",
        headerName: "Threshold",
        width: 120,
        cellRenderer: (p: any) => (
          <div>
            <span className="inline-block min-w-[32px] text-center text-xs font-black text-brand-700 bg-brand-50 border border-brand-100 px-2 py-1 rounded-lg">
              {p.value}
            </span>
          </div>
        ),
      },

      {
        field: "category_name",
        headerName: "Category",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="font-bold text-surface-700">{p.value || "-"}</span>
        ),
      },
      {
        field: "subcategory_name",
        headerName: "Subcategory",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="text-surface-500 font-medium">{p.value || "-"}</span>
        ),
      },
      {
        field: "created_at",
        headerName: "Added Date",
        width: 160,
        cellClass: "text-surface-500 font-medium",
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
      },
      ...(isSuperAdmin
        ? [
            {
              field: "added_by",
              headerName: "Added By",
              width: 160,
              cellRenderer: (p: any) => (
                <span className="font-bold text-brand-600">
                  {p.value || "System"}
                </span>
              ),
            },
          ]
        : []),
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: (p: any) => {
          const isActive = p.value === "active";
          return (
            <div className="flex items-center h-full">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100",
                )}
              >
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? "bg-emerald-500" : "bg-rose-500",
                  )}
                />
                {p.value}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  async function load() {
    const res = await api.get<ApiResponse<Paginated<Product>>>("/products", {
      params: {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      },
    });
    setRecords(res.data.data.records);
    setTotalPages(res.data.data.pagination.totalPages);
    setTotalRecords(res.data.data.pagination.totalRecords);
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load products",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder]);

  function handleClose() {
    setOpen(false);
    setEditing(null);
    setName("");
    setSku("");
    setDescription("");
    setPrice("0");
    setMinStock("0");
    setCategoryId("");
    setSubcategoryId("");
    setStatus("active");
    setImageFiles([]);
    setExistingImages([]);
    setErrors({});
  }

  function onCreate() {
    handleClose();
    setOpen(true);
  }

  async function onEdit(row: Product) {
    handleClose();
    setEditing(row);
    setName(row.name);
    setSku(row.sku);
    setDescription(row.description || "");
    setPrice(row.price);
    setMinStock(String(row.min_stock_threshold));
    setCategoryId(row.category_id || "");
    setSubcategoryId(row.subcategory_id || "");
    setStatus(row.status || "active");
    try {
      const res = await api.get<ApiResponse<{ record: Product }>>(
        `/products/${row.id}`,
      );
      setExistingImages(res.data.data.record.images ?? []);
    } catch {
      const urls = row.image_urls ?? [];
      setExistingImages(urls.map((u) => ({ id: u, url: u })));
    }
    setOpen(true);
  }

  async function onSave() {
    setErrors({});
    const result = productSchema.safeParse({
      name,
      sku,
      description,
      price,
      minStock,
      categoryId,
      subcategoryId,
      status,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (path) {
          const key =
            path === "categoryId"
              ? "category_id"
              : path === "subcategoryId"
                ? "subcategory_id"
                : path;
          fieldErrors[key] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    const payload = {
      name,
      sku,
      description,
      price,
      min_stock_threshold: Number(minStock),
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      status,
    };

    try {
      let productId: string;
      if (editing) {
        const updateRes = await api.put<ApiResponse<{ record: Product }>>(
          `/products/${editing.id}`,
          payload,
        );
        productId = editing.id;
        toast.success("Product updated");
      } else {
        const createdRes = await api.post<ApiResponse<{ record: Product }>>(
          "/products",
          payload,
        );
        productId = createdRes.data.data.record.id;
        toast.success("Product created");
      }

      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file) => {
          formData.append("images", file);
        });

        try {
          await api.post(`/products/${productId}/images`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          toast.success("Images uploaded");
        } catch (imgErr: any) {
          console.error("Image upload failed:", imgErr);
          toast.error(
            imgErr?.response?.data?.settings?.message ?? "Image upload failed",
          );
        }
      }

      setOpen(false);
      handleClose(); // Reset form state
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.settings?.message ?? "Save failed";
      if (msg.toLowerCase().includes("sku")) {
        setErrors({ sku: msg });
      } else if (msg.toLowerCase().includes("name")) {
        setErrors({ name: msg });
      } else if (msg.toLowerCase().includes("price")) {
        setErrors({ price: msg });
      } else {
        toast.error(msg);
      }
    }
  }

  async function onImport(file: File) {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      toast.error("Only .csv or .xlsx files are allowed");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    await api.post("/products/import", form);
    toast.success("Imported");
    await load();
  }

  async function onExport(
    format: "csv" | "pdf",
    scope: "selected" | "page" | "all",
  ) {
    if (scope === "selected") {
      const selectedRows = gridRef.current?.api.getSelectedRows() ?? [];
      if (selectedRows.length === 0) {
        toast.error("Please select at least one row to export");
        return;
      }
    }

    const ids =
      scope === "selected"
        ? (gridRef.current?.api.getSelectedRows() ?? []).map((r) => r.id)
        : [];

    const res = await api.get(`/products/export/file`, {
      params: {
        format,
        exportScope: scope,
        ids: ids.join(","),
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      },
      responseType: "blob",
    });

    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onBulkStatusChange(newStatus: "active" | "inactive") {
    const selectedRows = gridRef.current?.api.getSelectedRows() ?? [];
    if (selectedRows.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setConfirmStatusModal({
      open: true,
      status: newStatus,
      ids: selectedRows.map((r) => r.id),
    });
  }

  async function handleConfirmStatusChange() {
    try {
      setStatusLoading(true);
      await api.post("/products/bulk-status", {
        ids: confirmStatusModal.ids,
        status: confirmStatusModal.status,
      });
      toast.success(
        `Successfully changed status to ${confirmStatusModal.status}`,
      );
      setConfirmStatusModal((cur) => ({ ...cur, open: false }));
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.settings?.message ?? "Update failed");
    } finally {
      setStatusLoading(false);
    }
  }

  const [selectedCount, setSelectedCount] = useState(0);

  return (
    <div>
      <Toolbar
        title="Products"
        subtitle="Manage product catalog and inventory thresholds"
        right={
          <>
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or SKU..."
                className="h-11 w-64 pl-11 pr-4 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-sm shadow-sm"
              />
            </div>
            <Button
              variant="secondary"
              className="h-11 px-6"
              onClick={() => load().catch(() => {})}
            >
              Search
            </Button>

            <div className="h-8 w-px bg-surface-200 mx-2" />

            <div className="flex bg-surface-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "table"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-surface-400 hover:text-surface-600",
                )}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "grid"
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-surface-400 hover:text-surface-600",
                )}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <div className="h-8 w-px bg-surface-200 mx-2" />

            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <button
                disabled={selectedCount === 0}
                onClick={() => onBulkStatusChange("active")}
                title="Make Active"
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  selectedCount > 0
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-emerald-100"
                    : "bg-surface-50 text-surface-300 border border-surface-100 cursor-not-allowed",
                )}
              >
                <CheckCircle2 size={20} />
              </button>
              <button
                disabled={selectedCount === 0}
                onClick={() => onBulkStatusChange("inactive")}
                title="Make Inactive"
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  selectedCount > 0
                    ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-rose-100"
                    : "bg-surface-50 text-surface-300 border border-surface-100 cursor-not-allowed",
                )}
              >
                <XCircle size={20} />
              </button>
              <div className="h-8 w-px bg-surface-200 mx-2" />
            </div>

            <div className="flex gap-2">
              {canAdd && (
                <Button
                  variant="secondary"
                  className="h-11"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload size={18} className="text-brand-600" />
                  <span>Import</span>
                </Button>
              )}
            </div>

            <Button
              variant="secondary"
              className="h-11"
              onClick={() => setExportOpen(true)}
            >
              <Download size={18} className="text-emerald-600" />
              <span>Export</span>
            </Button>

            {canAdd && (
              <Button
                className="bg-brand-600 hover:bg-brand-700 h-11 px-6 shadow-brand-200"
                onClick={onCreate}
              >
                <Plus size={20} />
                <span>Add Product</span>
              </Button>
            )}
          </>
        }
      />

      {viewMode === "table" ? (
        <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <Grid<Product>
              rowData={records}
              columnDefs={columns}
              gridRef={gridRef}
              gridOptions={{
                overlayNoRowsTemplate: `<div class="flex flex-col items-center justify-center p-8 text-surface-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8l-7 7"/><path d="M8 8l7 7"/></svg><span>No products found</span></div>`,
                rowSelection: "multiple",
                suppressRowClickSelection: true,
                onSelectionChanged: (event) => {
                  setSelectedCount(event.api.getSelectedRows().length);
                },
                onSortChanged: (event) => {
                  const sortState = event.api
                    .getColumnState()
                    .find((s) => s.sort != null);
                  if (sortState) {
                    setSortBy(sortState.colId);
                    setSortOrder(sortState.sort as any);
                  } else {
                    setSortBy("updated_at");
                    setSortOrder("desc");
                  }
                  setPage(1);
                },
              }}
            />
          </div>

          <div className="px-8 py-5 border-t border-surface-100 bg-surface-50/30">
            <Pagination
              page={page}
              totalRecords={totalRecords}
              totalPages={totalPages}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setLimit(s);
                setPage(1);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {records.length === 0 ? (
            <div className="bg-white border border-surface-200 rounded-2xl shadow-sm">
              <EmptyState
                message="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="card-premium group hover:border-brand-300 transition-all duration-300 flex flex-col p-6"
                >
                  <div className="mb-4">
                    <ProductImageCarousel
                      urls={r.images?.map((i) => i.url) ?? r.image_urls ?? []}
                    />
                  </div>

                  <div className="flex justify-between items-start gap-4 mb-6 flex-1">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-black text-surface-900 text-lg leading-tight group-hover:text-brand-600 transition-colors cursor-pointer truncate"
                        title={r.name}
                        onClick={() => onEdit(r)}
                      >
                        {r.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Boxes size={14} className="text-surface-400" />
                        <span className="text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                          {r.sku}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">
                        Unit Price
                      </p>
                      <p className="text-xl font-black text-brand-600">
                        ${Number(r.price).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-surface-400 uppercase tracking-[0.2em] mb-1">
                        Min Threshold
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-[10px] font-black border border-brand-100 uppercase tracking-wider">
                        {r.min_stock_threshold} Units
                      </span>
                    </div>
                    {canEdit && (
                      <Button
                        variant="secondary"
                        className="h-9 px-4 text-xs font-bold"
                        onClick={() => onEdit(r)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card-premium px-8 py-5 flex justify-center bg-surface-50/30">
            <Pagination
              page={page}
              totalRecords={totalRecords}
              totalPages={totalPages}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setLimit(s);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      <Modal
        open={open}
        title={editing ? "Edit Product Details" : "Create New Product"}
        onClose={handleClose}
        footer={
          <>
            <Button variant="ghost" className="px-6" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="px-8 shadow-brand-200" onClick={() => onSave()}>
              {editing ? "Update Product" : "Save Product"}
            </Button>
          </>
        }
      >
        <ProductForm
          name={name}
          setName={setName}
          sku={sku}
          setSku={setSku}
          description={description}
          setDescription={setDescription}
          price={price}
          setPrice={setPrice}
          minStock={minStock}
          setMinStock={setMinStock}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          subcategoryId={subcategoryId}
          setSubcategoryId={setSubcategoryId}
          imageFiles={imageFiles}
          setImageFiles={setImageFiles}
          imagePreviewUrls={imagePreviewUrls}
          editing={editing}
          errors={errors}
          status={status}
          setStatus={setStatus}
          removeExistingImage={removeExistingImage}
          removeSelectedImageAt={removeSelectedImageAt}
        />
      </Modal>

      <ConfirmStatusChangeModal
        open={confirmStatusModal.open}
        onClose={() =>
          setConfirmStatusModal((cur) => ({ ...cur, open: false }))
        }
        onConfirm={handleConfirmStatusChange}
        status={confirmStatusModal.status}
        count={confirmStatusModal.ids.length}
        loading={statusLoading}
      />

      <Modal
        open={exportOpen}
        title="Export Products"
        onClose={() => setExportOpen(false)}
        footer={
          <>
            <Button
              variant="ghost"
              className="px-6"
              onClick={() => setExportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="px-8"
              onClick={() =>
                onExport(exportFormat, exportScope)
                  .then(() => setExportOpen(false))
                  .catch(() => {})
              }
            >
              Export
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-black text-surface-500 uppercase tracking-widest mb-3">
              Export Type
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className={cn(
                  "h-10 px-4 rounded-xl border text-sm font-black transition-all",
                  exportFormat === "csv"
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white border-surface-200 text-surface-700 hover:border-brand-300",
                )}
                onClick={() => setExportFormat("csv")}
              >
                CSV
              </button>
              <button
                type="button"
                className={cn(
                  "h-10 px-4 rounded-xl border text-sm font-black transition-all",
                  exportFormat === "pdf"
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white border-surface-200 text-surface-700 hover:border-brand-300",
                )}
                onClick={() => setExportFormat("pdf")}
              >
                PDF
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-surface-500 uppercase tracking-widest mb-3">
              Export Option
            </p>
            <div className="space-y-2">
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  exportScope === "selected"
                    ? "border-brand-600 bg-brand-50"
                    : "border-surface-200 bg-white hover:border-brand-300",
                )}
                onClick={() => setExportScope("selected")}
              >
                <div className="font-black text-sm text-surface-900">
                  Selected
                </div>
                <div className="text-xs font-bold text-surface-500">
                  Export only checked rows
                </div>
              </button>
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  exportScope === "page"
                    ? "border-brand-600 bg-brand-50"
                    : "border-surface-200 bg-white hover:border-brand-300",
                )}
                onClick={() => setExportScope("page")}
              >
                <div className="font-black text-sm text-surface-900">
                  Current Page
                </div>
                <div className="text-xs font-bold text-surface-500">
                  Export current page with current filters/sort
                </div>
              </button>
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  exportScope === "all"
                    ? "border-brand-600 bg-brand-50"
                    : "border-surface-200 bg-white hover:border-brand-300",
                )}
                onClick={() => setExportScope("all")}
              >
                <div className="font-black text-sm text-surface-900">All</div>
                <div className="text-xs font-bold text-surface-500">
                  Export all records (with current filters)
                </div>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Products"
        onImport={onImport}
        sampleHeaders={["name", "sku", "price", "min_stock_threshold"]}
        sampleRows={[["Example Product", "SKU-001", "19.99", "10"]]}
        sampleFileName="products_sample.csv"
      />
    </div>
  );
}
