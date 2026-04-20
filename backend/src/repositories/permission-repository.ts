import { pool } from '../db/pool.js';

export type PermissionRow = {
  id: string;
  module_name: string;
  action: 'view' | 'add' | 'edit' | 'delete';
};

class PermissionRepository {
  async roleHasPermission(roleId: string, moduleName: string, action: string) {
    const { rows } = await pool.query<{ ok: boolean }>(
      `SELECT EXISTS(
         SELECT 1
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1 AND p.module_name = $2 AND p.action = $3
       ) as ok`,
      [roleId, moduleName, action]
    );
    return rows[0]?.ok ?? false;
  }

  async getPermissionsForRole(roleId: string): Promise<PermissionRow[]> {
    const { rows } = await pool.query<PermissionRow>(
      `SELECT p.id, p.module_name, p.action
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.module_name, p.action`,
      [roleId]
    );
    return rows;
  }
}

export const permissionRepository = new PermissionRepository();
