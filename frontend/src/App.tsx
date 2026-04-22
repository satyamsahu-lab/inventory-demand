import { Suspense, lazy } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  Routes,
  Route,
} from "react-router-dom";

import { AuthLayout } from "./components/layout/AuthLayout";
import { AppLayout } from "./components/layout/AppLayout";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const UsersPage = lazy(() =>
  import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })),
);
const RolesPage = lazy(() =>
  import("./pages/RolesPage").then((m) => ({ default: m.RolesPage })),
);
const PermissionsPage = lazy(() =>
  import("./pages/PermissionsPage").then((m) => ({
    default: m.PermissionsPage,
  })),
);
const CategoriesPage = lazy(() =>
  import("./pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })),
);
const ProductsPage = lazy(() =>
  import("./pages/ProductsPage").then((m) => ({ default: m.ProductsPage })),
);
const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((m) => ({ default: m.InventoryPage })),
);
const SalesPage = lazy(() =>
  import("./pages/SalesPage").then((m) => ({ default: m.SalesPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const ActivityLogPage = lazy(() =>
  import("./pages/ActivityLogPage").then((m) => ({
    default: m.ActivityLogPage,
  })),
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((m) => ({ default: m.OrdersPage })),
);
const OrderDetailPage = lazy(() =>
  import("./pages/OrderDetailPage").then((m) => ({
    default: m.OrderDetailPage,
  })),
);
const NoPermissionPage = lazy(() =>
  import("./pages/NoPermissionPage").then((m) => ({
    default: m.NoPermissionPage,
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

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route
            path="/categories"
            element={<CategoriesPage type="category" />}
          />
          <Route
            path="/subcategories"
            element={<CategoriesPage type="subcategory" />}
          />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/activity-logs" element={<ActivityLogPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/my-profile" element={<ProfilePage />} />
          <Route path="/no-permission" element={<NoPermissionPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
