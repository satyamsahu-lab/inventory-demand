import { Router } from "express";
import type { Request, Response } from "express";
import { authRouter } from "./auth-routes.js";
import { meRouter } from "./me-routes.js";
import { productRouter } from "./product-routes.js";
import { inventoryRouter } from "./inventory-routes.js";
import { salesRouter } from "./sales-routes.js";
import { roleRouter } from "./role-routes.js";
import { permissionRouter } from "./permission-routes.js";
import { dashboardRouter } from "./dashboard-routes.js";
import { userRouter } from "./user-routes.js";
import { profileRouter } from "./profile-routes.js";
import { categoryRouter } from "./category-routes.js";
import { publicRouter } from "./public-routes.js";
import { auditLogRouter } from "./audit-log-routes.js";
import { orderController } from "../controllers/order-controller.js";
import { authJwt } from "../middleware/auth-jwt.js";

export const apiRouter = Router();

apiRouter.use("/public", publicRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/inventory", inventoryRouter);
apiRouter.use("/sales", salesRouter);
apiRouter.use("/roles", roleRouter);
apiRouter.use("/permissions", permissionRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/users", userRouter);
apiRouter.use(
  "/orders",
  authJwt,
  (req, res, next) => {
    // Simple check for Admin/Super Admin
    if (req.user?.role.name === "User") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  },
  Router()
    .get("/", (req, res, next) => orderController.listAll(req, res).catch(next))
    .get("/:id", (req, res, next) =>
      orderController.getAdmin(req, res).catch(next),
    )
    .patch("/:id/status", (req, res, next) =>
      orderController.updateStatus(req, res).catch(next),
    ),
);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/audit-logs", auditLogRouter);

apiRouter.get("/health", (_req: Request, res: Response) => {
  return res.json({
    data: { ok: true },
    settings: {
      status: 200,
      message: "Success",
    },
  });
});
