/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'image_url'
      ) THEN
        ALTER TABLE products ADD COLUMN image_url text;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'image_file_id'
      ) THEN
        ALTER TABLE products ADD COLUMN image_file_id text;
      END IF;
    END$$;
  `);

  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'profile_image_file_id'
      ) THEN
        ALTER TABLE users ADD COLUMN profile_image_file_id text;
      END IF;
    END$$;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql("ALTER TABLE users DROP COLUMN IF EXISTS profile_image_file_id");
  pgm.sql("ALTER TABLE products DROP COLUMN IF EXISTS image_url");
  pgm.sql("ALTER TABLE products DROP COLUMN IF EXISTS image_file_id");
};
