import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import { Search, Plus, Download, History } from "lucide-react";

import { api } from "../../shared/api";
import type { ApiResponse, Paginated } from "../../shared/types";
import { Button } from "../../shared/components/Button";
import { Grid } from "../../shared/components/Grid";
import { Modal } from "../../shared/components/Modal";
import { Toolbar } from "../../shared/components/Toolbar";
import { formatDateMMDDYYYY } from "../../shared/ui";
import { Pagination } from "../../shared/components/Pagination";

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
  const [productId, setProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [qty, setQty] = useState("1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const columns = useMemo<ColDef<SalesRow>[]>(
    () => [
      {
        field: "product_name",
        headerName: "Sold Product",
        minWidth: 250,
        cellRenderer: (p: any) => {
          const row: SalesRow = p.data;
          return (
            <button
              type="button"
              className="text-left font-black text-surface-900 hover:text-brand-600 transition-all hover:translate-x-1"
              onClick={() => {
                setEditing(row);
                setOpen(true);
                setProductId(row.product_id);
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
          <span className="px-2 py-1 rounded bg-surface-100 text-surface-600 font-mono text-[10px] font-bold border border-surface-200 uppercase">
            {p.value}
          </span>
        ),
      },
      {
        field: "quantity_sold",
        headerName: "Qty Sold",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="inline-block min-w-[32px] text-center text-sm font-black text-surface-700 bg-white shadow-inner-soft border border-surface-100 px-2 py-1 rounded-lg">
            {p.value}
          </span>
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-wider shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full mr-2 bg-emerald-500 animate-pulse"></span>
            Success
          </span>
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
    if (editing) {
      await api.put(`/sales/${editing.id}`, {
        product_id: productId,
        quantity_sold: qty,
        sale_date: date,
      });
      toast.success("Updated");
    } else {
      await api.post("/sales", {
        product_id: productId,
        quantity_sold: qty,
        sale_date: date,
      });
      toast.success("Created");
    }

    setOpen(false);
    setEditing(null);
    await load();
  }

  async function onExport(format: "csv" | "pdf") {
    const res = await api.get(`/sales/export/file`, {
      params: { format },
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
                className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                className="h-11 w-64 pl-11 pr-4 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-sm shadow-sm"
              />
            </div>
            <Button variant="secondary" className="h-11 px-6" onClick={() => load().catch(() => {})}>
              Search
            </Button>

            <div className="h-8 w-px bg-surface-200 mx-2" />

            <Button
              variant="secondary"
              className="h-11"
              onClick={() => onExport("csv").catch(() => {})}
            >
              <Download size={18} className="text-emerald-600" />
              <span>Export CSV</span>
            </Button>
            
            <Button
              className="bg-brand-600 hover:bg-brand-700 h-11 px-6 shadow-brand-200"
              onClick={() => {
                setEditing(null);
                setProductId("");
                setProductQuery("");
                setQty("1");
                setDate(new Date().toISOString().slice(0, 10));
                setOpen(true);
              }}
            >
              <Plus size={20} />
              <span>Record New Sale</span>
            </Button>
          </>
        }
      />

      <div className="card-premium">
        <div className="overflow-hidden">
          <Grid<SalesRow>
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

      <Modal
        open={open}
        title={editing ? "Edit Transaction Data" : "Record Inventory Sale"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <>
            <Button variant="ghost" className="px-6" onClick={() => setOpen(false)}>
              Discard
            </Button>
            <Button
              className="px-8 shadow-brand-200"
              onClick={() =>
                onCreate().catch((e) =>
                  toast.error(
                    e?.response?.data?.settings?.message ?? "Save failed",
                  ),
                )
              }
            >
              {editing ? "Update Transaction" : "Finalize Sale"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-8">
          <div className="col-span-2 space-y-3">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Select Product</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              <input
                className="w-full bg-surface-50 border border-surface-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search by name or SKU..."
              />
            </div>
            <div className="mt-3 max-h-60 overflow-auto border border-surface-200 rounded-2xl bg-white shadow-inner-soft p-1 space-y-1">
              {products.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-surface-400 font-medium italic">No matching products found</p>
                </div>
              ) : (
                products.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setProductId(p.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group",
                      productId === p.id 
                        ? "bg-brand-600 text-white shadow-lg shadow-brand-100" 
                        : "hover:bg-brand-50 text-surface-700"
                    )}
                  >
                    <div>
                      <div className={cn("font-bold text-sm", productId === p.id ? "text-white" : "text-surface-900")}>{p.name}</div>
                      <div className={cn("text-[10px] font-bold uppercase tracking-wider", productId === p.id ? "text-brand-100" : "text-surface-400")}>SKU: {p.sku}</div>
                    </div>
                    {productId === p.id && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Quantity Sold</label>
            <input
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              value={qty}
              type="number"
              placeholder="1"
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Transaction Date</label>
            <input
              type="date"
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
