import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Package,
  Check,
  Truck,
  MapPin,
  CreditCard,
  Calendar,
  User,
  ShieldCheck,
  Headphones,
  Copy,
  Clock,
} from "lucide-react";
import { publicApi } from "../services/public-api";
import { cn } from "../utils/cn";
import { formatDateMMDDYYYY as formatDate } from "../utils/formatDate";
import toast from "react-hot-toast";

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const { data } = await publicApi.get(`/public/orders/${id}`);
      // The API returns { order: {...}, items: [...] } based on user message
      setOrder(data.data);
    } catch (err) {
      toast.error("Failed to load order details");
      navigate("/account/orders");
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Tracking ID copied!");
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-surface-100 rounded" />
        <div className="flex justify-between">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-surface-100 rounded" />
            <div className="h-4 w-48 bg-surface-100 rounded" />
          </div>
          <div className="h-12 w-40 bg-surface-100 rounded" />
        </div>
        <div className="h-64 bg-surface-50 rounded-[2.5rem]" />
      </div>
    );

  if (!order) return null;

  const orderData = order?.order;
  const itemsData = order?.items || [];

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

  const statusConfig = getStatusConfig(orderData?.status);

  const steps = [
    {
      label: "Order Placed",
      status: orderData?.status ? "completed" : "pending",
      date: orderData?.created_at
        ? new Date(orderData.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : null,
    },
    {
      label: "Shipped",
      status: ["shipped", "delivered"].includes(
        orderData?.status?.toLowerCase(),
      )
        ? "completed"
        : orderData?.status?.toLowerCase() === "shipped"
          ? "current"
          : "pending",
      date: null,
    },
    {
      label: "In Transit",
      status:
        orderData?.status?.toLowerCase() === "shipped"
          ? "current"
          : orderData?.status?.toLowerCase() === "delivered"
            ? "completed"
            : "pending",
      date: null,
    },
    {
      label: "Delivered",
      status:
        orderData?.status?.toLowerCase() === "delivered"
          ? "completed"
          : "pending",
      date:
        orderData?.status?.toLowerCase() === "delivered" &&
        orderData?.updated_at
          ? new Date(orderData.updated_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : null,
    },
  ];

  const getProgressWidth = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "0%";
      case "shipped":
        return "66%";
      case "delivered":
        return "100%";
      default:
        return "0%";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Navigation */}
      <div>
        <Link
          to="/account/orders"
          className="flex items-center gap-2 text-surface-500 hover:text-[hsl(var(--primary))] transition-colors text-xs font-bold"
        >
          <ArrowLeft size={14} />
          Back to orders
        </Link>
      </div>

      {/* Title Section */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusConfig.dot)} />
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5",
                  statusConfig.classes,
                )}
              >
                {statusConfig.icon}
                {orderData?.status}
              </span>
            </div>
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
              Order #
              {orderData?.id?.slice(0, 8).toUpperCase() ||
                id?.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h1 className="text-4xl font-black text-surface-900 tracking-tight">
            Order <span className="text-[hsl(var(--primary))]">Details</span>
          </h1>
          <p className="text-sm font-medium text-surface-500">
            Placed on{" "}
            {orderData?.created_at
              ? new Date(orderData.created_at).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })
              : "..."}{" "}
            at{" "}
            {orderData?.created_at
              ? new Date(orderData.created_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "00:00 AM"}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-surface-200 text-surface-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-surface-50 transition-colors shadow-sm">
          <Download size={18} />
          Download Invoice
        </button>
      </div>

      {/* Tracking Progress Card */}
      <div className="bg-white rounded-[2.5rem] border border-surface-200 p-8 shadow-sm">
        <div className="flex flex-wrap justify-between items-start gap-6 mb-12">
          <div>
            <h3 className="text-lg font-bold text-surface-900 mb-2">
              Tracking Progress
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-400 font-medium tracking-tight">
                Tracking #
              </span>
              <span className="text-sm font-black text-surface-900 tracking-tight flex items-center gap-1.5">
                TRX-554433221
                <button
                  onClick={() => copyTrackingId("TRX-554433221")}
                  className="text-surface-300 hover:text-[hsl(var(--primary))] transition-colors"
                >
                  <Copy size={14} />
                </button>
              </span>
            </div>
          </div>
          {orderData?.status?.toLowerCase() !== "delivered" && (
            <div className="bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] p-4 rounded-2xl text-center min-w-[160px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary)/0.6)] mb-1">
                Estimated Delivery
              </p>
              <p className="text-sm font-black text-[hsl(var(--primary))]">
                Apr 26, 2026
              </p>
            </div>
          )}
        </div>

        {/* Progress Tracker */}
        <div className="relative px-4">
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-surface-100" />
          <div
            className="absolute top-5 left-4 h-0.5 bg-[hsl(var(--primary))] transition-all duration-500"
            style={{
              width: `calc(${getProgressWidth(orderData?.status)} - 32px)`,
            }}
          />

          <div className="relative flex justify-between">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className="relative">
                  {step.status === "current" && (
                    <div className="absolute inset-0 rounded-full bg-[hsl(var(--primary))] animate-[ping_2s_ease-in-out_infinite] opacity-40" />
                  )}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full border-4 flex items-center justify-center relative z-10 transition-all shadow-sm",
                      step.status === "completed"
                        ? "bg-[hsl(var(--primary))] border-white text-white"
                        : step.status === "current"
                          ? "bg-white border-[hsl(var(--primary))] text-[hsl(var(--primary))] ring-4 ring-[hsl(var(--primary)/0.1)]"
                          : "bg-white border-surface-100 text-surface-300",
                    )}
                  >
                    {step.status === "completed" ? (
                      <Check size={18} />
                    ) : step.label === "Shipped" ||
                      step.label === "In Transit" ? (
                      <Truck size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      step.status === "completed" || step.status === "current"
                        ? "text-surface-900"
                        : "text-surface-400",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.date && (
                    <p className="text-[10px] font-medium text-surface-400 mt-1 uppercase">
                      {step.date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Products & Protection */}
        <div className="lg:col-span-2 space-y-8">
          {/* Products List */}
          <div className="bg-white rounded-[2.5rem] border border-surface-200 overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-surface-100 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400">
                ORDERED PRODUCTS ({itemsData?.length || 0})
              </h3>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", statusConfig.dot)} />
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex items-center gap-1.5",
                    statusConfig.classes,
                  )}
                >
                  {statusConfig.icon}
                  {orderData?.status}
                </span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {itemsData.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-[hsl(var(--secondary))] rounded-2xl flex items-center justify-center text-[hsl(var(--primary))] border border-[hsl(var(--border))] overflow-hidden">
                    {item.product_image ? (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={28} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-surface-900 tracking-tight">
                      {item.product_name || "Product Name"}
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">
                      QUANTITY: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-surface-900">
                      ${item.price_at_order || "0.00"}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">
                      PER UNIT
                    </p>
                  </div>
                </div>
              ))}
              {itemsData.length === 0 && (
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-[hsl(var(--secondary))] rounded-2xl flex items-center justify-center text-[hsl(var(--primary))] border border-[hsl(var(--border))]">
                    <Package size={28} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-surface-900 tracking-tight">
                      Eco-Friendly Backpack
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">
                      QUANTITY: 1
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-surface-900">
                      $79.50
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">
                      PER UNIT
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="px-8 py-6 bg-surface-50/30 border-t border-surface-100 space-y-3">
              <div className="flex justify-between text-sm font-medium text-surface-500">
                <span>Subtotal</span>
                <span className="text-surface-900 font-bold">
                  ${Number(orderData?.total_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-4 border-t border-surface-200">
                <span className="text-sm font-black uppercase tracking-widest text-surface-400">
                  TOTAL AMOUNT
                </span>
                <span className="text-2xl font-black text-[hsl(var(--primary))] tracking-tight">
                  ${Number(orderData?.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-surface-200 p-8 shadow-sm space-y-8">
            {/* Order Date */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-[hsl(var(--secondary))] rounded-xl flex items-center justify-center text-[hsl(var(--primary))] border border-[hsl(var(--border))] flex-shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">
                  ORDER DATE
                </p>
                <p className="text-sm font-black text-surface-900 tracking-tight">
                  {orderData?.created_at
                    ? new Date(orderData.created_at).toLocaleString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : "..."}{" "}
                  ·
                  {orderData?.created_at
                    ? new Date(orderData.created_at).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        },
                      )
                    : "00:00 AM"}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-[hsl(var(--secondary))] rounded-xl flex items-center justify-center text-[hsl(var(--primary))] border border-[hsl(var(--border))] flex-shrink-0">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">
                  PAYMENT METHOD
                </p>
                <p className="text-sm font-black text-surface-900 tracking-tight">
                  {orderData?.payment_method?.toUpperCase() ||
                    "CASH ON DELIVERY"}
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-[hsl(var(--secondary))] rounded-xl flex items-center justify-center text-[hsl(var(--primary))] border border-[hsl(var(--border))] flex-shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-1">
                  SHIPPING ADDRESS
                </p>
                <div className="text-sm font-medium text-surface-500 space-y-0.5 mt-1">
                  <p className="font-black text-surface-900">
                    {orderData?.shipping_address?.fullName || "..."}
                  </p>
                  <p>{orderData?.shipping_address?.addressLine1 || "..."}</p>
                  <p>
                    {orderData?.shipping_address?.city || "..."},{" "}
                    {orderData?.shipping_address?.pincode || "..."}
                  </p>
                  <p>{orderData?.shipping_address?.state || "..."}</p>
                  <p className="text-xs mt-2 flex items-center gap-1.5 font-bold text-surface-400 hover:text-[hsl(var(--primary))] cursor-pointer">
                    <Headphones size={12} />
                    {orderData?.shipping_address?.phone || "+44 20 7946 0958"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
