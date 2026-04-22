import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Filter,
  Search as SearchIcon,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { publicApi } from "../services/public-api";
import { cn } from "../utils/cn";
import { useUserAuth } from "../store/user-auth";
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
    <>
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
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/40 active:scale-95 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-black/40 active:scale-95 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 rounded-full z-10 bg-black/10 backdrop-blur-sm">
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
                    "h-1 rounded-full transition-all duration-300",
                    i === active ? "bg-white w-4" : "bg-white/50 w-1",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function ShopPage({ onOpenCart }: { onOpenCart?: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({
    page: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, updateCartCount } = useUserAuth();
  const observer = useRef<IntersectionObserver | null>(null);

  const activeCategory = searchParams.get("category");

  // Reset and load products when search params change (except page)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setPage(1);
      try {
        const params: any = {
          page: 1,
          limit: 12,
          search: searchParams.get("search") || undefined,
          category_id: searchParams.get("category") || undefined,
        };

        const [prodRes, catRes] = await Promise.all([
          publicApi.get("/public/products", { params }),
          publicApi.get("/public/categories", {
            params: { parentId: "null", onlyActive: true },
          }),
        ]);
        setProducts(prodRes.data.data.records);
        setCategories(catRes.data.data.records);
        setPagination(prodRes.data.data.pagination);
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [searchParams]);

  // Load more products for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || page >= pagination.totalPages) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const params: any = {
        page: nextPage,
        limit: 12,
        search: searchParams.get("search") || undefined,
        category_id: searchParams.get("category") || undefined,
      };

      const { data } = await publicApi.get("/public/products", {
        params,
      });

      setProducts((prev) => [...prev, ...data.data.records]);
      setPage(nextPage);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error("Failed to load more products");
    } finally {
      setLoadingMore(false);
    }
  }, [page, pagination.totalPages, loadingMore, searchParams]);

  // Intersection Observer for infinite scroll
  const lastProductElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < pagination.totalPages) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, page, pagination.totalPages, loadMore],
  );

  const addToCart = async (productId: string) => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      await publicApi.post("/public/cart", { productId, quantity: 1 });
      toast.success("Added to cart");

      // Update cart count
      const { data } = await publicApi.get("/public/cart");
      updateCartCount(data.data.items.length);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#F9F9FF] pt-10 pb-10">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[40%] aspect-square bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] aspect-square bg-purple-500/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-indigo-100 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                New Spring Drop · Up to 50% off
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-8">
              Shop the future of <br />
              <span className="text-[#6366f1]">premium quality.</span>
            </h1>

            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mb-12">
              Hand-picked products engineered for people who care about every
              detail.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById("products");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#6366f1] text-white px-8 py-4 rounded-full font-bold text-[15px] hover:bg-[#4f46e5] transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2 group"
              >
                Browse Collection
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </div>

            <div className="mt-21 flex flex-wrap gap-12 border-t border-slate-100 pt-12">
              <div>
                <p className="text-2xl font-bold text-slate-900">10k+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Happy customers
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">4.9★</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Avg. rating
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">48h</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Fast delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section
        id="products"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
      >
        {/* Featured Products Header */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Featured Products
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {pagination.totalRecords} products available
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap items-center gap-3 mb-16">
          <button
            onClick={() => {
              searchParams.delete("category");
              setSearchParams(searchParams);
            }}
            className={cn(
              "px-6 py-2.5 rounded-full text-[13px] font-bold transition-all",
              !activeCategory
                ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100",
            )}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                searchParams.set("category", cat.id);
                setSearchParams(searchParams);
              }}
              className={cn(
                "px-6 py-2.5 rounded-full text-[13px] font-bold transition-all",
                activeCategory === cat.id
                  ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <div key={i} className="space-y-6 animate-pulse">
                <div className="aspect-[4/5] bg-slate-100 rounded-[2rem]" />
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-6 bg-slate-100 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => {
                const isLast = products.length === index + 1;
                return (
                  <div
                    key={`${product.id}-${index}`}
                    ref={isLast ? lastProductElementRef : null}
                    className="group bg-[#f8f9ff] rounded-[2rem] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 flex flex-col relative"
                  >
                    {/* Badge */}
                    <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                      {product.stock_quantity <= 5 &&
                        product.stock_quantity > 0 && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg">
                            Low Stock
                          </span>
                        )}
                    </div>

                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-8 bg-white/50">
                      <Link
                        to={`/product/${product.id}`}
                        className="block h-full w-full"
                      >
                        <ProductImageCarousel
                          urls={
                            product.image_urls && product.image_urls.length > 0
                              ? product.image_urls
                              : [product.first_image_url].filter(Boolean)
                          }
                        />
                      </Link>
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
                          <span className="text-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] border border-slate-900 px-4 py-2 rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {product.category_name}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          SKU: {product.sku.split("-")[0]}
                        </span>
                      </div>
                      <Link to={`/product/${product.id}`} className="block">
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#6366f1] transition-colors leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-[13px] text-slate-500 line-clamp-2 font-medium leading-relaxed">
                        {product.description ||
                          "Premium quality product designed for excellence."}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Price
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                          ${product.price}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock_quantity === 0}
                        className={cn(
                          "h-11 w-11 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg",
                          product.stock_quantity === 0
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            : "bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-indigo-500/20",
                        )}
                      >
                        <ShoppingCart size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3 bg-white px-8 py-4 rounded-full border border-slate-100 shadow-xl shadow-slate-200/50">
                  <Loader2 className="animate-spin text-[#6366f1]" size={20} />
                  <span className="text-[13px] font-bold text-slate-600">
                    Loading more products...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[3rem] p-20 text-center space-y-6">
            <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto text-slate-300 shadow-sm">
              <SearchIcon size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                No products found
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                Try adjusting your filters or search query.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchParams({});
              }}
              className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold text-sm border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
