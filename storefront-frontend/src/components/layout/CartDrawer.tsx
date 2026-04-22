import { useEffect, useState, useCallback, useRef } from "react";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  X,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { publicApi } from "../../services/public-api";
import { useUserAuth } from "../../store/user-auth";
import { cn } from "../../utils/cn";
import toast from "react-hot-toast";

function ProductImageCarousel({ urls }: { urls: string[] }) {
  const safeUrls = urls.filter(Boolean);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (safeUrls.length <= 1) return;
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((cur) => (cur + 1) % safeUrls.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [safeUrls.length, paused]);

  const canNavigate = safeUrls.length > 1;

  const next = () => setActive((cur) => (cur + 1) % safeUrls.length);
  const prev = () =>
    setActive((cur) => (cur - 1 + safeUrls.length) % safeUrls.length);

  return (
    <div
      className="group relative h-full w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {safeUrls.length > 0 ? (
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {safeUrls.map((url, i) => (
            <div
              key={url + i}
              className="h-full w-full shrink-0 relative overflow-hidden"
            >
              <img
                src={url}
                alt={`Product view ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover object-center select-none group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full w-full grid place-items-center text-brand-600 bg-surface-50/50">
          <img
            src="https://placehold.co/400x400?text=No+Image"
            className="h-full w-full object-cover opacity-20"
            alt="No image available"
          />
        </div>
      )}

      {canNavigate && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/40 active:scale-95 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/40 active:scale-95 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 px-1.5 py-0.5 rounded-full z-10 bg-black/10 backdrop-blur-sm">
            {safeUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActive(i);
                }}
                className={cn(
                  "h-0.5 rounded-full transition-all duration-300",
                  i === active ? "bg-white w-3" : "bg-white/50 w-0.5",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, updateCartCount } = useUserAuth();
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);

  const [isAnimate, setIsAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure the DOM is ready for the transition
      const timer = setTimeout(() => setIsAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimate(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fetchCart = useCallback(
    async (shouldUpdateGlobalCount = false) => {
      try {
        const { data } = await publicApi.get("/public/cart");
        setItems(data.data.items);
        if (shouldUpdateGlobalCount) {
          updateCartCount(data.data.items.length);
        }
      } catch (err) {
        // Only toast error if user is logged in
        if (isLoggedIn) {
          toast.error("Failed to load cart");
        }
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, updateCartCount],
  );

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchCart(true);
    }
  }, [isOpen, isLoggedIn, fetchCart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await publicApi.put(`/public/cart/${itemId}`, { quantity: newQuantity });
      fetchCart(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await publicApi.delete(`/public/cart/${itemId}`);
      toast.success("Item removed");
      fetchCart(true);
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const subtotal = items.reduce(
    (acc, item) => acc + parseFloat(item.price) * item.quantity,
    0,
  );

  if (!isVisible && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-all duration-300 ease-in-out",
          isAnimate ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col transition-all duration-500 ease-out",
          isAnimate ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
              <ShoppingBag size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Your Cart{" "}
              <span className="text-slate-400 font-bold ml-1">
                ({items.length})
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
          {loading && items.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-50 rounded-3xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                <ShoppingBag size={48} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Your cart is empty
                </h3>
                <p className="text-sm text-slate-400 font-medium">
                  Add some items to get started!
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-[#6366f1] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 flex gap-5 group hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
              >
                <div className="h-24 w-24 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 relative">
                  <ProductImageCarousel urls={item.image_urls || []} />
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-[15px] leading-tight group-hover:text-[#6366f1] transition-colors">
                        {item.product_name}
                      </h3>
                      <p className="text-[13px] font-bold text-slate-400 mt-1">
                        ${item.price}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-[#6366f1] disabled:opacity-30 transition-all shadow-sm active:scale-90"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-[13px] font-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stock_quantity}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-[#6366f1] disabled:opacity-30 transition-all shadow-sm active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-black text-slate-900 text-[15px]">
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-bold text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                <span className="text-lg font-black text-slate-900">Total</span>
                <span className="text-2xl font-black text-[#6366f1]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate("/checkout");
              }}
              className="w-full bg-[#6366f1] text-white py-4 rounded-2xl text-[15px] font-black hover:bg-[#4f46e5] transition-all shadow-xl shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
