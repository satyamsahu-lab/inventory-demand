/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createExtension("uuid-ossp", { ifNotExists: true });

  pgm.createTable("roles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    name: { type: "varchar(50)", notNull: true, unique: true },
    created_by_admin_id: { type: "uuid", null: true },
  });

  pgm.createTable("permissions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    module_name: { type: "varchar(100)", notNull: true },
    action: { type: "varchar(20)", notNull: true },
  });

  pgm.addConstraint("permissions", "permissions_module_action_unique", {
    unique: ["module_name", "action"],
  });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    full_name: { type: "varchar(200)", notNull: true },
    email: { type: "varchar(320)", notNull: true, unique: true },
    password: { type: "text", notNull: true },
    role_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "restrict",
    },
    created_by_admin_id: {
      type: "uuid",
      references: "users",
      onDelete: "set null",
      null: true,
    },
    profile_image: { type: "text", null: true },
    hobbies: { type: "jsonb", notNull: true, default: "[]" },
    password_reset_token_hash: { type: "text", null: true },
    password_reset_expires_at: { type: "timestamptz", null: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("roles", "roles_created_by_admin_fk", {
    foreignKeys: {
      columns: "created_by_admin_id",
      references: "users(id)",
      onDelete: "set null",
    },
  });

  pgm.createTable("role_permissions", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    role_id: {
      type: "uuid",
      notNull: true,
      references: "roles",
      onDelete: "cascade",
    },
    permission_id: {
      type: "uuid",
      notNull: true,
      references: "permissions",
      onDelete: "cascade",
    },
  });

  pgm.addConstraint(
    "role_permissions",
    "role_permissions_role_permission_unique",
    {
      unique: ["role_id", "permission_id"],
    },
  );

  pgm.createTable("products", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    created_by_admin_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    name: { type: "varchar(200)", notNull: true },
    sku: { type: "varchar(100)", notNull: true },
    price: { type: "numeric(12,2)", notNull: true, default: 0 },
    min_stock_threshold: { type: "int", notNull: true, default: 0 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("products", "products_admin_sku_unique", {
    unique: ["created_by_admin_id", "sku"],
  });

  pgm.createTable("inventory", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    created_by_admin_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: "products",
      onDelete: "cascade",
    },
    quantity: { type: "int", notNull: true, default: 0 },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("inventory", "inventory_admin_product_unique", {
    unique: ["created_by_admin_id", "product_id"],
  });

  pgm.createTable("sales", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    created_by_admin_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: "products",
      onDelete: "cascade",
    },
    quantity_sold: { type: "int", notNull: true },
    sale_date: { type: "date", notNull: true },
  });

  pgm.createIndex("sales", ["created_by_admin_id", "sale_date"]);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("sales");
  pgm.dropTable("inventory");
  pgm.dropTable("products");
  pgm.dropTable("role_permissions");
  pgm.dropTable("users");
  pgm.dropTable("permissions");
  pgm.dropTable("roles");
};
