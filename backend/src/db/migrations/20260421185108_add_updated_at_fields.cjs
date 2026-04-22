/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Add updated_at column to products, categories, and users
  pgm.addColumn("products", {
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addColumn("categories", {
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addColumn("users", {
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropColumn("users", "updated_at");
  pgm.dropColumn("categories", "updated_at");
  pgm.dropColumn("products", "updated_at");
};
