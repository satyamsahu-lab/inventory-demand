import type { Request, Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { ok, created } from "../shared/http/api-response.js";
import { orderRepository } from "../repositories/order-repository.js";
import { cartRepository } from "../repositories/cart-repository.js";
import { productRepository } from "../repositories/product-repository.js";
import { AuditLogService } from "../services/audit-log-service.js";
import { BadRequestError, NotFoundError } from "../shared/http/http-errors.js";
import { buildPagination } from "../shared/http/listing.js";

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

const ORDER_STATUSES = ["pending", "shipped", "in-transit", "delivered"];

export class OrderController {
  async listAll(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || "";
    const search = (req.query.search as string) || "";

    const result = await orderRepository.listAllOrders(page, limit, {
      status,
      search,
    });

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.total, page, limit),
      }),
    );
  }

  async getAdmin(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const order = await orderRepository.getById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    const items = await orderRepository.getOrderItems(id);
    return res.json(ok({ order, items }));
  }

  async updateStatus(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const { status } = z
      .object({
        status: z.enum(["pending", "shipped", "in-transit", "delivered"]),
      })
      .parse(req.body);

    const order = await orderRepository.getById(id);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const currentIndex = ORDER_STATUSES.indexOf(order.status);
    const nextIndex = ORDER_STATUSES.indexOf(status);

    if (nextIndex !== currentIndex + 1) {
      throw new BadRequestError(
        `Invalid status transition. Cannot move from ${order.status} to ${status}.`,
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updatedOrder = await orderRepository.updateStatus(id, status);

      // If status is shipped, record sales and update inventory
      if (status === "shipped") {
        const items = await orderRepository.getOrderItems(id);
        for (const item of items) {
          const { rows: prodRows } = await client.query(
            "SELECT created_by_admin_id FROM products WHERE id = $1",
            [item.product_id],
          );
          const adminId = prodRows[0]?.created_by_admin_id;

          // 1. Record Sale
          await client.query(
            "INSERT INTO sales (product_id, quantity_sold, sale_date, created_by_admin_id) VALUES ($1, $2, $3, $4)",
            [
              item.product_id,
              item.quantity,
              new Date().toISOString().split("T")[0],
              adminId,
            ],
          );

          // 2. Deduct Inventory
          await client.query(
            "UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2",
            [item.quantity, item.product_id],
          );
        }
      }

      await client.query("COMMIT");

      await AuditLogService.log({
        userId: req.user!.id,
        action: "UPDATE",
        module: "ORDER",
        description: `Order status updated to ${status} (Order #${id.slice(0, 8)})`,
        metadata: { orderId: id, status },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return res.json(ok({ order: updatedOrder }, "Status updated"));
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

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
          throw new BadRequestError(
            `Insufficient stock for product ${item.product_name}`,
          );
        }
        totalAmount += parseFloat(item.price!) * item.quantity;
      }

      // 2. Create Order
      const order = await orderRepository.createOrder(
        client,
        req.user.id,
        totalAmount,
        shippingAddress,
        paymentMethod,
      );

      // 3. Create Order Items
      for (const item of items) {
        await orderRepository.addOrderItem(
          client,
          order.id,
          item.product_id,
          item.quantity,
          item.price!,
        );
      }

      // 4. Clear Cart
      await client.query("DELETE FROM cart_items WHERE cart_id = $1", [
        cart.id,
      ]);

      await client.query("COMMIT");

      await AuditLogService.log({
        userId: req.user.id,
        action: "CREATE",
        module: "ORDER",
        description: `User placed order #${order.id.slice(0, 8)} totaling $${totalAmount.toFixed(2)}`,
        metadata: {
          orderId: order.id,
          totalAmount,
          items: items.map((i) => ({
            productName: i.product_name,
            quantity: i.quantity,
          })),
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

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

    await AuditLogService.log({
      userId: req.user.id,
      action: "view",
      module: "ORDER",
      description: `User viewed their order history`,
      metadata: { count: orders.length },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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

    await AuditLogService.log({
      userId: req.user.id,
      action: "view",
      module: "ORDER",
      description: `User viewed details for order #${id.slice(0, 8)}`,
      metadata: { orderId: id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ order, items }));
  }
}

export const orderController = new OrderController();
