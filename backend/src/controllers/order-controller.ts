import type { Request, Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { ok, created } from "../shared/http/api-response.js";
import { orderRepository } from "../repositories/order-repository.js";
import { cartRepository } from "../repositories/cart-repository.js";
import { BadRequestError } from "../shared/http/http-errors.js";

const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1),
    addressLine1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    phone: z.string().min(1),
  }),
  paymentMethod: z.string().min(1),
});

export class OrderController {
  async checkout(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const { shippingAddress, paymentMethod } = checkoutSchema.parse(req.body);

    const cart = await cartRepository.getByUserId(req.user.id);
    if (!cart) {
      throw new BadRequestError("Cart is empty");
    }

    const items = await cartRepository.getItems(cart.id);
    if (items.length === 0) {
      throw new BadRequestError("Cart is empty");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Calculate total and validate stock again
      let totalAmount = 0;
      for (const item of items) {
        const stock = item.stock_quantity ?? 0;
        if (stock < item.quantity) {
          throw new BadRequestError(`Insufficient stock for product ${item.product_name}`);
        }
        totalAmount += parseFloat(item.price!) * item.quantity;
      }

      // 2. Create Order
      const order = await orderRepository.createOrder(client, req.user.id, totalAmount, shippingAddress, paymentMethod);

      // 3. Create Order Items & Deduct Inventory
      for (const item of items) {
        await orderRepository.addOrderItem(client, order.id, item.product_id, item.quantity, item.price!);
        
        // Deduct inventory (we'll just update the quantity)
        await client.query(
          "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2",
          [item.quantity, item.product_id]
        );

        // Also record a sale (matching existing admin logic)
        // Find who created this product to associate the sale correctly
        const { rows: prodRows } = await client.query("SELECT created_by_admin_id FROM products WHERE id = $1", [item.product_id]);
        const adminId = prodRows[0]?.created_by_admin_id;
        
        await client.query(
          "INSERT INTO sales (product_id, quantity_sold, sale_date, created_by_admin_id) VALUES ($1, $2, $3, $4)",
          [item.product_id, item.quantity, new Date().toISOString().split('T')[0], adminId]
        );
      }

      // 4. Clear Cart
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.id]);

      await client.query("COMMIT");
      return res.status(201).json(created({ order }));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async list(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const orders = await orderRepository.listUserOrders(req.user.id);
    return res.json(ok({ records: orders }));
  }

  async get(req: Request, res: Response) {
    if (!req.user) throw new BadRequestError("Unauthorized");
    const id = z.string().uuid().parse(req.params.id);
    const order = await orderRepository.getOrderById(req.user.id, id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const items = await orderRepository.getOrderItems(id);
    return res.json(ok({ order, items }));
  }
}

export const orderController = new OrderController();
