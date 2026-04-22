/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Add status column to products, categories, and users
  pgm.addColumn("products", {
    status: { type: "varchar(20)", notNull: true, default: "active" },
  });

  pgm.addColumn("categories", {
    status: { type: "varchar(20)", notNull: true, default: "active" },
  });

  pgm.addColumn("users", {
    status: { type: "varchar(20)", notNull: true, default: "active" },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropColumn("users", "status");
  pgm.dropColumn("categories", "status");
  pgm.dropColumn("products", "status");
};
