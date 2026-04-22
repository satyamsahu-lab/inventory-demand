import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import { publicApi } from "../services/public-api";
import { auditLogService } from "../services/audit-log";
import { useUserAuth } from "../store/user-auth";
import { cn } from "../utils/cn";
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
            <div key={url + i} className="h-full w-full shrink-0 relative">
              <img
                src={url}
                alt={`Product view ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover object-center select-none"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full w-full grid place-items-center text-[hsl(var(--primary))] bg-surface-50/50">
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
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/40 active:scale-95 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/40 active:scale-95 z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
          >
            <ArrowRight size={20} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 rounded-full z-10 bg-black/10 backdrop-blur-sm">
            {safeUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActive(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === active ? "bg-white w-6" : "bg-white/50 w-1.5",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ProductDetailPage({ onOpenCart }: { onOpenCart?: () => void }) {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>("");
  const { isLoggedIn, updateCartCount } = useUserAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await publicApi.get(`/public/products/${id}`);
        setProduct(data.data.record);
        setActiveImage(data.data.record.image_urls[0] || "");

        // Log view activity
        await auditLogService.logFrontendActivity({
          action: "view",
          module: "PRODUCTS",
          description: `User viewed product (${data.data.record.name})`,
          metadata: { productId: id },
        });
      } catch (err) {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const addToCart = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      await publicApi.post("/public/cart", { productId: id, quantity });
      toast.success("Added to cart");

      const { data } = await publicApi.get("/public/cart");
      updateCartCount(data.data.items.length);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  if (loading) return <div className="animate-pulse">Loading product...</div>;
  if (!product)
    return <div className="text-center py-20">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-[hsl(var(--primary))] transition-colors text-[13px] font-bold group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-6">
            <div className="aspect-square bg-slate-50 rounded-[3rem] overflow-hidden group flex items-center justify-center p-12">
              <img
                src={activeImage || "https://placehold.co/800x800?text=Product"}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply transition-all duration-500"
              />
            </div>
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-6">
                {product.image_urls.map((url: string, index: number) => (
                  <div
                    key={index}
                    onClick={() => setActiveImage(url)}
                    className={cn(
                      "aspect-square bg-slate-50 rounded-2xl overflow-hidden cursor-pointer transition-all p-2 flex items-center justify-center border-2",
                      activeImage === url
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary)/0.5)]"
                        : "border-transparent hover:border-slate-200",
                    )}
                  >
                    <img
                      src={url}
                      alt={`${product.name} ${index}`}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
                  {product.category_name}
                </span>
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  SKU: {product.sku}
                </span>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-4xl font-bold text-[hsl(var(--primary))]">
                  ${product.price}
                </p>
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <span className="text-[13px] font-bold text-slate-900">
                    4.9
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                  <span className="text-[13px] font-bold text-slate-400 uppercase tracking-tight">
                    Rating
                  </span>
                </div>
              </div>
            </div>

            <div className="text-slate-500 text-[15px] font-medium leading-relaxed max-w-xl">
              {product.description ||
                "Premium quality product designed for excellence. Engineering precision and sophisticated design come together in this masterpiece."}
            </div>

            <div className="space-y-8 pt-10 border-t border-slate-100">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-full border border-slate-100">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-11 w-11 rounded-full bg-white flex items-center justify-center text-slate-600 hover:text-[hsl(var(--primary))] shadow-sm active:scale-95 transition-all font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(
                        Math.min(product.stock_quantity, quantity + 1),
                      )
                    }
                    className="h-11 w-11 rounded-full bg-white flex items-center justify-center text-slate-600 hover:text-[hsl(var(--primary))] shadow-sm active:scale-95 transition-all font-bold"
                  >
                    +
                  </button>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">
                    {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {product.stock_quantity} units ready to ship
                  </p>
                </div>
              </div>

              <button
                onClick={addToCart}
                disabled={product.stock_quantity === 0}
                className={cn(
                  "w-full py-5 rounded-full text-[15px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl",
                  product.stock_quantity === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)] shadow-[hsl(var(--primary)/0.25)]",
                )}
              >
                <ShoppingCart size={20} strokeWidth={2.5} />
                {product.stock_quantity === 0
                  ? "Currently Unavailable"
                  : "Add to Shopping Bag"}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-100">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[hsl(var(--primary))]">
                  <Truck size={24} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                  Free Delivery
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[hsl(var(--primary))]">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                  2 Year Warranty
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[hsl(var(--primary))]">
                  <RotateCcw size={24} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">
                  30 Day Returns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
