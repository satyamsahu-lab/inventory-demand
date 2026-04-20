import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import { Boxes, Search, Upload } from "lucide-react";

import { api } from "../../shared/api";
import type { ApiResponse, Paginated } from "../../shared/types";
import { Button } from "../../shared/components/Button";
import { Grid } from "../../shared/components/Grid";
import { Modal } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { formatDateMMDDYYYY } from "../../shared/ui";
import { Pagination } from "../../shared/components/Pagination";

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

  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("0");

  const columns = useMemo<ColDef<InventoryRow>[]>(
    () => [
      {
        field: "product_name",
        headerName: "Product Name",
        minWidth: 250,
        cellRenderer: (p: any) => {
          const row: InventoryRow = p.data;
          return (
            <button
              type="button"
              className="text-left font-black text-surface-900 hover:text-brand-600 transition-all hover:translate-x-1"
              onClick={() => {
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
          <span className="px-2 py-1 rounded bg-surface-100 text-surface-600 font-mono text-[10px] font-bold border border-surface-200 uppercase">
            {p.value}
          </span>
        ),
      },
      {
        field: "quantity",
        headerName: "Stock Level",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="inline-block min-w-[32px] text-center text-sm font-black text-surface-700 bg-white shadow-inner-soft border border-surface-100 px-2 py-1 rounded-lg">
            {p.value}
          </span>
        ),
      },
      {
        field: "min_stock_threshold",
        headerName: "Min Threshold",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="text-xs font-black text-brand-700 bg-brand-50 border border-brand-100 px-2 py-1 rounded-lg">
            {p.value}
          </span>
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
    await api.post("/inventory", { product_id: productId, quantity: qty });
    toast.success("Saved");
    setOpen(false);
    await load();
    await loadLowStock();
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

  return (
    <div>
      <Toolbar
        title="Inventory Tracking"
        subtitle="Real-time stock management and threshold monitoring"
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
                placeholder="Search inventory..."
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
                id="inventory-import"
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
                  document.getElementById("inventory-import")?.click()
                }
              >
                <Upload size={18} className="text-brand-600" />
                <span>Import Inventory</span>
              </Button>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 card-premium flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Grid<InventoryRow>
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

        <div className="col-span-12 lg:col-span-4 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-surface-900 text-lg tracking-tight">Stock Alerts</h3>
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
                  className="p-4 rounded-2xl border border-surface-100 bg-white hover:border-brand-200 hover:shadow-md transition-all group cursor-default"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
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
                      <span className="text-surface-500 font-bold uppercase tracking-widest text-[9px]">Stock</span>
                      <span className="font-black text-surface-700">
                        {r.quantity} <span className="text-surface-400 font-medium">/ {r.min_stock_threshold}</span>
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
        open={open}
        title="Adjust Inventory Levels"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" className="px-6" onClick={() => setOpen(false)}>
              Discard
            </Button>
            <Button
              className="px-8 shadow-brand-200"
              onClick={() =>
                onSaveQty().catch((e) =>
                  toast.error(
                    e?.response?.data?.settings?.message ?? "Save failed",
                  ),
                )
              }
            >
              Confirm Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Current Stock Quantity</label>
            <div className="relative">
              <input
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                value={qty}
                type="number"
                placeholder="0"
                onChange={(e) => setQty(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400 uppercase tracking-widest">Units In Stock</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              <strong>Note:</strong> Adjusting stock levels directly will affect forecasting accuracy. Consider recording a sale or purchase order for routine movements.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
