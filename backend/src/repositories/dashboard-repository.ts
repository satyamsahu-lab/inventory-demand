import { pool } from "../db/pool.js";

export class DashboardRepository {
  async summary(
    scopeAdminId: string,
    caps: {
      canProducts: boolean;
      canSales: boolean;
      canInventory: boolean;
      canUsers: boolean;
    },
    filters?: { startDate?: string; endDate?: string },
  ) {
    const dateFilter =
      filters?.startDate && filters?.endDate
        ? " AND created_at BETWEEN $2 AND $3"
        : "";
    const saleDateFilter =
      filters?.startDate && filters?.endDate
        ? " AND sale_date BETWEEN $2 AND $3"
        : "";
    const params =
      filters?.startDate && filters?.endDate
        ? [scopeAdminId, filters.startDate, filters.endDate]
        : [scopeAdminId];

    const totalProducts = caps.canProducts
      ? ((
          await pool.query<{ total: number }>(
            "SELECT COUNT(*)::int as total FROM products WHERE created_by_admin_id = $1",
            [scopeAdminId],
          )
        ).rows[0]?.total ?? 0)
      : 0;

    const totalSales = caps.canSales
      ? ((
          await pool.query<{ total: number }>(
            `SELECT COALESCE(SUM(quantity_sold), 0)::int as total FROM sales WHERE created_by_admin_id = $1${saleDateFilter}`,
            params,
          )
        ).rows[0]?.total ?? 0)
      : 0;

    const totalRevenue =
      caps.canSales && caps.canProducts
        ? ((
            await pool.query<{ total: number }>(
              `SELECT COALESCE(SUM(s.quantity_sold * p.price), 0)::numeric(12,2) as total
           FROM sales s
           JOIN products p ON p.id = s.product_id
           WHERE s.created_by_admin_id = $1${saleDateFilter.replace("sale_date", "s.sale_date")}`,
              params,
            )
          ).rows[0]?.total ?? 0)
        : 0;

    const lowStockCount = caps.canInventory
      ? ((
          await pool.query<{ total: number }>(
            `SELECT COUNT(*)::int as total
           FROM inventory i
           JOIN products p ON p.id = i.product_id
           WHERE i.created_by_admin_id = $1 AND i.quantity < p.min_stock_threshold`,
            [scopeAdminId],
          )
        ).rows[0]?.total ?? 0)
      : 0;

    const totalUsers = caps.canUsers
      ? ((
          await pool.query<{ total: number }>(
            "SELECT COUNT(*)::int as total FROM users WHERE created_by_admin_id = $1",
            [scopeAdminId],
          )
        ).rows[0]?.total ?? 0)
      : 0;

    return {
      totalProducts,
      totalSales,
      lowStockCount,
      totalRevenue,
      totalUsers,
    };
  }

  async topSellingProducts(
    scopeAdminId: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const saleDateFilter =
      filters?.startDate && filters?.endDate
        ? " AND s.sale_date BETWEEN $2 AND $3"
        : "";
    const params =
      filters?.startDate && filters?.endDate
        ? [scopeAdminId, filters.startDate, filters.endDate]
        : [scopeAdminId];

    const { rows } = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.sku, 
        COALESCE(SUM(s.quantity_sold), 0)::int as total_qty,
        COALESCE(SUM(s.quantity_sold * p.price), 0)::numeric(12,2) as total_revenue
       FROM products p
       JOIN sales s ON s.product_id = p.id
       WHERE s.created_by_admin_id = $1${saleDateFilter}
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_qty DESC
       LIMIT 5`,
      params,
    );
    return rows;
  }

  async lowStock(scopeAdminId: string) {
    const { rows } = await pool.query(
      `SELECT
        p.id as product_id,
        p.name,
        p.sku,
        i.quantity,
        p.min_stock_threshold
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE i.created_by_admin_id = $1 AND i.quantity < p.min_stock_threshold
       ORDER BY (p.min_stock_threshold - i.quantity) DESC
       LIMIT 20`,
      [scopeAdminId],
    );
    return rows;
  }

  async salesTrends(
    scopeAdminId: string,
    filters?: { startDate?: string; endDate?: string },
  ) {
    const saleDateFilter =
      filters?.startDate && filters?.endDate
        ? " AND sale_date BETWEEN $2 AND $3"
        : " AND sale_date >= (current_date - 30)";
    const params =
      filters?.startDate && filters?.endDate
        ? [scopeAdminId, filters.startDate, filters.endDate]
        : [scopeAdminId];

    const { rows } = await pool.query<{ day: string; total: number }>(
      `SELECT sale_date::text as day, SUM(quantity_sold)::int as total
       FROM sales
       WHERE created_by_admin_id = $1${saleDateFilter}
       GROUP BY sale_date
       ORDER BY sale_date`,
      params,
    );
    return rows;
  }

  async inventoryVsDemand(
    scopeAdminId: string,
    input: { days: number; window: number },
  ) {
    const { rows } = await pool.query<{
      product_id: string;
      name: string;
      sku: string;
      inventory_qty: number;
      avg_daily_demand: number;
    }>(
      `WITH sales_window AS (
         SELECT product_id, AVG(daily_qty)::numeric(12,2) as avg_daily_demand
         FROM (
           SELECT product_id, sale_date, SUM(quantity_sold)::int as daily_qty
           FROM sales
           WHERE created_by_admin_id = $1 AND sale_date >= (current_date - $2::int)
           GROUP BY product_id, sale_date
         ) t
         GROUP BY product_id
       )
       SELECT
         p.id as product_id,
         p.name,
         p.sku,
         COALESCE(i.quantity, 0)::int as inventory_qty,
         COALESCE(sw.avg_daily_demand, 0)::numeric(12,2) as avg_daily_demand
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id AND i.created_by_admin_id = $1
       LEFT JOIN sales_window sw ON sw.product_id = p.id
       WHERE p.created_by_admin_id = $1
       ORDER BY p.name
       LIMIT 50`,
      [scopeAdminId, input.window],
    );

    return rows;
  }
}

export const dashboardRepository = new DashboardRepository();
