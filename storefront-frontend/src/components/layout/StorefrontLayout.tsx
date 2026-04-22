import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Package,
} from "lucide-react";
import { useUserAuth } from "../../store/user-auth";
import { publicApi } from "../../services/public-api";
import { LoginModal } from "./LoginModal";
import { CartDrawer } from "./CartDrawer";
import { cn } from "../../utils/cn";

export function StorefrontLayout({
  children,
  onOpenCart,
}: {
  children: React.ReactNode;
  onOpenCart: () => void;
}) {
  const { isLoggedIn, user, cartCount, logout, updateCartCount } =
    useUserAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  // Expose the cart opening function to the parent
  useEffect(() => {
    (globalThis as any).__openCartDrawer = () => setIsCartDrawerOpen(true);
    return () => {
      delete (globalThis as any).__openCartDrawer;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchParams.set("search", searchQuery);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
    navigate("/shop?" + searchParams.toString());
  };

  const handleAuthAction = () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await publicApi.get(
          "/public/categories?parentId=null",
        );
        setCategories(data.data.records);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchCart = async () => {
        try {
          const { data } = await publicApi.get("/public/cart");
          updateCartCount(data.data.items.length);
        } catch (err) {
          console.error("Failed to fetch cart", err);
        }
      };
      fetchCart();
    }
  }, [isLoggedIn, updateCartCount]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      {/* Top Banner */}
      <div className="bg-[#6366f1] text-white py-2 px-4 text-center text-[11px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2">
        <span className="opacity-80">
          FREE SHIPPING ON ORDERS OVER $100 - USE CODE
        </span>
        <span className="bg-white/20 px-2 py-0.5 rounded">LUXE10</span>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-8">
            {/* Logo */}
            <Link to="/shop" className="flex items-center gap-2 shrink-0">
              <div className="h-9 w-9 rounded-xl bg-[#6366f1] flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <ShoppingCart size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Luxe<span className="text-[#6366f1]">Store</span>
              </span>
            </Link>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl relative group"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium products..."
                className="w-full bg-slate-50 border-none rounded-full py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6366f1] transition-colors"
              >
                <Search size={18} />
              </button>
            </form>

            {/* Desktop Nav & Actions */}
            <div className="hidden lg:flex items-center gap-8">
              <nav className="flex items-center gap-8">
                <Link
                  to="/shop"
                  className="text-[13px] font-semibold text-slate-600 hover:text-[#6366f1] transition-colors"
                >
                  Shop
                </Link>
                {isLoggedIn && (
                  <Link
                    to="/account/orders"
                    className="text-[13px] font-semibold text-slate-600 hover:text-[#6366f1] transition-colors flex items-center gap-1.5"
                  >
                    <Package size={14} />
                    Orders
                  </Link>
                )}
              </nav>

              <div className="flex items-center gap-3 border-l border-slate-200 pl-8">
                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      setIsCartDrawerOpen(true);
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  className="relative p-2 rounded-full hover:bg-slate-50 transition-all group cursor-pointer"
                >
                  <ShoppingCart
                    size={20}
                    className="text-slate-700 group-hover:text-[#6366f1] transition-colors"
                  />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#6366f1] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>

                {isLoggedIn ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/account/profile"
                      className="bg-indigo-50 text-[#6366f1] px-4 py-2 rounded-xl text-[13px] font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
                    >
                      <div className="h-5 w-5 rounded-full bg-indigo-200 flex items-center justify-center">
                        <UserIcon size={12} />
                      </div>
                      {user?.fullName?.split(" ")[0]}
                    </Link>
                    <button
                      onClick={logout}
                      className="p-2 rounded-full hover:bg-red-50 text-slate-500 hover:text-red-500 transition-all"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-[#6366f1] text-white px-6 py-2.5 rounded-full text-[13px] font-bold hover:bg-[#4f46e5] transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-50 transition-all text-slate-700"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "lg:hidden fixed inset-x-0 bg-white border-b border-slate-100 transition-all duration-300 overflow-hidden",
            isMenuOpen
              ? "max-h-[80vh] opacity-100 py-6"
              : "max-h-0 opacity-0 py-0",
          )}
        >
          <div className="px-4 space-y-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/10"
              />
              <button
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <Search size={18} />
              </button>
            </form>
            <nav className="flex flex-col gap-1">
              <Link
                to="/shop"
                className="px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-xl"
              >
                Shop
              </Link>
              {isLoggedIn && (
                <Link
                  to="/account/orders"
                  className="px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                >
                  <Package size={18} />
                  Orders
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">{children}</main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[#6366f1] flex items-center justify-center text-white">
                  <ShoppingCart size={20} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  Luxe<span className="text-[#6366f1]">Store</span>
                </span>
              </div>
              <p className="text-slate-500 text-[13px] leading-relaxed max-w-xs font-medium">
                Premium products delivered with passion. The best in modern
                inventory and storefront tech.
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-8">
                Shop
              </h4>
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600">
                <li>
                  <Link
                    to="/shop"
                    className="hover:text-[#6366f1] transition-colors"
                  >
                    All Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop#products"
                    className="hover:text-[#6366f1] transition-colors"
                  >
                    Categories
                  </Link>
                </li>
                {isLoggedIn && (
                  <li>
                    <Link
                      to="/account/orders"
                      className="hover:text-[#6366f1] transition-colors"
                    >
                      My Orders
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-8">
                Support
              </h4>
              <ul className="space-y-4 text-[13px] font-semibold text-slate-600">
                <li>
                  <Link
                    to="#"
                    className="hover:text-[#6366f1] transition-colors"
                  >
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-[#6366f1] transition-colors"
                  >
                    Returns
                  </Link>
                </li>
                <li>
                  <Link
                    to="#"
                    className="hover:text-[#6366f1] transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-8">
                Newsletter
              </h4>
              <p className="text-slate-500 text-[13px] mb-6 font-medium">
                Subscribe for early access and deals.
              </p>
              <div className="flex gap-2 relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-slate-50 border-none rounded-full py-3 pl-6 pr-14 text-[13px] focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400"
                />
                <button className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-[#6366f1] text-white rounded-full flex items-center justify-center hover:bg-[#4f46e5] transition-all shadow-md shadow-indigo-500/20">
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-[11px] font-semibold">
              © 2026 LuxeStore. All rights reserved.
            </p>
            <div className="flex gap-10 text-[11px] font-bold text-slate-500">
              <Link to="#" className="hover:text-[#6366f1] transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="hover:text-[#6366f1] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
