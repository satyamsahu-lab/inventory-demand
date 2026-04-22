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
  async createOrder(
    client: any,
    userId: string,
    totalAmount: number,
    shippingAddress: any,
    paymentMethod: string,
  ) {
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, payment_method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, totalAmount, JSON.stringify(shippingAddress), paymentMethod],
    );
    return rows[0];
  }

  async addOrderItem(
    client: any,
    orderId: string,
    productId: string,
    quantity: number,
    price: string,
  ) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
       VALUES ($1, $2, $3, $4)`,
      [orderId, productId, quantity, price],
    );
  }

  async listUserOrders(userId: string) {
    const { rows } = await pool.query<OrderRow>(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    return rows;
  }

  async getOrderById(userId: string, orderId: string) {
    const { rows } = await pool.query<OrderRow>(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, userId],
    );
    return rows[0] ?? null;
  }

  async getOrderItems(orderId: string) {
    const { rows } = await pool.query<OrderItemRow>(
      `SELECT oi.*, p.name as product_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [orderId],
    );
    return rows;
  }

  async listAllOrders(page: number, limit: number, filters: any) {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const values: any[] = [limit, offset];
    let paramIndex = 3;

    if (filters.status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR o.id::text ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const query = `
      SELECT o.*, u.full_name as user_name, u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
    `;

    const [ordersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(2)),
    ]);

    return {
      records: ordersResult.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  async updateStatus(orderId: string, status: string) {
    const { rows } = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, orderId],
    );
    return rows[0];
  }

  async getById(id: string) {
    const { rows } = await pool.query(
      `SELECT o.*, u.full_name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id],
    );
    return rows[0];
  }
}

export const orderRepository = new OrderRepository();
