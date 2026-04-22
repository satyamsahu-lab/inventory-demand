import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  Search,
  ChevronRight,
  Eye,
  CheckCircle2,
  Truck,
  Box,
  AlertCircle,
  Download,
} from "lucide-react";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { api } from "../services/api";
import { Grid } from "../components/ui/Table";
import { Toolbar } from "../components/layout/Toolbar";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { cn } from "../utils/cn";
import { formatDateMMDDYYYY } from "../utils/formatDate";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

type Order = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  total_amount: string;
  status: "pending" | "shipped" | "in-transit" | "delivered";
  shipping_address: any;
  payment_method: string;
  created_at: string;
};

const STATUSES = ["pending", "shipped", "in-transit", "delivered"];

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const gridRef = useRef<AgGridReact<Order>>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchOrders = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const { data } = await api.get("/orders", {
          params: {
            page: pageNum,
            limit,
            status: selectedStatus,
            search: debouncedSearch,
          },
        });
        setOrders(data.data.records);
        setTotalRecords(data.data.pagination.totalRecords);
        setTotalPages(data.data.pagination.totalPages);
      } catch (error) {
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, selectedStatus, limit],
  );

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={14} />;
      case "shipped":
        return <Truck size={14} />;
      case "in-transit":
        return <Box size={14} />;
      case "delivered":
        return <CheckCircle2 size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "shipped":
        return "bg-sky-50 text-sky-700 border-sky-100";
      case "in-transit":
        return "bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] border-[hsl(var(--border))]";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default:
        return "bg-surface-50 text-surface-700 border-surface-100";
    }
  };

  const columns = useMemo<ColDef<Order>[]>(
    () => [
      {
        field: "id",
        headerName: "Order ID",
        width: 150,
        cellRenderer: (p: any) => (
          <button
            onClick={() => navigate(`/orders/${p.data.id}`)}
            className="font-mono text-xs font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-colors"
          >
            #{p.data.id.slice(0, 8)}
          </button>
        ),
      },
      {
        field: "user_name",
        headerName: "Customer Name",
        minWidth: 200,
        flex: 1,
        cellClass: "font-bold text-slate-900",
      },
      {
        field: "user_email",
        headerName: "Customer Email",
        minWidth: 200,
        flex: 1,
        cellClass: "text-slate-500 font-medium",
      },
      {
        field: "total_amount",
        headerName: "Amount",
        width: 120,
        valueFormatter: (p) => `$${parseFloat(p.value).toFixed(2)}`,
        cellClass: "font-black text-slate-900",
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        cellRenderer: (p: any) => (
          <div className="flex items-center h-full">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-tight",
                getStatusColor(p.value),
              )}
            >
              {getStatusIcon(p.value)}
              {p.value}
            </span>
          </div>
        ),
      },
      {
        field: "payment_method",
        headerName: "Payment",
        width: 140,
        cellClass: "text-slate-500 font-medium",
      },
      {
        field: "created_at",
        headerName: "Order Date",
        width: 150,
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
        cellClass: "text-slate-500",
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-6">
      <Toolbar
        title="Orders"
        subtitle="Manage customer orders and fulfillment status"
        right={
          <>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order ID or customer"
                className="h-10 w-64 pl-10 pr-3 rounded-xl border border-surface-200 bg-white focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] transition-all outline-none text-sm"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setSelectedStatus("")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedStatus === ""
                    ? "bg-white text-[hsl(var(--primary))] shadow-sm"
                    : "text-surface-500 hover:text-surface-700",
                )}
              >
                All
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedStatus === s
                      ? "bg-white text-[hsl(var(--primary))] shadow-sm"
                      : "text-surface-500 hover:text-surface-700",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <Button variant="secondary" onClick={() => {}}>
              <Download size={18} className="text-emerald-600" />
              <span>Export</span>
            </Button>
          </>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
        <Grid<Order>
          rowData={orders}
          columnDefs={columns}
          gridRef={gridRef}
          gridOptions={{
            overlayNoRowsTemplate: `<div class="flex flex-col items-center justify-center p-8 text-surface-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8l-7 7"/><path d="M8 8l7 7"/></svg><span>No orders found</span></div>`,
            rowHeight: 65,
          }}
        />

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
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
    </div>
  );
}
