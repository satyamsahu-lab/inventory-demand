import { pool } from "../db/pool.js";

export interface AuditLogParams {
  userId?: string;
  action: string;
  module: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  static async log(params: AuditLogParams) {
    const {
      userId,
      action,
      module,
      description,
      metadata,
      ipAddress,
      userAgent,
    } = params;

    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          action,
          module,
          description,
          metadata ? JSON.stringify(metadata) : null,
          ipAddress,
          userAgent,
        ],
      );
    } catch (error) {
      console.error("Failed to save audit log:", error);
      // We don't want to fail the main request if logging fails
    }
  }

  static async getLogs(
    page: number = 1,
    limit: number = 20,
    filters: {
      search?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    const offset = (page - 1) * limit;
    const { search, action, startDate, endDate } = filters;

    let whereClause = "WHERE 1=1";
    const values: any[] = [limit, offset];
    let paramIndex = 3;

    if (search) {
      whereClause += ` AND (al.description ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR al.module ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (action && action !== "ALL") {
      whereClause += ` AND al.action = $${paramIndex}`;
      values.push(action.toUpperCase());
      paramIndex++;
    }

    if (startDate) {
      whereClause += ` AND al.created_at >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND al.created_at <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    const query = `
      SELECT al.*, u.full_name as user_name, r.name as role_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    // In the count query, we need to re-map the parameter indices because $1 and $2 (limit/offset) are gone.
    const countWhereClause = whereClause.replace(/\$(\d+)/g, (_, n) => {
      const index = parseInt(n);
      return `$${index - 2}`;
    });

    const countQuery = `
      SELECT COUNT(*) 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${countWhereClause}
    `;

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(2)),
    ]);

    return {
      logs: logsResult.rows,
      total: Number.parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }
}
