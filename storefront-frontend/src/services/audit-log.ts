import { publicApi } from "./public-api";

export const auditLogService = {
  async logFrontendActivity(data: {
    action: string;
    module: string;
    description: string;
    metadata?: any;
  }): Promise<void> {
    try {
      // For storefront, we use the publicApi which might already have a token if user is logged in
      await publicApi.post("/audit-logs/client-activity", data);
    } catch (error) {
      console.error("Failed to log storefront activity", error);
    }
  },
};
