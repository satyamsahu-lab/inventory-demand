/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.addColumns("products", {
    image_url: { type: "text", null: true },
    image_file_id: { type: "text", null: true },
  });

  pgm.addColumns("users", {
    profile_image_file_id: { type: "text", null: true },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropColumns("users", ["profile_image_file_id"]);
  pgm.dropColumns("products", ["image_url", "image_file_id"]);
};
