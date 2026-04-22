/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'image_name'
      ) THEN
        ALTER TABLE products ADD COLUMN image_name text;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'profile_image_name'
      ) THEN
        ALTER TABLE users ADD COLUMN profile_image_name text;
      END IF;
    END$$;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql('ALTER TABLE users DROP COLUMN IF EXISTS profile_image_name');
  pgm.sql('ALTER TABLE products DROP COLUMN IF EXISTS image_name');
};
