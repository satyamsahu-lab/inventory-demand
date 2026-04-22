import { api } from "../services/api";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  role_name: string | null;
  action: string;
  module: string;
  description: string;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const auditLogService = {
  async list(
    page: number = 1,
    limit: number = 20,
    params: any = {},
  ): Promise<AuditLogsResponse> {
    const response = await api.get("/audit-logs", {
      params: { page, limit, ...params },
    });
    return response.data.data;
  },

  async logFrontendActivity(data: {
    action: string;
    module: string;
    description: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await api.post("/audit-logs/client-activity", data);
    } catch (error) {
      console.error("Failed to log frontend activity", error);
    }
  },
};
