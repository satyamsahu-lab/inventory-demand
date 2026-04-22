import { useState, useEffect, useRef, useCallback } from "react";
import {
  History,
  Clock,
  User,
  Package,
  ShoppingCart,
  Shield,
  FileText,
  Trash2,
  PlusCircle,
  Edit,
  LogIn,
  LogOut,
  Search,
  Download,
  RotateCcw,
  ArrowUp,
} from "lucide-react";
import { api } from "../services/api";
import { auditLogService, AuditLog } from "../services/audit-log";
import { cn } from "../utils/cn";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  DateRangeFilter,
  type DateRange,
} from "../components/ui/DateRangeFilter";
import { csvFromRows } from "../utils/export";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

dayjs.extend(relativeTime);

const ACTIONS = [
  "ALL",
  "view",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
];

export function ActivityLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: "",
    endDate: "",
    label: "All Time",
  });

  const loaderRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const fetchLogs = useCallback(
    async (pageNum: number, isNewSearch = false) => {
      if (loading && !isNewSearch) return;
      setLoading(true);
      try {
        const params = {
          page: pageNum,
          limit: 20,
          search: debouncedSearch,
          action: selectedAction === "ALL" ? "" : selectedAction,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        };
        const result = await auditLogService.list(pageNum, 20, params);
        if (pageNum === 1) {
          setLogs(result.logs);
        } else {
          setLogs((prev) => [...prev, ...result.logs]);
        }
        setTotal(result.total);

        const totalPages = Math.ceil(result.total / 20);
        setHasMore(pageNum < totalPages);
      } catch (error) {
        console.error("Failed to fetch logs", error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [loading, debouncedSearch, selectedAction, dateRange],
  );

  useEffect(() => {
    setPage(1);
    fetchLogs(1, true);
  }, [debouncedSearch, selectedAction, dateRange]);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchLogs(1);
      isInitialMount.current = false;
    }
  }, [fetchLogs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchLogs(next);
            return next;
          });
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    );

    const currentLoader = loaderRef.current;
    if (currentLoader && hasMore && !loading) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, fetchLogs]);

  const handleExport = async (format: "csv" | "pdf") => {
    try {
      const params = {
        page: 1,
        limit: 10000,
        search,
        action: selectedAction === "ALL" ? "" : selectedAction,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      const result = await auditLogService.list(1, 10000, params);
      const headers = [
        "created_at",
        "user_name",
        "action",
        "module",
        "description",
        "ip_address",
      ];

      if (format === "csv") {
        const csv = csvFromRows(headers, result.logs);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-logs-${dayjs().format("YYYY-MM-DD")}.csv`;
        a.click();
      } else {
        const doc = new jsPDF();
        const tableData = result.logs.map((log) => [
          dayjs(log.created_at).format("YYYY-MM-DD HH:mm:ss"),
          log.user_name || "System",
          log.action,
          log.module,
          log.description,
          log.ip_address || "N/A",
        ]);

        const tableHeaders = [
          "DATE",
          "USER",
          "ACTION",
          "MODULE",
          "DESCRIPTION",
          "IP ADDRESS",
        ];

        doc.setFontSize(18);
        doc.text("Activity Log Report", 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(
          `Generated on: ${dayjs().format("MMM DD, YYYY HH:mm A")}`,
          14,
          30,
        );

        autoTable(doc, {
          startY: 35,
          head: [tableHeaders],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        doc.save(`activity-logs-${dayjs().format("YYYY-MM-DD")}.pdf`);
      }
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "UPDATE":
        return "text-amber-600 bg-amber-50 border-amber-100";
      case "DELETE":
        return "text-rose-600 bg-rose-50 border-rose-100";
      case "LOGIN":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "LOGOUT":
        return "text-surface-600 bg-surface-50 border-surface-100";
      case "view":
        return "text-[hsl(var(--primary))] bg-[hsl(var(--secondary))] border-[hsl(var(--border))]";
      default:
        return "text-surface-600 bg-surface-50 border-surface-100";
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module.toUpperCase()) {
      case "USERS":
      case "PROFILE":
        return User;
      case "PRODUCTS":
      case "INVENTORY":
      case "CATEGORIES":
        return Package;
      case "SALES":
      case "ORDER":
      case "CART":
        return ShoppingCart;
      case "AUTH":
        return Shield;
      default:
        return FileText;
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    await fetchLogs(1, true);
  };

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setShowScrollTop(target.scrollTop > 400);
    };

    // Find the main scrollable container
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll);
      return () => mainContent.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    const mainContent = document.querySelector("main");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.2)]">
              <History size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--primary))]">
              Audit Logs
            </h1>
          </div>
          <p className="text-surface-500 font-medium">
            Track all system activities and user actions in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-surface-200 text-surface-500 hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--secondary))] transition-all shadow-sm active:scale-95",
              loading && "animate-spin text-[hsl(var(--primary))]",
            )}
            title="Refresh Logs"
          >
            <RotateCcw size={18} />
          </button>
          <DateRangeFilter onChange={setDateRange} />
          <div className="flex bg-white rounded-xl border border-surface-200 p-1 shadow-sm">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-surface-600 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))] rounded-lg transition-all"
            >
              <Download size={14} />
              CSV
            </button>
            <div className="w-px bg-surface-100 my-1 mx-1" />
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-surface-600 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))] rounded-lg transition-all"
            >
              <Download size={14} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-[hsl(var(--primary))] transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search activities, users, modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] focus:border-[hsl(var(--primary))] shadow-sm transition-all"
          />
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-surface-200 shadow-sm overflow-x-auto scrollbar-hide">
          {ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => setSelectedAction(action)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                selectedAction === action
                  ? "bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.2)]"
                  : "text-surface-500 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--secondary))]",
              )}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative space-y-8 pb-12">
        {/* Vertical Line */}
        {logs.length > 0 && (
          <div className="absolute left-[21px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--primary)/0.2)] via-surface-100 to-transparent" />
        )}

        {logs.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-surface-100 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-surface-50 text-surface-400 grid place-items-center mb-4">
              <History size={32} />
            </div>
            <h3 className="text-xl font-black text-surface-900 tracking-tight mb-2">
              No activities yet
            </h3>
            <p className="text-surface-400 font-medium text-sm">
              Activities will appear here as they happen.
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const Icon = getModuleIcon(log.module);
            const isToday = dayjs(log.created_at).isSame(dayjs(), "day");

            return (
              <div key={log.id} className="relative pl-12 group">
                {/* Timeline Dot/Icon */}
                <div
                  className={cn(
                    "absolute left-0 top-1.5 h-[44px] w-[44px] rounded-2xl border-4 border-surface-50 flex items-center justify-center transition-all duration-300 z-10",
                    getActionColor(log.action),
                  )}
                >
                  <Icon size={20} />
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-3xl p-6 border border-surface-100 shadow-sm hover:shadow-md hover:border-[hsl(var(--primary)/0.3)] transition-all duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          getActionColor(log.action),
                        )}
                      >
                        {log.action}
                      </span>
                      <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest bg-surface-50 px-3 py-1 rounded-full border border-surface-100">
                        {log.module}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-surface-400">
                      <Clock size={14} />
                      <span className="text-xs font-semibold">
                        {isToday
                          ? dayjs(log.created_at).fromNow()
                          : dayjs(log.created_at).format(
                              "MMM DD, YYYY · hh:mm A",
                            )}
                      </span>
                    </div>
                  </div>

                  <p className="text-surface-900 font-bold mb-4 text-lg">
                    {log.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 py-4 border-t border-surface-50 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-600 font-black text-sm border-2 border-white shadow-sm overflow-hidden">
                        {log.user_name?.[0] || "S"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-surface-900 leading-tight">
                          {log.user_name || "System"}
                        </span>
                        <button
                          type="button"
                          className="text-left font-bold text-surface-900 hover:text-[hsl(var(--primary))] transition-all hover:translate-x-1"
                        >
                          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                            {log.role_name || "Automated"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                      {log.user_agent && (
                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-surface-400 bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-100">
                          {log.user_agent.includes("Windows")
                            ? "Windows"
                            : log.user_agent.includes("Mac")
                              ? "macOS"
                              : "Linux"}
                        </div>
                      )}
                      {log.ip_address && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-surface-400 bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                          {log.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        <div ref={loaderRef} className="py-8 flex justify-center">
          {loading && (
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-sm border border-surface-100 animate-pulse">
              <div className="h-4 w-4 rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent animate-spin" />
              <span className="text-xs font-black text-[hsl(var(--primary))] uppercase tracking-widest">
                Loading More...
              </span>
            </div>
          )}
          {!hasMore && logs.length > 0 && (
            <div className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] py-4">
              Reached the beginning of time
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 h-12 w-12 rounded-2xl bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] flex items-center justify-center transition-all hover:scale-110 hover:-translate-y-1 active:scale-95 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
          title="Scroll to Top"
        >
          <ArrowUp size={24} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
