import { pool } from "../db/pool.js";

export type OrderRow = {
  id: string;
  user_id: string;
  total_amount: string;
  status: string;
  shipping_address: any;
  payment_method: string;
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_order: string;
  product_name?: string;
};

class OrderRepository {
  async createOrder(client: any, userId: string, totalAmount: number, shippingAddress: any, paymentMethod: string) {
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, totalAmount, JSON.stringify(shippingAddress), paymentMethod]
    );
    return rows[0];
  }

  async addOrderItem(client: any, orderId: string, productId: string, quantity: number, price: string) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
       VALUES ($1, $2, $3, $4)`,
      [orderId, productId, quantity, price]
    );
  }

  async listUserOrders(userId: string) {
    const { rows } = await pool.query<OrderRow>(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  async getOrderById(userId: string, orderId: string) {
    const { rows } = await pool.query<OrderRow>(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId]
    );
    return rows[0] ?? null;
  }

  async getOrderItems(orderId: string) {
    const { rows } = await pool.query<OrderItemRow>(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return rows;
  }
}

export const orderRepository = new OrderRepository();
