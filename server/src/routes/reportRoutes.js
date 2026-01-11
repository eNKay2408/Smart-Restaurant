import express from "express";
import {
	getReportStats,
	getRevenueChart,
	getTopSellingItems,
	getInsights,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/reports/stats:
 *   get:
 *     tags: [Reports]
 *     summary: Get report statistics
 *     description: Get revenue, orders, and growth statistics for a date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Report statistics retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", protect, authorize("admin"), getReportStats);

/**
 * @swagger
 * /api/reports/revenue-chart:
 *   get:
 *     tags: [Reports]
 *     summary: Get revenue chart data
 *     description: Get daily revenue data for chart visualization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue chart data retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */
router.get("/revenue-chart", protect, authorize("admin"), getRevenueChart);

/**
 * @swagger
 * /api/reports/top-selling:
 *   get:
 *     tags: [Reports]
 *     summary: Get top selling items
 *     description: Get list of top selling menu items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: Top selling items retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */
router.get("/top-selling", protect, authorize("admin"), getTopSellingItems);

/**
 * @swagger
 * /api/reports/insights:
 *   get:
 *     tags: [Reports]
 *     summary: Get performance insights
 *     description: Get performance metrics like peak hours, ratings, etc.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Performance insights retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */
router.get("/insights", protect, authorize("admin"), getInsights);

export default router;
