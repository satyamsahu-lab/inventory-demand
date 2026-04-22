/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Carts table
  pgm.createTable("carts", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "cascade",
      unique: true,
    },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // Cart Items table
  pgm.createTable("cart_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    cart_id: {
      type: "uuid",
      notNull: true,
      references: "carts",
      onDelete: "cascade",
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: "products",
      onDelete: "cascade",
    },
    quantity: { type: "int", notNull: true, default: 1 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("cart_items", "cart_items_cart_product_unique", {
    unique: ["cart_id", "product_id"],
  });

  // Orders table
  pgm.createTable("orders", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "restrict",
    },
    total_amount: { type: "numeric(12,2)", notNull: true },
    status: { type: "varchar(20)", notNull: true, default: "pending" },
    shipping_address: { type: "jsonb", notNull: true },
    payment_method: { type: "varchar(50)", notNull: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  // Order Items table
  pgm.createTable("order_items", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "orders",
      onDelete: "cascade",
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: "products",
      onDelete: "restrict",
    },
    quantity: { type: "int", notNull: true },
    price_at_order: { type: "numeric(12,2)", notNull: true },
  });

  // Indexes
  pgm.createIndex("carts", ["user_id"]);
  pgm.createIndex("cart_items", ["cart_id"]);
  pgm.createIndex("orders", ["user_id"]);
  pgm.createIndex("order_items", ["order_id"]);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("order_items");
  pgm.dropTable("orders");
  pgm.dropTable("cart_items");
  pgm.dropTable("carts");
};
