import { Router } from "express";
import { productPublicController } from "../controllers/product-public-controller.js";
import { categoryPublicController } from "../controllers/category-public-controller.js";
import { userAuthController } from "../controllers/user-auth-controller.js";
import { authJwt } from "../middleware/auth-jwt.js";

import { cartController } from "../controllers/cart-controller.js";
import { orderController } from "../controllers/order-controller.js";

export const publicRouter = Router();

// Auth
publicRouter.post("/auth/user/register", (req, res, next) =>
  userAuthController.register(req, res).catch(next),
);
publicRouter.post("/auth/user/login", (req, res, next) =>
  userAuthController.login(req, res).catch(next),
);
publicRouter.get("/auth/user/profile", authJwt, (req, res, next) =>
  userAuthController.profile(req, res).catch(next),
);

// Cart (Protected)
publicRouter.get("/cart", authJwt, (req, res, next) =>
  cartController.getCart(req, res).catch(next),
);
publicRouter.post("/cart", authJwt, (req, res, next) =>
  cartController.addItem(req, res).catch(next),
);
publicRouter.put("/cart/:itemId", authJwt, (req, res, next) =>
  cartController.updateQuantity(req, res).catch(next),
);
publicRouter.delete("/cart/:itemId", authJwt, (req, res, next) =>
  cartController.removeItem(req, res).catch(next),
);
publicRouter.delete("/cart", authJwt, (req, res, next) =>
  cartController.clearCart(req, res).catch(next),
);

// Orders (Protected)
publicRouter.post("/orders/checkout", authJwt, (req, res, next) =>
  orderController.checkout(req, res).catch(next),
);
publicRouter.get("/orders", authJwt, (req, res, next) =>
  orderController.list(req, res).catch(next),
);
publicRouter.get("/orders/:id", authJwt, (req, res, next) =>
  orderController.get(req, res).catch(next),
);

// Products
publicRouter.get("/products", (req, res, next) =>
  productPublicController.list(req, res).catch(next),
);
publicRouter.get("/products/:id", (req, res, next) =>
  productPublicController.get(req, res).catch(next),
);

// Categories
publicRouter.get("/categories", (req, res, next) =>
  categoryPublicController.list(req, res).catch(next),
);
publicRouter.get("/categories/:id/subcategories", (req, res, next) =>
  categoryPublicController.getSubcategories(req, res).catch(next),
);
