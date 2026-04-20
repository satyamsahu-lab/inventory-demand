import { pool } from '../db/pool.js';

export type RolePermissionMatrixRow = {
  role_id: string;
  role_name: string;
  permission_id: string;
  module_name: string;
  action: 'view' | 'add' | 'edit' | 'delete';
};

class RolePermissionRepository {
  async listAllPermissions() {
    const { rows } = await pool.query<{ id: string; module_name: string; action: any }>(
      'SELECT id, module_name, action FROM permissions ORDER BY module_name, action'
    );
    return rows;
  }

  async getRolePermissions(roleId: string) {
    const { rows } = await pool.query<{ permission_id: string }>(
      'SELECT permission_id FROM role_permissions WHERE role_id = $1',
      [roleId]
    );
    return rows.map((r) => r.permission_id);
  }

  async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      for (const pid of permissionIds) {
        await client.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
          [roleId, pid]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export const rolePermissionRepository = new RolePermissionRepository();
