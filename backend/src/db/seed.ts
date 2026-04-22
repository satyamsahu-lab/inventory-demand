import { pool } from "./pool.js";
import { hashPassword } from "../shared/security/password.js";

type Permission = {
  module_name: string;
  action: "view" | "add" | "edit" | "delete";
};

const MODULES = [
  "Dashboard",
  "Users",
  "Roles",
  "Permissions",
  "Products",
  "Inventory",
  "Sales",
  "Categories",
] as const;
const ACTIONS = ["view", "add", "edit", "delete"] as const;

function buildPermissions(): Permission[] {
  const permissions: Permission[] = [];
  for (const module_name of MODULES) {
    for (const action of ACTIONS) {
      permissions.push({ module_name, action });
    }
  }
  return permissions;
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const roleNames = ["Super Admin", "Admin", "User"] as const;

    const roles = new Map<string, string>();
    for (const name of roleNames) {
      const { rows } = await client.query<{ id: string }>(
        "INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [name],
      );
      roles.set(name, rows[0].id);
    }

    const perms = buildPermissions();

    const permissionIds: Array<{
      id: string;
      module_name: string;
      action: string;
    }> = [];
    for (const p of perms) {
      const { rows } = await client.query<{
        id: string;
        module_name: string;
        action: string;
      }>(
        "INSERT INTO permissions (module_name, action) VALUES ($1, $2) ON CONFLICT (module_name, action) DO UPDATE SET module_name = EXCLUDED.module_name RETURNING id, module_name, action",
        [p.module_name, p.action],
      );
      permissionIds.push(rows[0]);
    }

    // Super Admin: all permissions
    const superAdminRoleId = roles.get("Super Admin")!;
    for (const perm of permissionIds) {
      await client.query(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING",
        [superAdminRoleId, perm.id],
      );
    }

    // Default Super Admin user
    const adminEmail = "hbadmin@yopmail.com";
    const adminPassword = await hashPassword("Admin@123");

    const { rows: userRows } = await client.query<{ id: string }>(
      `INSERT INTO users (full_name, email, password, role_id, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      ["Super Admin", adminEmail, adminPassword, superAdminRoleId, null],
    );

    const superAdminUserId = userRows[0].id;
    const adminRoleId = roles.get("Admin")!;
    const userRoleId = roles.get("User")!;

    // Ensure created_by_admin_id for Super Admin is itself for scoping convenience
    await client.query(
      "UPDATE users SET created_by_admin_id = $1 WHERE id = $1",
      [superAdminUserId],
    );

    // Seed Admins (Multiple admins to test visibility)
    const adminAPassword = await hashPassword("Admin@123");
    const { rows: adminARows } = await client.query<{ id: string }>(
      `INSERT INTO users (full_name, email, password, role_id, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [
        "Admin A",
        "admina@demo.com",
        adminAPassword,
        adminRoleId,
        superAdminUserId,
      ],
    );
    const adminAId = adminARows[0].id;

    const adminBPassword = await hashPassword("Admin@123");
    const { rows: adminBRows } = await client.query<{ id: string }>(
      `INSERT INTO users (full_name, email, password, role_id, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [
        "Admin B",
        "adminb@demo.com",
        adminBPassword,
        adminRoleId,
        superAdminUserId,
      ],
    );
    const adminBId = adminBRows[0].id;

    // Seed Products for Admin A
    for (let i = 1; i <= 5; i++) {
      const name = `Admin A Product ${i}`;
      const sku = `A-PROD-${1000 + i}`;
      const price = (Math.random() * 500 + 10).toFixed(2);
      const minStock = Math.floor(Math.random() * 20) + 5;

      await client.query(
        "INSERT INTO products (name, sku, price, min_stock_threshold, created_by_admin_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (created_by_admin_id, sku) DO NOTHING",
        [name, sku, price, minStock, adminAId],
      );
    }

    // Seed Products for Admin B
    for (let i = 1; i <= 5; i++) {
      const name = `Admin B Product ${i}`;
      const sku = `B-PROD-${1000 + i}`;
      const price = (Math.random() * 500 + 10).toFixed(2);
      const minStock = Math.floor(Math.random() * 20) + 5;

      await client.query(
        "INSERT INTO products (name, sku, price, min_stock_threshold, created_by_admin_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (created_by_admin_id, sku) DO NOTHING",
        [name, sku, price, minStock, adminBId],
      );
    }

    // Seed Users (20 entries)
    for (let i = 1; i <= 20; i++) {
      const name = `Demo User ${i}`;
      const email = `user${i}@demo.com`;
      const password = await hashPassword("User@123");
      const roleId = i % 2 === 0 ? adminRoleId : userRoleId;
      await client.query(
        "INSERT INTO users (full_name, email, password, role_id, created_by_admin_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING",
        [name, email, password, roleId, superAdminUserId],
      );
    }

    // Seed Products (20 entries)
    const productIds: string[] = [];
    const productTemplates = [
      { name: "Pro Headphones", prefix: "AUD" },
      { name: "Smart Watch", prefix: "WCH" },
      { name: "Mechanical Keyboard", prefix: "KBD" },
      { name: "Wireless Mouse", prefix: "MSE" },
      { name: "Gaming Monitor", prefix: "MON" },
      { name: "USB-C Hub", prefix: "HUB" },
      { name: "Power Bank", prefix: "PWR" },
      { name: "Bluetooth Speaker", prefix: "SPK" },
      { name: "Laptop Stand", prefix: "STN" },
      { name: "Webcam 4K", prefix: "CAM" },
    ];

    for (let i = 1; i <= 20; i++) {
      const template = productTemplates[i % productTemplates.length];
      const name = `${template.name} v${Math.floor(i / 10) + 1}.${i % 10}`;
      const sku = `${template.prefix}-${1000 + i}`;
      const price = (Math.random() * 500 + 10).toFixed(2);
      const minStock = Math.floor(Math.random() * 20) + 5;

      const { rows } = await client.query<{ id: string }>(
        "INSERT INTO products (name, sku, price, min_stock_threshold, created_by_admin_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (created_by_admin_id, sku) DO UPDATE SET name = EXCLUDED.name RETURNING id",
        [name, sku, price, minStock, superAdminUserId],
      );
      productIds.push(rows[0].id);
    }

    // Seed Inventory (20 entries - one for each product)
    for (const productId of productIds) {
      const quantity = Math.floor(Math.random() * 100);
      await client.query(
        "INSERT INTO inventory (product_id, quantity, created_by_admin_id) VALUES ($1, $2, $3) ON CONFLICT (created_by_admin_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity",
        [productId, quantity, superAdminUserId],
      );
    }

    // Seed Sales (20 entries)
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const productId =
        productIds[Math.floor(Math.random() * productIds.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      const saleDate = new Date();
      saleDate.setDate(now.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

      await client.query(
        "INSERT INTO sales (product_id, quantity_sold, sale_date, created_by_admin_id) VALUES ($1, $2, $3, $4)",
        [
          productId,
          qty,
          saleDate.toISOString().split("T")[0],
          superAdminUserId,
        ],
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
