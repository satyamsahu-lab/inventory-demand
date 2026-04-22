import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  Search,
  Plus,
  Download,
  History,
  LayoutGrid,
  List,
  ShoppingCart,
  Calendar,
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
import { EmptyState } from "../components/ui/EmptyState";
import { SalesForm } from "../features/forms/components/SalesForm";

const saleSchema = z.object({
  productId: z.string().min(1, "Please select a product"),
  qty: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Quantity must be greater than zero",
    ),
  date: z.string().min(1, "Sale date is required"),
});

type SalesRow = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_sold: number;
  sale_date: string;
};

type ProductRow = { id: string; name: string; sku: string };

export function SalesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<SalesRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("sale_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalesRow | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportScope, setExportScope] = useState<"selected" | "page" | "all">(
    "all",
  );
  const [productId, setProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [qty, setQty] = useState("1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const gridRef = useRef<AgGridReact<SalesRow>>(null);

  function handleClose() {
    setOpen(false);
    setEditing(null);
    setProductId("");
    setProductQuery("");
    setQty("1");
    setDate(new Date().toISOString().slice(0, 10));
    setErrors({});
  }

  const columns = useMemo<ColDef<SalesRow>[]>(
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
        field: "product_name",
        headerName: "Sold Product",
        minWidth: 250,
        cellRenderer: (p: any) => {
          const row: SalesRow = p.data;
          return (
            <button
              type="button"
              className="text-left font-black text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-all hover:translate-x-1"
              onClick={() => {
                handleClose();
                setEditing(row);
                setOpen(true);
                setProductId(row.product_id);
                setProductQuery(row.product_name);
                setQty(String(row.quantity_sold));
                setDate(String(row.sale_date).slice(0, 10));
              }}
            >
              {row.product_name}
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
        field: "quantity_sold",
        headerName: "Qty Sold",
        width: 140,
        cellRenderer: (p: any) => (
          <div>
            <span className="inline-block min-w-[32px] text-center text-sm font-black text-surface-700 bg-surface-100 shadow-inner-soft border border-surface-100 px-2 py-1 rounded-lg">
              {p.value}
            </span>
          </div>
        ),
      },
      {
        field: "sale_date",
        headerName: "Transaction Date",
        width: 180,
        cellClass: "text-surface-500 font-medium",
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
      },
      {
        headerName: "Status",
        width: 140,
        cellRenderer: () => (
          <div>
            <span className="inline-flex items-center px-3 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-wider shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full mr-2 bg-emerald-500 animate-pulse"></span>
              Success
            </span>
          </div>
        ),
      },
    ],
    [],
  );

  async function load() {
    const res = await api.get<ApiResponse<Paginated<SalesRow>>>("/sales", {
      params: { page, limit, search, sortBy, sortOrder },
    });
    setRecords(res.data.data.records);
    setTotalPages(res.data.data.pagination.totalPages);
    setTotalRecords(res.data.data.pagination.totalRecords);
  }

  async function loadProducts() {
    const res = await api.get<ApiResponse<{ records: any[] }>>("/products", {
      params: { page: 1, limit: 100, search: productQuery },
    });
    setProducts(
      res.data.data.records.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
      })),
    );
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load sales",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder]);

  useEffect(() => {
    if (!open) return;
    loadProducts().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productQuery]);

  async function onCreate() {
    setErrors({});
    const result = saleSchema.safeParse({ productId, qty, date });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (editing) {
      await api.put(`/sales/${editing.id}`, {
        product_id: productId,
        quantity_sold: Number(qty),
        sale_date: date,
      });
      toast.success("Updated");
    } else {
      await api.post("/sales", {
        product_id: productId,
        quantity_sold: Number(qty),
        sale_date: date,
      });
      toast.success("Created");
    }

    setOpen(false);
    setEditing(null);
    setErrors({});
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

    const res = await api.get(`/sales/export/file`, {
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
    a.download = `sales.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Toolbar
        title="Sales Transactions"
        subtitle="Detailed history of inventory movements and revenue"
        right={
          <>
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-[hsl(var(--primary))] transition-colors"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="h-11 w-64 pl-11 pr-4 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-4 focus:ring-[hsl(var(--primary)/0.1)] focus:border-[hsl(var(--primary))] transition-all font-medium text-sm shadow-sm"
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
                    ? "bg-white text-[hsl(var(--primary))] shadow-sm"
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
                    ? "bg-white text-[hsl(var(--primary))] shadow-sm"
                    : "text-surface-400 hover:text-surface-600",
                )}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <div className="h-8 w-px bg-surface-200 mx-2" />

            <Button
              variant="secondary"
              className="h-11"
              onClick={() => setExportOpen(true)}
            >
              <Download size={18} className="text-emerald-600" />
              <span>Export</span>
            </Button>

            <Button
              className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] h-11 px-6 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              onClick={() => {
                handleClose();
                setOpen(true);
              }}
            >
              <Plus size={20} />
              <span>Record New Sale</span>
            </Button>
          </>
        }
      />

      {viewMode === "table" ? (
        <div className="card-premium">
          <div className="overflow-hidden">
            <Grid<SalesRow>
              rowData={records}
              columnDefs={columns}
              gridRef={gridRef}
              gridOptions={{
                overlayNoRowsTemplate: `<div class="flex flex-col items-center justify-center p-8 text-surface-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8l-7 7"/><path d="M8 8l7 7"/></svg><span>No sales found</span></div>`,
                rowSelection: "multiple",
                suppressRowClickSelection: true,
                onSortChanged: (event) => {
                  const sortState = event.api
                    .getColumnState()
                    .find((s) => s.sort != null);
                  if (sortState) {
                    setSortBy(sortState.colId);
                    setSortOrder(sortState.sort as any);
                  } else {
                    setSortBy("sale_date");
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
                message="No sales found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="card-premium group hover:border-brand-300 transition-all duration-300 flex flex-col p-6 cursor-pointer"
                  onClick={() => {
                    handleClose();
                    setEditing(r);
                    setOpen(true);
                    setProductId(r.product_id);
                    setProductQuery(r.product_name);
                    setQty(String(r.quantity_sold));
                    setDate(String(r.sale_date).slice(0, 10));
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner-soft">
                      <ShoppingCart size={22} />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-emerald-500"></span>
                      Success
                    </span>
                  </div>

                  <div className="mb-4 flex-1">
                    <h3 className="font-black text-surface-900 text-base leading-tight group-hover:text-[hsl(var(--primary))] transition-colors">
                      {r.product_name}
                    </h3>
                    <span className="inline-block mt-1.5 text-[10px] font-mono font-black text-surface-600 bg-surface-100 px-2 py-0.5 rounded uppercase">
                      {r.sku}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-surface-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black text-surface-400 uppercase tracking-[0.2em]">
                        Qty Sold
                      </p>
                      <span className="text-lg font-black text-surface-900">
                        {r.quantity_sold}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-surface-400 font-medium">
                      <Calendar size={10} />
                      {formatDateMMDDYYYY(r.sale_date)}
                    </div>
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
        title={editing ? "Edit Transaction Data" : "Record Inventory Sale"}
        onClose={handleClose}
        footer={
          <>
            <Button variant="ghost" className="px-6" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="px-8 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              onClick={() => onCreate()}
            >
              {editing ? "Update Record" : "Log Sale"}
            </Button>
          </>
        }
      >
        <SalesForm
          productQuery={productQuery}
          setProductQuery={setProductQuery}
          products={products}
          productId={productId}
          setProductId={setProductId}
          qty={qty}
          setQty={setQty}
          date={date}
          setDate={setDate}
          errors={errors}
        />
      </Modal>

      <Modal
        open={exportOpen}
        title="Export Sales"
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
                    ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                    : "bg-white border-surface-200 text-surface-700 hover:border-[hsl(var(--primary)/0.3)]",
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
                    ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
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
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "border-surface-200 bg-white hover:border-[hsl(var(--primary)/0.3)]",
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
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "border-surface-200 bg-white hover:border-[hsl(var(--primary)/0.3)]",
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
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "border-surface-200 bg-white hover:border-[hsl(var(--primary)/0.3)]",
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
    </div>
  );
}
