/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  // Add permissions for Orders
  const actions = ["view", "add", "edit", "delete"];
  actions.forEach((action) => {
    pgm.sql(`
      INSERT INTO permissions (module_name, action)
      VALUES ('Orders', '${action}')
      ON CONFLICT ON CONSTRAINT permissions_module_action_unique DO NOTHING;
    `);
  });

  // Grant view permission to Super Admin
  pgm.sql(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r, permissions p
    WHERE r.name = 'Super Admin' AND p.module_name = 'Orders' AND p.action = 'view'
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.sql(`DELETE FROM permissions WHERE module_name = 'Orders';`);
};
