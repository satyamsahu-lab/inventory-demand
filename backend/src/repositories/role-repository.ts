import { pool } from '../db/pool.js';

export type RoleRow = {
  id: string;
  name: 'Super Admin' | 'Admin' | 'User' | string;
  created_by_admin_id: string | null;
};

class RoleRepository {
  async listVisibleRoles(requestUserRole: string, scopeAdminId: string) {
    if (requestUserRole === 'Super Admin') {
      const { rows } = await pool.query<RoleRow>('SELECT id, name, created_by_admin_id FROM roles ORDER BY name');
      return rows;
    }

    // Admin: cannot see Super Admin role; only roles created by them or global User/Admin roles
    const { rows } = await pool.query<RoleRow>(
      `SELECT id, name, created_by_admin_id
       FROM roles
       WHERE name <> 'Super Admin'
         AND (created_by_admin_id = $1 OR created_by_admin_id IS NULL)
       ORDER BY name`,
      [scopeAdminId]
    );
    return rows;
  }

  async getById(id: string) {
    const { rows } = await pool.query<RoleRow>('SELECT id, name, created_by_admin_id FROM roles WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async create(scopeAdminId: string, name: string) {
    const { rows } = await pool.query<RoleRow>(
      `INSERT INTO roles (name, created_by_admin_id)
       VALUES ($1, $2)
       RETURNING id, name, created_by_admin_id`,
      [name, scopeAdminId]
    );
    return rows[0];
  }
}

export const roleRepository = new RoleRepository();
