import { useEffect, useState } from "react";
import {
  Package,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { publicApi } from "../services/public-api";
import { useUserAuth } from "../store/user-auth";
import { cn } from "../utils/cn";
import { formatDateMMDDYYYY as formatDate } from "../utils/formatDate";
import toast from "react-hot-toast";

export function UserOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useUserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const { data } = await publicApi.get("/public/orders");
      setOrders(data.data.records);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          icon: <Clock size={12} />,
          classes: "bg-warning-50 text-warning-600 border-warning-100",
          dot: "bg-warning-500",
        };
      case "delivered":
        return {
          icon: (
            <div className="w-3 h-3 rounded-full border-2 border-emerald-500 flex items-center justify-center">
              <div className="w-1 h-1 bg-emerald-500 rounded-full" />
            </div>
          ),
          classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
          dot: "bg-emerald-500",
        };
      case "shipped":
        return {
          icon: <Package size={12} />,
          classes:
            "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.2)]",
          dot: "bg-[hsl(var(--primary))]",
        };
      case "in transit":
        return {
          icon: <Truck size={12} />,
          classes:
            "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border))]",
          dot: "bg-[hsl(var(--primary-glow))]",
        };
      default:
        return {
          icon: <Clock size={12} />,
          classes: "bg-surface-50 text-surface-600 border-surface-100",
          dot: "bg-surface-400",
        };
    }
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="h-10 w-48 bg-surface-100 animate-pulse rounded-lg" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 w-full bg-surface-50 animate-pulse rounded-[2.5rem]"
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-surface-900 tracking-tight">
          Order History
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 border border-surface-200 text-center space-y-4">
          <div className="h-16 w-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto text-surface-400">
            <Package size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900">
              No orders yet
            </h3>
            <p className="text-surface-500 text-sm font-medium">
              When you buy something, it will appear here.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-block bg-[hsl(var(--primary))] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[hsl(var(--primary)/0.9)] transition-all"
          >
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                {/* Order Header */}
                <div className="bg-surface-50/30 px-8 py-6 border-b border-surface-100 flex flex-wrap items-center gap-x-12 gap-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5">
                      Order Placed
                    </p>
                    <p className="text-sm font-bold text-surface-900">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5">
                      Total Amount
                    </p>
                    <p className="text-sm font-black text-[hsl(var(--primary))]">
                      ${order.total_amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1.5">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn("w-2 h-2 rounded-full", statusConfig.dot)}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5",
                          statusConfig.classes,
                        )}
                      >
                        {statusConfig.icon}
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div
                    onClick={() => navigate(`/account/orders/${order.id}`)}
                    className="ml-auto flex items-center gap-2 cursor-pointer group/id"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 group-hover/id:text-[hsl(var(--primary))] transition-colors">
                      Order ID: #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <ChevronRight
                      size={14}
                      className="text-surface-300 group-hover/id:translate-x-1 group-hover/id:text-[hsl(var(--primary))] transition-all"
                    />
                  </div>
                </div>

                {/* Order Body */}
                <div className="p-8">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-[hsl(var(--secondary))] rounded-2xl flex items-center justify-center text-[hsl(var(--primary))] shadow-sm border border-[hsl(var(--border))]">
                      <Package size={28} />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-surface-900 mb-0.5">
                        Ship to {order.shipping_address.fullName}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-surface-500 font-medium">
                          {order.shipping_address.addressLine1},{" "}
                          {order.shipping_address.city},{" "}
                          {order.shipping_address.state},{" "}
                          {order.shipping_address.country}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/account/orders/${order.id}`)}
                      className="bg-[hsl(var(--primary))] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[hsl(var(--primary)/0.9)] transition-colors flex items-center gap-2"
                    >
                      Track Order
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
