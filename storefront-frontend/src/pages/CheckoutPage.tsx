import { useState, useEffect } from "react";
import {
  MapPin,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../services/public-api";
import { useUserAuth } from "../store/user-auth";
import { cn } from "../utils/cn";
import toast from "react-hot-toast";

export function CheckoutPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const { isLoggedIn, updateCartCount } = useUserAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    paymentMethod: "Cash on Delivery",
  });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/shop");
      return;
    }
    fetchCart();
  }, [isLoggedIn, navigate]);

  const fetchCart = async () => {
    try {
      const { data } = await publicApi.get("/public/cart");
      if (data.data.items.length === 0) {
        navigate("/cart");
        return;
      }
      setItems(data.data.items);
    } catch (err) {
      toast.error("Failed to load checkout details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { data } = await publicApi.post("/public/orders/checkout", {
        shippingAddress: {
          fullName: formData.fullName,
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone,
        },
        paymentMethod: formData.paymentMethod,
      });

      setOrderSuccess(data.data.order);
      updateCartCount(0);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = items.reduce(
    (acc, item) => acc + parseFloat(item.price) * item.quantity,
    0,
  );

  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="h-24 w-24 bg-success-100 text-success-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-success-200">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-surface-900 tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-surface-500 font-medium italic">
            Thank you for your purchase. Your order ID is{" "}
            <span className="text-brand-600 font-black not-italic">
              #{orderSuccess.id.slice(0, 8)}
            </span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            onClick={() => navigate("/account/orders")}
            className="bg-white border-2 border-surface-200 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:border-brand-600 hover:text-brand-600 transition-all active:scale-95"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate("/shop")}
            className="bg-surface-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-surface-900/10 active:scale-95 flex items-center justify-center gap-2 group"
          >
            Continue Shopping
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="animate-pulse">Loading checkout...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-3xl font-black text-surface-900 tracking-tight">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-surface-200 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-surface-900 flex items-center gap-2">
              <MapPin size={22} className="text-brand-600" /> Shipping Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  required
                  placeholder="123 Street, Area"
                  value={formData.addressLine1}
                  onChange={(e) =>
                    setFormData({ ...formData, addressLine1: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 ml-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full bg-surface-50 border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-surface-200 shadow-sm space-y-6">
            <h2 className="text-xl font-black text-surface-900 flex items-center gap-2">
              <CreditCard size={22} className="text-brand-600" /> Payment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={cn(
                  "relative flex flex-col p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                  formData.paymentMethod === "Cash on Delivery"
                    ? "border-brand-600 bg-brand-50/50 shadow-lg shadow-brand-100/50"
                    : "border-surface-100 hover:border-surface-200",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  className="sr-only"
                  checked={formData.paymentMethod === "Cash on Delivery"}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                />
                <span className="text-sm font-black text-surface-900 mb-1">
                  Cash on Delivery
                </span>
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                  Pay when you receive
                </span>
                <div
                  className={cn(
                    "absolute top-4 right-4 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                    formData.paymentMethod === "Cash on Delivery"
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "border-surface-200 text-transparent",
                  )}
                >
                  <CheckCircle2 size={14} />
                </div>
              </label>

              <div className="relative flex flex-col p-6 rounded-3xl border-2 border-surface-50 bg-surface-50 opacity-60 cursor-not-allowed">
                <span className="text-sm font-black text-surface-400 mb-1">
                  Online Payment
                </span>
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest italic">
                  Coming Soon
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-[2.5rem] p-8 border border-surface-200 shadow-xl shadow-surface-200/20 sticky top-24 space-y-6">
            <h2 className="text-xl font-black text-surface-900">
              Order Summary
            </h2>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 no-scrollbar">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center gap-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-surface-900 line-clamp-1">
                      {item.product_name}
                    </p>
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-black text-surface-900">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-surface-100">
              <div className="flex justify-between text-sm font-bold text-surface-500">
                <span>Subtotal</span>
                <span className="text-surface-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-surface-500">
                <span>Shipping</span>
                <span className="text-success-600 uppercase tracking-widest text-[10px] font-black">
                  Free
                </span>
              </div>
              <div className="border-t border-surface-100 pt-4 flex justify-between items-end">
                <span className="text-base font-black text-surface-900">
                  Total
                </span>
                <span className="text-2xl font-black text-brand-600">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-surface-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:bg-brand-600 transition-all shadow-xl shadow-surface-900/10 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isProcessing ? "Placing Order..." : "Confirm & Pay"}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
