import express from "express";
import {
	getDashboardStats,
	getRecentOrders,
	getTableStatus,
} from "../controllers/dashboardController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard statistics
 *     description: Get today's revenue, orders count, and growth metrics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
	"/stats",
	protect,
	authorize("admin", "waiter"),
	getDashboardStats
);

/**
 * @swagger
 * /api/dashboard/recent-orders:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get recent orders
 *     description: Get list of recent orders for dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders to return
 *     responses:
 *       200:
 *         description: Recent orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
	"/recent-orders",
	protect,
	authorize("admin", "waiter"),
	getRecentOrders
);

/**
 * @swagger
 * /api/dashboard/table-status:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get table status overview
 *     description: Get current status of all tables
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Table status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
	"/table-status",
	protect,
	authorize("admin", "waiter"),
	getTableStatus
);

export default router;
