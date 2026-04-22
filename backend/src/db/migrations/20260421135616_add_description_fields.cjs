/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Add description field to products table
  pgm.addColumn("products", {
    description: { type: "text", null: true },
  });

  // Add description field to categories table
  pgm.addColumn("categories", {
    description: { type: "text", null: true },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropColumn("products", ["description"]);
  pgm.dropColumn("categories", ["description"]);
};
