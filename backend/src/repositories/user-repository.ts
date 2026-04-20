import { pool } from "../db/pool.js";
import type { ListingQuery } from "../shared/http/listing.js";

export type DbUser = {
  id: string;
  full_name: string;
  email: string;
  password: string;
  role_id: string;
  role_name: "Super Admin" | "Admin" | "User";
  created_by_admin_id: string | null;
  profile_image: string | null;
  hobbies: unknown;
  password_reset_token_hash: string | null;
  password_reset_expires_at: string | null;
  created_at: string;
};

class UserRepository {
  async getByEmail(email: string): Promise<DbUser | null> {
    const { rows } = await pool.query<DbUser>(
      `SELECT u.*, r.name as role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE lower(u.email) = lower($1)
       LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async getById(id: string): Promise<DbUser | null> {
    const { rows } = await pool.query<DbUser>(
      `SELECT u.*, r.name as role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1
       LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async setResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    await pool.query(
      `UPDATE users
       SET password_reset_token_hash = $2,
           password_reset_expires_at = $3
       WHERE id = $1`,
      [userId, tokenHash, expiresAt],
    );
  }

  async clearResetToken(userId: string) {
    await pool.query(
      `UPDATE users
       SET password_reset_token_hash = NULL,
           password_reset_expires_at = NULL
       WHERE id = $1`,
      [userId],
    );
  }

  async updatePassword(userId: string, passwordHash: string) {
    await pool.query("UPDATE users SET password = $2 WHERE id = $1", [
      userId,
      passwordHash,
    ]);
  }

  async list(scopeAdminId: string, q: ListingQuery) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [scopeAdminId];
    const where: string[] = ["u.created_by_admin_id = $1"];

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`,
      );
    }

    // Prevent Admin from seeing Super Admin
    params.push("Super Admin");
    where.push(`r.name <> $${params.length}`);

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE ${where.join(" AND ")}
    `;

    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT u.id, u.full_name, u.email, u.role_id, r.name as role_name,
             u.created_by_admin_id, u.profile_image, u.hobbies, u.created_at,
             u.password, u.password_reset_token_hash, u.password_reset_expires_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE ${where.join(" AND ")}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<DbUser>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async create(input: {
    full_name: string;
    email: string;
    password: string;
    role_id: string;
    created_by_admin_id: string;
  }) {
    const { rows } = await pool.query<DbUser>(
      `WITH ins AS (
         INSERT INTO users (full_name, email, password, role_id, created_by_admin_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *
       )
       SELECT ins.*, r.name as role_name
       FROM ins
       JOIN roles r ON r.id = ins.role_id
      `,
      [
        input.full_name,
        input.email,
        input.password,
        input.role_id,
        input.created_by_admin_id,
      ],
    );
    return rows[0] ?? null;
  }

  async updateAdminUser(
    scopeAdminId: string,
    userId: string,
    input: { full_name: string; role_id: string; password?: string },
  ) {
    const params: any[] = [
      userId,
      scopeAdminId,
      input.full_name,
      input.role_id,
    ];
    const setPassword =
      typeof input.password === "string"
        ? `, password = $${params.push(input.password)}`
        : "";

    const { rows } = await pool.query<DbUser>(
      `WITH upd AS (
         UPDATE users
         SET full_name = $3,
             role_id = $4
             ${setPassword}
         WHERE id = $1
           AND created_by_admin_id = $2
         RETURNING *
       )
       SELECT upd.*, r.name as role_name
       FROM upd
       JOIN roles r ON r.id = upd.role_id
      `,
      params,
    );

    return rows[0] ?? null;
  }

  async updateProfile(
    userId: string,
    input: {
      full_name: string;
      hobbies: unknown;
      profile_image?: string | null;
    },
  ) {
    const { rows } = await pool.query<DbUser>(
      `WITH upd AS (
         UPDATE users
         SET full_name = $2,
             hobbies = $3,
             profile_image = COALESCE($4, profile_image)
         WHERE id = $1
         RETURNING *
       )
       SELECT upd.*, r.name as role_name
       FROM upd
       JOIN roles r ON r.id = upd.role_id`,
      [
        userId,
        input.full_name,
        JSON.stringify(input.hobbies ?? []),
        input.profile_image ?? null,
      ],
    );
    return rows[0] ?? null;
  }
}

export const userRepository = new UserRepository();
