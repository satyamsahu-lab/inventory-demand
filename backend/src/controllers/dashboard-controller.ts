import type { Request, Response } from "express";
import { ok } from "../shared/http/api-response.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { permissionRepository } from "../repositories/permission-repository.js";
import { dashboardRepository } from "../repositories/dashboard-repository.js";

export class DashboardController {
  async summary(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const canProducts = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Products",
      "view",
    );
    const canSales = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Sales",
      "view",
    );
    const canInventory = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Inventory",
      "view",
    );
    const canUsers = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Users",
      "view",
    );

    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const data = await dashboardRepository.summary(
      scopeAdminId,
      {
        canProducts,
        canSales,
        canInventory,
        canUsers,
      },
      { startDate, endDate },
    );

    return res.json(ok(data));
  }

  async topSellingProducts(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const canSales = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Sales",
      "view",
    );

    if (!canSales) {
      return res.json(ok({ records: [] }));
    }

    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };
    const records = await dashboardRepository.topSellingProducts(scopeAdminId, {
      startDate,
      endDate,
    });
    return res.json(ok({ records }));
  }

  async lowStock(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const canInventory = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Inventory",
      "view",
    );

    if (!canInventory) {
      return res.json(ok({ records: [] }));
    }

    const records = await dashboardRepository.lowStock(scopeAdminId);
    return res.json(ok({ records }));
  }

  async salesTrends(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const canSales = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Sales",
      "view",
    );

    if (!canSales) {
      return res.json(ok({ records: [] }));
    }

    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };
    const records = await dashboardRepository.salesTrends(scopeAdminId, {
      startDate,
      endDate,
    });
    return res.json(ok({ records }));
  }

  async inventoryVsDemand(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const canInventory = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Inventory",
      "view",
    );
    const canSales = await permissionRepository.roleHasPermission(
      req.user!.role.id,
      "Sales",
      "view",
    );

    if (!canInventory || !canSales) {
      return res.json(ok({ records: [] }));
    }

    const days = Number(req.query.days ?? 30);
    const window = Number(req.query.window ?? 7);

    const records = await dashboardRepository.inventoryVsDemand(scopeAdminId, {
      days: Number.isFinite(days) ? days : 30,
      window: Number.isFinite(window) ? window : 7,
    });

    return res.json(ok({ records }));
  }
}

export const dashboardController = new DashboardController();
