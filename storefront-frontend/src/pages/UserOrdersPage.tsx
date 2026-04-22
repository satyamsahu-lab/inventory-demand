import { useEffect, useState } from "react";
import { Package, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { publicApi } from "../services/public-api";
import { useUserAuth } from "../store/user-auth";
import { cn } from "../utils/cn";
import { formatDateMMDDYYYY as formatDate } from "../utils/formatDate";
import toast from "react-hot-toast";

export function UserOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useUserAuth();

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

  if (loading) return <div className="animate-pulse">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-surface-900 tracking-tight">
          Order History
        </h1>
        <div className="flex items-center gap-2 text-surface-400 text-xs font-black uppercase tracking-[0.2em]">
          <Clock size={14} /> Last 6 Months
        </div>
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
            className="inline-block bg-brand-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-700 transition-all"
          >
            Go to Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-[2.5rem] border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              <div className="bg-surface-50/50 px-8 py-6 border-b border-surface-100 flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">
                    Order Placed
                  </p>
                  <p className="text-sm font-bold text-surface-900">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">
                    Total Amount
                  </p>
                  <p className="text-sm font-black text-brand-600">
                    ${order.total_amount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">
                    Status
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                      order.status === "pending"
                        ? "bg-warning-50 text-warning-600"
                        : "bg-success-50 text-success-600",
                    )}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                    Order ID: #{order.id.slice(0, 8)}
                  </p>
                  <ChevronRight
                    size={14}
                    className="text-surface-300 group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-surface-100 rounded-xl flex items-center justify-center text-surface-400">
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-surface-900">
                      Ship to {order.shipping_address.fullName}
                    </p>
                    <p className="text-xs text-surface-500 font-medium">
                      {order.shipping_address.addressLine1},{" "}
                      {order.shipping_address.city}
                    </p>
                  </div>
                  <button className="text-brand-600 text-xs font-black uppercase tracking-widest hover:underline">
                    Track Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
