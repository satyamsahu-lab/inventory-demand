import { Router } from 'express';

import { authJwt } from '../middleware/auth-jwt.js';
import { dashboardController } from '../controllers/dashboard-controller.js';

export const dashboardRouter = Router();

// Visible to all roles; endpoints return safe empty datasets when permission missing.
dashboardRouter.get('/summary', authJwt, (req, res, next) => dashboardController.summary(req, res).catch(next));
dashboardRouter.get('/low-stock', authJwt, (req, res, next) => dashboardController.lowStock(req, res).catch(next));
dashboardRouter.get('/sales-trends', authJwt, (req, res, next) => dashboardController.salesTrends(req, res).catch(next));
dashboardRouter.get('/inventory-vs-demand', authJwt, (req, res, next) =>
  dashboardController.inventoryVsDemand(req, res).catch(next)
);
