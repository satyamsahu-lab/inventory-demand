import { pool } from "../db/pool.js";
import { env } from "../shared/env.js";

export type CartItemRow = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  product_name?: string;
  price?: string;
  stock_quantity?: number;
  image_urls?: string[];
};

export type CartRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

class CartRepository {
  async getByUserId(userId: string) {
    const { rows } = await pool.query<CartRow>(
      "SELECT * FROM carts WHERE user_id = $1",
      [userId],
    );
    return rows[0] ?? null;
  }

  async create(userId: string) {
    const { rows } = await pool.query<CartRow>(
      "INSERT INTO carts (user_id) VALUES ($1) RETURNING *",
      [userId],
    );
    return rows[0];
  }

  async getItems(cartId: string) {
    const { rows } = await pool.query<CartItemRow>(
      `SELECT ci.*, p.name as product_name, p.price::text as price, inv.quantity as stock_quantity,
        (SELECT array_agg(file_name) FROM product_images WHERE product_id = p.id) as image_names
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN inventory inv ON inv.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId],
    );

    return rows.map((row) => {
      const names = (row as any).image_names || [];
      return {
        ...row,
        image_urls: names.map(
          (name: string) =>
            `${env.APP_URL}${env.UPLOAD_DIR}/products/${row.product_id}/${name}`,
        ),
      };
    });
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const { rows } = await pool.query<CartItemRow>(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [cartId, productId, quantity],
    );
    return rows[0];
  }

  async updateItemQuantity(cartId: string, itemId: string, quantity: number) {
    const { rows } = await pool.query<CartItemRow>(
      `UPDATE cart_items
       SET quantity = $3
       WHERE id = $2 AND cart_id = $1
       RETURNING *`,
      [cartId, itemId, quantity],
    );
    return rows[0] ?? null;
  }

  async removeItem(cartId: string, itemId: string) {
    await pool.query("DELETE FROM cart_items WHERE id = $2 AND cart_id = $1", [
      cartId,
      itemId,
    ]);
  }

  async clearCart(cartId: string) {
    await pool.query("DELETE FROM cart_items WHERE cart_id = $1", [cartId]);
  }
}

export const cartRepository = new CartRepository();
