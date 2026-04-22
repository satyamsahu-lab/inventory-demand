import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Boxes,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MoreHorizontal,
  AlertTriangle,
  History,
  Users,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import type { ApiResponse } from "../types/index";
import { Toolbar } from "../components/layout/Toolbar";
import { Chart } from "../components/ui/Chart";
import { useAuth } from "../store/auth";
import { Button } from "../components/ui/Button";
import {
  DateRangeFilter,
  type DateRange,
} from "../components/ui/DateRangeFilter";
import { formatDateMMDDYYYY } from "../utils/formatDate";
import { can } from "../services/permissions";

type Summary = {
  totalProducts: number;
  totalSales: number;
  lowStockCount: number;
  totalRevenue: number;
  totalUsers: number;
};

type TopProduct = {
  id: string;
  name: string;
  sku: string;
  total_qty: number;
  total_revenue: number;
};

type RecentSale = {
  id: string;
  product_name: string;
  sku: string;
  quantity_sold: number;
  sale_date: string;
  status?: "Paid"; // Hardcoded for UI consistency
};

export function DashboardPage() {
  const { permissions, user } = useAuth();

  const canProducts = can(permissions as any, "Products", "view");
  const canSales = can(permissions as any, "Sales", "view");
  const canInventory = can(permissions as any, "Inventory", "view");

  const [summary, setSummary] = useState<Summary>({
    totalProducts: 0,
    totalSales: 0,
    lowStockCount: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });
  const [trends, setTrends] = useState<Array<{ day: string; total: number }>>(
    [],
  );
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(
      new Date().setDate(new Date().getDate() - 7),
    ).toISOString(),
    endDate: new Date().toISOString(),
    label: "Last 7 Days",
  });

  useEffect(() => {
    const params = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    };

    // Summary data
    api
      .get<ApiResponse<Summary>>("/dashboard/summary", { params })
      .then((r) => setSummary(r.data.data))
      .catch((e) =>
        toast.error(
          e?.response?.data?.settings?.message ?? "Failed to load summary",
        ),
      );

    // Top selling products
    if (canSales) {
      api
        .get<ApiResponse<{ records: TopProduct[] }>>(
          "/dashboard/top-selling-products",
          { params },
        )
        .then((r) => setTopProducts(r.data.data.records))
        .catch(() => {});
    }

    // Sales trends
    if (canSales) {
      api
        .get<ApiResponse<{ records: Array<{ day: string; total: number }> }>>(
          "/dashboard/sales-trends",
          { params: { ...params, days: 7 } },
        )
        .then((r) => setTrends(r.data.data.records))
        .catch(() => {});

      // Recent sales (from sales list API with limit 5)
      api
        .get<ApiResponse<{ records: RecentSale[] }>>("/sales", {
          params: { ...params, page: 1, limit: 5 },
        })
        .then((r) => setRecentSales(r.data.data.records))
        .catch(() => {});
    }

    // Low stock data
    if (canInventory) {
      api
        .get<ApiResponse<{ records: any[] }>>("/dashboard/low-stock")
        .then((r) => setLowStock(r.data.data.records.slice(0, 5)))
        .catch(() => {});
    }
  }, [canSales, canInventory, dateRange]);

  const salesTrendOption = useMemo(() => {
    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "#fff",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        textStyle: { color: "#1e293b" },
        padding: [10, 15],
      },
      grid: {
        top: 40,
        right: 20,
        bottom: 40,
        left: 50,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: trends.map((t) => t.day),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#94a3b8", margin: 15 },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#94a3b8",
        },
        splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
      },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: true,
          data: trends.map((t) => t.total),
          lineStyle: { width: 3, color: "hsl(162 78% 17%)" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(10, 48, 42, 0.15)" },
                { offset: 1, color: "rgba(10, 48, 42, 0)" },
              ],
            },
          },
        },
      ],
    };
  }, [trends]);

  return (
    <div className="pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div className="animate-slide-up">
          <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-surface-500 mt-1.5 font-medium">
            Welcome back,{" "}
            <span className="text-[hsl(var(--primary))] font-bold">
              {user?.full_name?.split(" ")[0]}
            </span>{" "}
            Here's your inventory overview.
          </p>
        </div>
        <div
          className="flex flex-col sm:flex-row gap-3 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <DateRangeFilter onChange={setDateRange} />
          <Link to="/sales">
            <Button className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] h-11 px-6 shadow-[0_0_20px_rgba(var(--primary),0.2)] w-full sm:w-auto">
              <ArrowUpRight size={20} />
              <span>New Sale</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        <StatCard
          label="TOTAL REVENUE"
          value={`$${(summary.totalRevenue || 0).toLocaleString()}`}
          trend="Revenue in period"
          icon={
            <span className="text-[hsl(var(--primary))] font-black text-xl">
              $
            </span>
          }
          iconBg="bg-[hsl(var(--secondary))]"
          delay="0.1s"
        />
        <StatCard
          label="TOTAL SALES"
          value={(summary.totalSales || 0).toLocaleString()}
          trend="Units sold in period"
          icon={<ShoppingCart className="text-emerald-600" size={24} />}
          iconBg="bg-emerald-50"
          delay="0.2s"
        />
        <StatCard
          label="TOTAL USERS"
          value={(summary.totalUsers || 0).toLocaleString()}
          trend="Total users"
          icon={<Users className="text-[hsl(var(--primary))]" size={24} />}
          iconBg="bg-[hsl(var(--secondary))]"
          delay="0.3s"
        />
        <StatCard
          label="PRODUCTS"
          value={(summary.totalProducts || 0).toLocaleString()}
          trend="Active catalog"
          icon={<Boxes className="text-amber-600" size={24} />}
          iconBg="bg-amber-50"
          delay="0.4s"
        />
        <StatCard
          label="LOW STOCK"
          value={(summary.lowStockCount || 0).toLocaleString()}
          trend="Requires attention"
          icon={<AlertTriangle className="text-rose-600" size={24} />}
          iconBg="bg-rose-50"
          delay="0.5s"
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-12 gap-8 mb-10">
        <div
          className="col-span-12 lg:col-span-8 card-premium flex flex-col animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <div className="px-8 py-6 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-white to-surface-50/30">
            <div>
              <h3 className="font-bold text-surface-900 text-xl tracking-tight">
                Sales Trends
              </h3>
              <p className="text-sm text-surface-500 font-medium mt-0.5">
                Revenue performance over the last 7 days
              </p>
            </div>
          </div>
          <div className="p-8 flex-1">
            {trends.length > 0 ? (
              <Chart option={salesTrendOption} height={380} />
            ) : (
              <div className="h-[380px] flex flex-col items-center justify-center text-surface-400 gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center">
                  <TrendingUp size={32} className="opacity-20" />
                </div>
                <p className="font-medium">No sales data available yet</p>
              </div>
            )}
          </div>
        </div>

        <div
          className="col-span-12 lg:col-span-4 flex flex-col gap-8 animate-slide-up"
          style={{ animationDelay: "0.7s" }}
        >
          <div className="card-premium flex-1 flex flex-col">
            <div className="px-8 py-6 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-white to-surface-50/30">
              <div className="flex items-center gap-3">
                <Award size={20} className="text-amber-500" />
                <h3 className="font-bold text-surface-900 text-lg tracking-tight">
                  Top Products
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {topProducts.length === 0 ? (
                <div className="py-10 text-center text-surface-400">
                  <p className="text-sm italic">No sales data found</p>
                </div>
              ) : (
                topProducts.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 group cursor-default"
                  >
                    <div className="h-10 w-10 rounded-xl bg-surface-50 border border-surface-100 flex items-center justify-center text-xs font-black text-surface-400 group-hover:bg-[hsl(var(--secondary))] group-hover:text-[hsl(var(--primary))] group-hover:border-[hsl(var(--border))] transition-all">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-surface-900 text-sm truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-0.5">
                        {p.total_qty} units sold
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-surface-900">
                        ${Number(p.total_revenue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card-premium flex-1 flex flex-col">
            <div className="px-8 py-6 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-white to-surface-50/30">
              <h3 className="font-bold text-surface-900 text-lg tracking-tight">
                Stock Alerts
              </h3>
              <Link to="/inventory">
                <Button
                  variant="ghost"
                  className="text-xs h-8 px-3 text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.9)] hover:bg-[hsl(var(--secondary))]"
                >
                  View All
                </Button>
              </Link>
            </div>
            <div className="p-6 space-y-4">
              {lowStock.length === 0 ? (
                <div className="py-10 text-center text-surface-400">
                  <p className="text-sm italic">All items stocked</p>
                </div>
              ) : (
                lowStock.slice(0, 3).map((r) => (
                  <div key={r.product_id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-surface-900 truncate pr-2">
                        {r.name}
                      </span>
                      <span className="font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 text-[9px] uppercase tracking-tighter">
                        {r.quantity} left
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{
                          width: `${(r.quantity / r.min_stock_threshold) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="card-premium animate-slide-up"
        style={{ animationDelay: "0.7s" }}
      >
        <div className="px-8 py-6 border-b border-surface-100 flex items-center justify-between bg-gradient-to-r from-white to-surface-50/30">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[hsl(var(--secondary))] rounded-2xl flex items-center justify-center text-[hsl(var(--primary))] shadow-inner-soft">
              <History size={24} />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 text-xl tracking-tight">
                Recent Sales
              </h3>
              <p className="text-sm text-surface-500 font-medium mt-0.5">
                Overview of the latest business transactions
              </p>
            </div>
          </div>
          <Link to="/sales">
            <Button
              variant="secondary"
              className="text-xs h-10 px-5 border-surface-200 text-[hsl(var(--primary))] font-bold hover:bg-[hsl(var(--secondary))] hover:border-[hsl(var(--border))]"
            >
              View Transaction History
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-50/50 text-surface-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-surface-100">
                <th className="px-8 py-5">Product Details</th>
                <th className="px-8 py-5">SKU Reference</th>
                <th className="px-8 py-5 text-center">Qty</th>
                <th className="px-8 py-5">Transaction Date</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-20 text-center text-surface-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-surface-50 flex items-center justify-center">
                        <ShoppingCart size={32} className="opacity-10" />
                      </div>
                      <p className="font-medium italic">
                        No transactions recorded in the period
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-[hsl(var(--secondary)/0.3)] transition-all duration-300 group cursor-default"
                  >
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-surface-900 group-hover:text-[hsl(var(--primary))] transition-colors">
                        {sale.product_name}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 rounded bg-surface-100 text-surface-600 font-mono text-[10px] font-bold border border-surface-200 uppercase">
                        {sale.sku}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="inline-block min-w-[32px] text-sm font-black text-surface-700 bg-white shadow-inner-soft border border-surface-100 px-2 py-1 rounded-lg">
                        {sale.quantity_sold}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-surface-500 font-medium">
                      {formatDateMMDDYYYY(sale.sale_date)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-wider shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full mr-2 bg-emerald-500 animate-pulse"></span>
                        Success
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon, iconBg, delay }: any) {
  return (
    <div
      className="card-premium p-6 group animate-slide-up"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black text-surface-400 tracking-[0.2em] uppercase mb-3 group-hover:text-[hsl(var(--primary))] transition-colors">
            {label}
          </p>
          <h2 className="text-4xl font-black text-surface-900 tracking-tight group-hover:scale-105 origin-left transition-transform duration-300">
            {value}
          </h2>
        </div>
        <div
          className={`h-14 w-14 ${iconBg} rounded-2xl flex items-center justify-center shadow-inner-soft group-hover:rotate-6 transition-transform duration-300`}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-6">
        <div className="h-1 w-8 bg-[hsl(var(--primary))] rounded-full opacity-30 group-hover:w-12 transition-all duration-300" />
        <span className="text-[11px] font-bold text-surface-400 uppercase tracking-widest italic group-hover:text-surface-600 transition-colors">
          {trend}
        </span>
      </div>
    </div>
  );
}
