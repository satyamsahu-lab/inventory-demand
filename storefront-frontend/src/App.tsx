import { Suspense, lazy, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { StorefrontLayout } from "./components/layout/StorefrontLayout";
import { useUserAuth } from "./store/user-auth";

const ShopPage = lazy(() =>
  import("./pages/ShopPage").then((m) => ({ default: m.ShopPage })),
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })),
);
const UserOrdersPage = lazy(() =>
  import("./pages/UserOrdersPage").then((m) => ({ default: m.UserOrdersPage })),
);
const OrderDetailsPage = lazy(() =>
  import("./pages/OrderDetailsPage").then((m) => ({
    default: m.OrderDetailsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({
    default: m.ProductDetailPage,
  })),
);

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface-50/50 backdrop-blur-sm z-[1000]">
      <div className="w-64 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-[0.2em] animate-pulse">
            Synchronizing Data
          </span>
          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
            Please Wait
          </span>
        </div>
        <div className="h-1.5 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden shadow-inner-soft">
          <div className="h-full bg-[hsl(var(--primary))] rounded-full animate-progress origin-left shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-pulse-soft" />
        </div>
        <p className="text-center text-[10px] text-surface-400 font-medium italic">
          Preparing your experience...
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useUserAuth();
  if (!isLoggedIn) {
    return <Navigate to="/shop" replace />;
  }
  return <>{children}</>;
}

export function App() {
  const { isLoggedIn } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user is not logged in and not on a public page, redirect to shop
    const publicPaths = ["/shop", "/product/"];
    const isPublicPath = publicPaths.some((p) =>
      location.pathname.startsWith(p),
    );

    if (!isLoggedIn && !isPublicPath && location.pathname !== "/") {
      navigate("/shop", { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate]);

  const openCart = () => {
    if ((globalThis as any).__openCartDrawer) {
      (globalThis as any).__openCartDrawer();
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          element={
            <StorefrontLayout onOpenCart={openCart}>
              <Outlet />
            </StorefrontLayout>
          }
        >
          <Route path="/shop" element={<ShopPage onOpenCart={openCart} />} />
          <Route
            path="/product/:id"
            element={<ProductDetailPage onOpenCart={openCart} />}
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders"
            element={
              <ProtectedRoute>
                <UserOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/shop" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </Suspense>
  );
}
