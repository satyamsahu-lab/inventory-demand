/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Create categories table (self-referencing for subcategories)
  pgm.createTable("categories", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    name: { type: "varchar(100)", notNull: true },
    parent_id: {
      type: "uuid",
      references: "categories",
      onDelete: "cascade",
      null: true,
    },
    created_by_admin_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // Add category_id and subcategory_id to products table
  pgm.addColumn("products", {
    category_id: {
      type: "uuid",
      references: "categories",
      onDelete: "set null",
      null: true, // Will make mandatory in logic, but nullable in DB for transition or if needed
    },
    subcategory_id: {
      type: "uuid",
      references: "categories",
      onDelete: "set null",
      null: true,
    },
  });

  // Add permissions for categories
  const modules = ["categories"];
  const actions = ["read", "create", "update", "delete"];

  modules.forEach((module) => {
    actions.forEach((action) => {
      pgm.sql(
        `INSERT INTO permissions (module_name, action) VALUES ('${module}', '${action}') ON CONFLICT DO NOTHING`,
      );
    });
  });

  // Auto-assign permissions to the admin role
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.name = 'admin'
    AND p.module_name = 'categories'
    ON CONFLICT DO NOTHING
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropColumn("products", ["category_id", "subcategory_id"]);
  pgm.dropTable("categories");
  pgm.sql("DELETE FROM permissions WHERE module_name = 'categories'");
};
