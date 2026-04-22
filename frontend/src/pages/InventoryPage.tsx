import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  Boxes,
  Search,
  Upload,
  Download,
  LayoutGrid,
  List,
  AlertTriangle,
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
import { InventoryForm } from "../features/forms/components/InventoryForm";

const inventorySchema = z.object({
  qty: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Quantity must be a positive number",
    ),
});

type InventoryRow = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  min_stock_threshold: number;
  updated_at: string;
};

export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<InventoryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );
  const [lowStock, setLowStock] = useState<InventoryRow[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportScope, setExportScope] = useState<"selected" | "page" | "all">(
    "all",
  );

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const gridRef = useRef<AgGridReact<InventoryRow>>(null);

  function handleClose() {
    setOpen(false);
    setProductId("");
    setQty("0");
    setErrors({});
  }

  const columns = useMemo<ColDef<InventoryRow>[]>(
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
        headerName: "Product Name",
        minWidth: 250,
        cellRenderer: (p: any) => {
          const row: InventoryRow = p.data;
          return (
            <button
              type="button"
              className="text-left font-black text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-all hover:translate-x-1"
              onClick={() => {
                handleClose();
                setProductId(row.product_id);
                setQty(String(row.quantity));
                setOpen(true);
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
        field: "quantity",
        headerName: "Stock Level",
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
        field: "min_stock_threshold",
        headerName: "Min Threshold",
        width: 140,
        cellRenderer: (p: any) => (
          <div>
            <span className="text-xs font-black text-[hsl(var(--primary))] bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] px-2 py-1 rounded-lg">
              {p.value}
            </span>
          </div>
        ),
      },
      {
        field: "updated_at",
        headerName: "Last Sync",
        width: 160,
        cellClass: "text-surface-500 font-medium",
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
      },
    ],
    [],
  );

  async function load() {
    const res = await api.get<ApiResponse<Paginated<InventoryRow>>>(
      "/inventory",
      {
        params: { page, limit, search, sortBy, sortOrder },
      },
    );
    setRecords(res.data.data.records);
    setTotalPages(res.data.data.pagination.totalPages);
    setTotalRecords(res.data.data.pagination.totalRecords);
  }

  async function loadLowStock() {
    const res = await api.get<ApiResponse<{ records: InventoryRow[] }>>(
      "/inventory/low-stock",
    );
    setLowStock(res.data.data.records);
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load inventory",
      ),
    );
    loadLowStock().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder]);

  async function onSaveQty() {
    setErrors({});
    const result = inventorySchema.safeParse({ qty });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await api.post("/inventory", {
        product_id: productId,
        quantity: Number(qty),
      });
      toast.success("Saved");
      setOpen(false);
      setErrors({});
      await load();
      await loadLowStock();
    } catch (e: any) {
      const msg = e?.response?.data?.settings?.message ?? "Save failed";
      if (
        msg.toLowerCase().includes("quantity") ||
        msg.toLowerCase().includes("qty")
      ) {
        setErrors({ qty: msg });
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
    await api.post("/inventory/import", form);
    toast.success("Imported");
    await load();
    await loadLowStock();
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

    const res = await api.get(`/inventory/export/file`, {
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
    a.download = `inventory.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <Toolbar
        title="Inventory Tracking"
        subtitle="Real-time stock management and threshold monitoring"
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
                placeholder="Search inventory..."
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

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-11"
                onClick={() => setImportOpen(true)}
              >
                <Upload size={18} className="text-[hsl(var(--primary))]" />
                <span>Import</span>
              </Button>
            </div>

            <Button
              variant="secondary"
              className="h-11"
              onClick={() => setExportOpen(true)}
            >
              <Download size={18} className="text-emerald-600" />
              <span>Export</span>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          {viewMode === "table" ? (
            <div className="card-premium flex-1 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Grid<InventoryRow>
                  rowData={records}
                  columnDefs={columns}
                  gridRef={gridRef}
                  gridOptions={{
                    overlayNoRowsTemplate: `<div class="flex flex-col items-center justify-center p-8 text-surface-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8l-7 7"/><path d="M8 8l7 7"/></svg><span>No inventory found</span></div>`,
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
                    message="No inventory found"
                    description="Try adjusting your search or filters to find what you're looking for."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-up">
                  {records.map((r) => {
                    const isLow = r.quantity <= r.min_stock_threshold;
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "card-premium group hover:border-[hsl(var(--primary)/0.3)] transition-all duration-300 flex flex-col p-6",
                          isLow &&
                            "border-amber-200 bg-amber-50/10 shadow-lg shadow-amber-500/5",
                        )}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform shadow-inner-soft group-hover:scale-110",
                              isLow
                                ? "bg-amber-100 text-amber-600 shadow-amber-200"
                                : "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]",
                            )}
                          >
                            <Boxes size={24} />
                          </div>
                          {isLow && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider border border-amber-200 animate-pulse">
                              <AlertTriangle size={10} />
                              Low Stock
                            </div>
                          )}
                        </div>

                        <div className="mb-6 flex-1">
                          <h3
                            className="font-black text-surface-900 text-lg leading-tight group-hover:text-[hsl(var(--primary))] transition-colors cursor-pointer"
                            onClick={() => {
                              handleClose();
                              setProductId(r.product_id);
                              setQty(String(r.quantity));
                              setOpen(true);
                            }}
                          >
                            {r.product_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                              SKU:
                            </span>
                            <span className="text-[10px] font-mono font-black text-surface-600 bg-surface-100 px-2 rounded">
                              {r.sku}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-surface-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-surface-400 uppercase tracking-[0.2em]">
                              Stock Level
                            </p>
                            <span
                              className={cn(
                                "text-sm font-black",
                                isLow ? "text-amber-600" : "text-surface-900",
                              )}
                            >
                              {r.quantity}{" "}
                              <span className="text-[10px] text-surface-400 font-medium">
                                / {r.min_stock_threshold}
                              </span>
                            </span>
                          </div>
                          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-500",
                                isLow ? "bg-amber-500" : "bg-emerald-500",
                              )}
                              style={{
                                width: `${Math.min(100, (r.quantity / (r.min_stock_threshold || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <Button
                            variant="secondary"
                            className="w-full h-9 text-xs font-bold mt-2"
                            onClick={() => {
                              handleClose();
                              setProductId(r.product_id);
                              setQty(String(r.quantity));
                              setOpen(true);
                            }}
                          >
                            Adjust Stock
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
        </div>

        <div className="col-span-12 lg:col-span-4 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-surface-900 text-lg tracking-tight">
                Stock Alerts
              </h3>
              <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-0.5">
                Requires replenishment
              </p>
            </div>
            <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
              <Boxes size={20} />
            </div>
          </div>
          <div className="space-y-4 max-h-[600px] overflow-auto pr-1">
            {lowStock.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-surface-400">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                  <Boxes className="text-emerald-500 opacity-30" size={32} />
                </div>
                <p className="font-medium">Inventory is optimal</p>
              </div>
            ) : (
              lowStock.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl border border-surface-100 bg-white hover:border-[hsl(var(--primary)/0.3)] hover:shadow-md transition-all group cursor-default"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-surface-900 group-hover:text-[hsl(var(--primary))] transition-colors">
                      {r.product_name}
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-tighter">
                      LOW
                    </span>
                  </div>
                  <div className="text-[10px] font-black text-surface-400 mb-4 tracking-wider uppercase font-mono">
                    SKU: {r.sku}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-surface-500 font-bold uppercase tracking-widest text-[9px]">
                        Stock
                      </span>
                      <span className="font-black text-surface-700">
                        {r.quantity}{" "}
                        <span className="text-surface-400 font-medium">
                          / {r.min_stock_threshold}
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-premium-gradient rounded-full"
                        style={{
                          width: `${Math.max(5, Math.min(100, (r.quantity / r.min_stock_threshold) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={exportOpen}
        title="Export Inventory"
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
                    : "bg-white border-surface-200 text-surface-700 hover:border-[hsl(var(--primary)/0.3)]",
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

      <Modal
        open={open}
        title="Adjust Inventory Levels"
        onClose={handleClose}
        footer={
          <>
            <Button variant="ghost" className="px-6" onClick={handleClose}>
              Discard
            </Button>
            <Button
              className="px-8 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
              onClick={() => onSaveQty()}
            >
              Confirm Changes
            </Button>
          </>
        }
      >
        <InventoryForm qty={qty} setQty={setQty} errors={errors} />
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Inventory"
        onImport={onImport}
        sampleHeaders={["sku", "quantity"]}
        sampleRows={[["SKU-123", "50"]]}
        sampleFileName="inventory_sample.csv"
      />
    </div>
  );
}
