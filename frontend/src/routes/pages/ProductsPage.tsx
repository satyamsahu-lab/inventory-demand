import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import { Search, Plus, Upload, Download, Boxes } from "lucide-react";

import { api } from "../../shared/api";
import type { ApiResponse, Paginated } from "../../shared/types";
import { Button } from "../../shared/components/Button";
import { Grid } from "../../shared/components/Grid";
import { Modal } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { formatDateMMDDYYYY } from "../../shared/ui";
import { Pagination } from "../../shared/components/Pagination";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: string;
  min_stock_threshold: number;
  created_at: string;
};

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("0");
  const [minStock, setMinStock] = useState("0");

  const columns = useMemo<ColDef<Product>[]>(
    () => [
      {
        field: "name",
        headerName: "Product Name",
        minWidth: 250,
        cellRenderer: (p: any) => {
          const row: Product = p.data;
          return (
            <button
              type="button"
              className="text-left font-black text-surface-900 hover:text-brand-600 transition-all hover:translate-x-1"
              onClick={() => onEdit(row)}
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
          <span className="px-2 py-1 rounded bg-surface-100 text-surface-600 font-mono text-[10px] font-bold border border-surface-200 uppercase">
            {p.value}
          </span>
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
        width: 140,
        cellRenderer: (p: any) => (
          <span className="inline-block min-w-[32px] text-center text-xs font-black text-brand-700 bg-brand-50 border border-brand-100 px-2 py-1 rounded-lg">
            {p.value}
          </span>
        ),
      },
      {
        field: "created_at",
        headerName: "Date Added",
        width: 160,
        cellClass: "text-surface-500 font-medium",
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
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

  function onCreate() {
    setEditing(null);
    setName("");
    setSku("");
    setPrice("0");
    setMinStock("0");
    setOpen(true);
  }

  function onEdit(row: Product) {
    setEditing(row);
    setName(row.name);
    setSku(row.sku);
    setPrice(row.price);
    setMinStock(String(row.min_stock_threshold));
    setOpen(true);
  }

  async function onSave() {
    const payload = {
      name,
      sku,
      price,
      min_stock_threshold: minStock,
    };

    if (editing) {
      await api.put(`/products/${editing.id}`, payload);
      toast.success("Updated");
    } else {
      await api.post("/products", payload);
      toast.success("Created");
    }

    setOpen(false);
    await load();
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

  async function onExport(format: "csv" | "pdf") {
    const res = await api.get(`/products/export/file`, {
      params: { format },
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
            <Button variant="secondary" className="h-11 px-6" onClick={() => load().catch(() => {})}>
              Search
            </Button>

            <div className="h-8 w-px bg-surface-200 mx-2" />

            <div className="flex gap-2">
              <input
                type="file"
                id="product-import"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    onImport(f).catch((err) =>
                      toast.error(
                        err?.response?.data?.settings?.message ??
                          "Import failed",
                      ),
                    );
                  e.currentTarget.value = "";
                }}
              />
              <Button
                variant="secondary"
                className="h-11"
                onClick={() =>
                  document.getElementById("product-import")?.click()
                }
              >
                <Upload size={18} className="text-brand-600" />
                <span>Import</span>
              </Button>
            </div>

            <Button
              variant="secondary"
              className="h-11"
              onClick={() => onExport("csv").catch(() => {})}
            >
              <Download size={18} className="text-emerald-600" />
              <span>CSV</span>
            </Button>
            
            <Button
              className="bg-brand-600 hover:bg-brand-700 h-11 px-6 shadow-brand-200"
              onClick={onCreate}
            >
              <Plus size={20} />
              <span>Add Product</span>
            </Button>
          </>
        }
      />

      <div className="card-premium">
        <div className="overflow-hidden">
          <Grid<Product>
            rowData={records}
            columnDefs={columns}
            gridOptions={{
              onSortChanged: (event) => {
                const sortState = event.api
                  .getColumnState()
                  .find((s) => s.sort != null);
                if (sortState) {
                  setSortBy(sortState.colId);
                  setSortOrder(sortState.sort as any);
                } else {
                  setSortBy("created_at");
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

      <Modal
        open={open}
        title={editing ? "Edit Product Details" : "Create New Product"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" className="px-6" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="px-8 shadow-brand-200"
              onClick={() =>
                onSave().catch((e) =>
                  toast.error(
                    e?.response?.data?.settings?.message ?? "Save failed",
                  ),
                )
              }
            >
              {editing ? "Update Product" : "Save Product"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Product Name</label>
            <input
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              value={name}
              placeholder="e.g. Premium Wireless Headphones"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">SKU Reference</label>
            <input
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium font-mono"
              value={sku}
              placeholder="SKU-001"
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Unit Price ($)</label>
            <input
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              type="number"
              value={price}
              placeholder="0.00"
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Min Stock Threshold</label>
            <div className="relative">
              <input
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                type="number"
                value={minStock}
                placeholder="Alert when stock falls below this"
                onChange={(e) => setMinStock(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-surface-400">UNITS</div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
