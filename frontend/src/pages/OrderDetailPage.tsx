import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  Clock,
  ChevronLeft,
  CheckCircle2,
  Truck,
  Box,
  AlertCircle,
  CreditCard,
  MapPin,
  Calendar,
} from "lucide-react";
import { api } from "../services/api";
import { Toolbar } from "../components/layout/Toolbar";
import { Button } from "../components/ui/Button";
import { ConfirmStatusChangeModal } from "../components/ui/ConfirmStatusChangeModal";
import { cn } from "../utils/cn";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const STATUSES = ["pending", "shipped", "in-transit", "delivered"];

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setData(res.data.data);
      setNewStatus("");
    } catch (error) {
      toast.error("Failed to load order details");
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setConfirmModal(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      setStatusUpdating(true);
      await api.patch(`/orders/${id}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      setConfirmModal(false);
      await loadOrder();
    } catch (error: any) {
      toast.error(
        error.response?.data?.settings?.message || "Failed to update status",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return null;

  const { order, items } = data;
  const currentIndex = STATUSES.indexOf(order.status);
  const nextStatus = STATUSES[currentIndex + 1];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={20} />;
      case "shipped":
        return <Truck size={20} />;
      case "in-transit":
        return <Box size={20} />;
      case "delivered":
        return <CheckCircle2 size={20} />;
      default:
        return <AlertCircle size={20} />;
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

  return (
    <div className="space-y-8 animate-fade-in">
      <Toolbar
        title={`Order #${order.id.slice(0, 8)}`}
        subtitle="View and manage order fulfillment details"
        left={
          <Button
            variant="ghost"
            onClick={() => navigate("/orders")}
            className="group mr-4"
          >
            <ChevronLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Orders
          </Button>
        }
        right={
          <div className="flex items-center gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="h-10 px-4 pr-10 rounded-xl border border-surface-200 bg-white text-sm font-bold text-surface-700 focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] outline-none transition-all"
            >
              <option value="">Change Status</option>
              {STATUSES.map((s, idx) => {
                const isNext = idx === currentIndex + 1;
                if (!isNext) return null;
                return (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                );
              })}
            </select>
            <Button
              disabled={!newStatus || updating}
              onClick={handleUpdateStatus}
              className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] h-10 px-6 shadow-[hsl(var(--primary)/0.1)]"
            >
              Update Status
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                Ordered Products ({items.length})
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                  getStatusColor(order.status),
                )}
              >
                {getStatusIcon(order.status)}
                {order.status}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="p-8 flex items-center gap-6 group hover:bg-slate-50/50 transition-colors"
                >
                  <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--primary))] border border-[hsl(var(--border))] group-hover:scale-110 transition-transform">
                    <Package size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-slate-900 truncate">
                      {item.product_name}
                    </h4>
                    <p className="text-xs font-black text-slate-400 uppercase mt-1 tracking-widest">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">
                      ${parseFloat(item.price_at_order).toFixed(2)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                      per unit
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-[hsl(var(--secondary)/0.3)] border-t border-[hsl(var(--border))] flex items-center justify-between">
              <span className="text-sm font-black text-[hsl(var(--primary))] uppercase tracking-[0.2em]">
                Total Amount
              </span>
              <span className="text-3xl font-black text-[hsl(var(--primary))] tracking-tighter">
                ${parseFloat(order.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Order Date
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {dayjs(order.created_at).format("MMMM DD, YYYY · hh:mm A")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Payment Method
                  </p>
                  <p className="text-sm font-bold text-slate-900 capitalize">
                    {order.payment_method}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-6 border-y border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Shipping Address
                  </p>
                  <div className="text-sm font-medium text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">
                      {order.shipping_address.fullName}
                    </p>
                    <p>{order.shipping_address.addressLine1}</p>
                    <p>
                      {order.shipping_address.city},{" "}
                      {order.shipping_address.state}
                    </p>
                    <p>{order.shipping_address.pincode}</p>
                    <p className="pt-2 font-mono text-xs">
                      {order.shipping_address.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Customer Contact
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {order.user_name}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {order.user_email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmStatusChangeModal
        open={confirmModal}
        onClose={() => setConfirmModal(false)}
        onConfirm={handleConfirmUpdate}
        status={newStatus}
        count={1}
        loading={updating}
      />
    </div>
  );
}
