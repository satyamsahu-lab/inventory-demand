/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("audit_logs", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    user_id: {
      type: "uuid",
      null: true,
      references: "users",
      onDelete: "set null",
    },
    action: { type: "varchar(100)", notNull: true }, // e.g., 'CREATE', 'UPDATE', 'view', 'LOGIN', 'LOGOUT', 'CHECKOUT'
    module: { type: "varchar(100)", notNull: true }, // e.g., 'USERS', 'PRODUCTS', 'INVENTORY', 'SALES', 'PROFILE', 'CART', 'ORDER'
    description: { type: "text", notNull: true }, // e.g., 'Admin viewed product (Laptop)'
    metadata: { type: "jsonb", null: true }, // For any extra data
    ip_address: { type: "varchar(45)", null: true },
    user_agent: { type: "text", null: true },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("audit_logs", "user_id");
  pgm.createIndex("audit_logs", "created_at");

  // Add permission for audit logs
  pgm.sql(`
    INSERT INTO permissions (module_name, action)
    VALUES ('Audit Logs', 'view')
    ON CONFLICT ON CONSTRAINT permissions_module_action_unique DO NOTHING;
  `);

  // Grant view permission to Super Admin (assuming ID/Role exists or we'll do it by name)
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'Super Admin' AND p.module_name = 'Audit Logs' AND p.action = 'view'
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("audit_logs");
  pgm.sql(`DELETE FROM permissions WHERE module_name = 'Audit Logs';`);
};
