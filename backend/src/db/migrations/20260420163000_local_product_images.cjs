/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable(
    'product_images',
    {
      id: {
        type: 'uuid',
        primaryKey: true,
        default: pgm.func('uuid_generate_v4()')
      },
      product_id: {
        type: 'uuid',
        notNull: true,
        references: 'products',
        onDelete: 'cascade'
      },
      file_name: { type: 'text', notNull: true },
      created_at: {
        type: 'timestamptz',
        notNull: true,
        default: pgm.func('now()')
      }
    },
    { ifNotExists: true }
  );

  pgm.createIndex('product_images', ['product_id', 'created_at']);

  // remove ImageKit-era columns if they exist
  pgm.sql('ALTER TABLE products DROP COLUMN IF EXISTS image_url');
  pgm.sql('ALTER TABLE products DROP COLUMN IF EXISTS image_file_id');
  pgm.sql('ALTER TABLE products DROP COLUMN IF EXISTS image_name');

  pgm.sql('ALTER TABLE users DROP COLUMN IF EXISTS profile_image_file_id');
  pgm.sql('ALTER TABLE users DROP COLUMN IF EXISTS profile_image_name');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable('product_images', { ifExists: true, cascade: true });
};
