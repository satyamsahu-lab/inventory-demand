import type { Request, Response } from "express";
import { z } from "zod";
import { ok, created } from "../shared/http/api-response.js";
import { cartRepository } from "../repositories/cart-repository.js";
import { productRepository } from "../repositories/product-repository.js";
import { AuditLogService } from "../services/audit-log-service.js";
import { BadRequestError } from "../shared/http/http-errors.js";

const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

const updateQuantitySchema = z.object({
  quantity: z.number().int().nonnegative(),
});

export class CartController {
  private async getOrCreateCart(userId: string) {
    let cart = await cartRepository.getByUserId(userId);
    if (!cart) {
      cart = await cartRepository.create(userId);
    }
    return cart;
  }

  async getCart(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const cart = await this.getOrCreateCart(req.user.id);
    const items = await cartRepository.getItems(cart.id);

    await AuditLogService.log({
      userId: req.user.id,
      action: "view",
      module: "CART",
      description: `User viewed shopping cart containing ${items.length} items`,
      metadata: { itemCount: items.length },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ cart, items }));
  }

  async addItem(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const { productId, quantity } = cartItemInputSchema.parse(req.body);

    // Validate stock
    const product = await productRepository.getPublicById(productId);
    if (!product) {
      throw new BadRequestError("Product not found");
    }

    const currentStock = (product as any).stock_quantity ?? 0;
    if (currentStock < quantity) {
      throw new BadRequestError(
        `Insufficient stock. Only ${currentStock} available.`,
      );
    }

    const cart = await this.getOrCreateCart(req.user.id);
    const row = await cartRepository.addItem(cart.id, productId, quantity);

    await AuditLogService.log({
      userId: req.user.id,
      action: "UPDATE",
      module: "CART",
      description: `User added product (${product.sku}) to cart with quantity ${quantity}`,
      metadata: { productId, quantity },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json(created({ item: row }));
  }

  async updateQuantity(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const itemId = z.string().uuid().parse(req.params.itemId);
    const { quantity } = updateQuantitySchema.parse(req.body);

    const cart = await this.getOrCreateCart(req.user.id);

    if (quantity === 0) {
      await cartRepository.removeItem(cart.id, itemId);
      return res.json(ok({ ok: true }, "Removed from cart"));
    }

    // Validate stock for the new quantity
    const items = await cartRepository.getItems(cart.id);
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      throw new BadRequestError("Item not found in cart");
    }

    const currentStock = item.stock_quantity ?? 0;
    if (currentStock < quantity) {
      throw new BadRequestError(
        `Insufficient stock. Only ${currentStock} available.`,
      );
    }

    const row = await cartRepository.updateItemQuantity(
      cart.id,
      itemId,
      quantity,
    );

    await AuditLogService.log({
      userId: req.user.id,
      action: "UPDATE",
      module: "CART",
      description: `User updated cart item quantity (Item ID: ${itemId}) to ${quantity}`,
      metadata: { itemId, quantity },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ item: row }));
  }

  async removeItem(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const itemId = z.string().uuid().parse(req.params.itemId);
    const cart = await this.getOrCreateCart(req.user.id);

    await cartRepository.removeItem(cart.id, itemId);

    await AuditLogService.log({
      userId: req.user.id,
      action: "DELETE",
      module: "CART",
      description: `User removed item from cart (Item ID: ${itemId})`,
      metadata: { itemId },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ ok: true }, "Removed from cart"));
  }

  async clearCart(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const cart = await this.getOrCreateCart(req.user.id);

    await cartRepository.clearCart(cart.id);

    await AuditLogService.log({
      userId: req.user.id,
      action: "DELETE",
      module: "CART",
      description: `User cleared their shopping cart`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ ok: true }, "Cart cleared"));
  }
}

export const cartController = new CartController();
