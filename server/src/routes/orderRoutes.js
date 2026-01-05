import express from "express";
import { body } from "express-validator";
import {
	getOrders,
	getOrder,
	createOrder,
	acceptOrder,
	rejectOrder,
	updateOrderStatus,
	deleteOrder,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middlewares/auth.js";
import { validate } from "../middlewares/validator.js";

const router = express.Router();

// Validation rules
const createOrderValidation = [
	body("restaurantId").notEmpty().withMessage("Restaurant ID is required"),
	body("tableId").notEmpty().withMessage("Table ID is required"),
	body("items")
		.isArray({ min: 1 })
		.withMessage("At least one item is required"),
	body("items.*.menuItemId").notEmpty().withMessage("Menu item ID is required"),
	body("items.*.quantity")
		.isInt({ min: 1 })
		.withMessage("Quantity must be at least 1"),
];

const rejectOrderValidation = [
	body("rejectionReason")
		.notEmpty()
		.withMessage("Rejection reason is required"),
];

const updateStatusValidation = [
	body("status")
		.notEmpty()
		.withMessage("Status is required")
		.isIn([
			"pending",
			"accepted",
			"preparing",
			"ready",
			"served",
			"completed",
			"cancelled",
		])
		.withMessage("Invalid status"),
];

// Public routes

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     description: Create a new order or add items to existing unpaid order for the table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - tableId
 *               - items
 *             properties:
 *               restaurantId:
 *                 type: string
 *               tableId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               guestName:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     modifiers:
 *                       type: array
 *                     specialInstructions:
 *                       type: string
 *               orderNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       200:
 *         description: Items added to existing order
 */
router.post("/", createOrderValidation, validate, createOrder);

// Protected routes

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
 *     description: Get orders with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tableId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get(
	"/",
	protect,
	authorize("admin", "waiter", "kitchen_staff"),
	getOrders
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get single order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 */
router.get("/:id", protect, getOrder);

/**
 * @swagger
 * /api/orders/{id}/accept:
 *   patch:
 *     tags: [Orders]
 *     summary: Accept order (Waiter)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order accepted
 */
router.patch("/:id/accept", protect, authorize("admin", "waiter"), acceptOrder);

/**
 * @swagger
 * /api/orders/{id}/reject:
 *   patch:
 *     tags: [Orders]
 *     summary: Reject order (Waiter)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order rejected
 */
router.patch(
	"/:id/reject",
	protect,
	authorize("admin", "waiter"),
	rejectOrderValidation,
	validate,
	rejectOrder
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status with state machine validation
 *     description: |
 *       Updates order status following strict state machine rules.
 *       
 *       **State Machine Flow:**
 *       - pending → [preparing, cancelled]
 *       - preparing → [ready, cancelled]
 *       - ready → [served, cancelled]
 *       - served → [completed]
 *       - completed → [] (terminal state)
 *       - cancelled → [] (terminal state)
 *       
 *       **Role-Based Permissions:**
 *       - `preparing`, `ready`: kitchen_staff, admin, super_admin
 *       - `served`, `completed`, `cancelled`: waiter, admin, super_admin
 *       
 *       **Features:**
 *       - Validates state transitions
 *       - Checks role permissions
 *       - Auto-updates item statuses
 *       - Records timestamps
 *       - Emits real-time Socket.IO events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, preparing, ready, served, completed, cancelled]
 *                 description: New status (must follow state machine rules)
 *           examples:
 *             kitchenStartsCooking:
 *               summary: Kitchen starts preparing
 *               value:
 *                 status: preparing
 *             kitchenFinishes:
 *               summary: Kitchen marks as ready
 *               value:
 *                 status: ready
 *             waiterServes:
 *               summary: Waiter serves order
 *               value:
 *                 status: served
 *             waiterCompletes:
 *               summary: Waiter completes order
 *               value:
 *                 status: completed
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order status updated from pending to preparing"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 statusChange:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       example: "pending"
 *                     to:
 *                       type: string
 *                       example: "preparing"
 *                     changedBy:
 *                       type: string
 *                       example: "kitchen_staff"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid status. Valid statuses: pending, preparing, ready, served, completed, cancelled"
 *       403:
 *         description: Invalid state transition or unauthorized role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid state transition: pending -> served. Allowed transitions: preparing, cancelled"
 *                 currentStatus:
 *                   type: string
 *                   example: "pending"
 *                 requestedStatus:
 *                   type: string
 *                   example: "served"
 *                 userRole:
 *                   type: string
 *                   example: "kitchen_staff"
 *             examples:
 *               invalidTransition:
 *                 summary: Trying to skip states
 *                 value:
 *                   success: false
 *                   message: "Invalid state transition: pending -> served. Allowed transitions: preparing, cancelled"
 *                   currentStatus: "pending"
 *                   requestedStatus: "served"
 *                   userRole: "kitchen_staff"
 *               unauthorizedRole:
 *                 summary: Waiter trying kitchen action
 *                 value:
 *                   success: false
 *                   message: "Unauthorized: waiter cannot change status to preparing. Required roles: kitchen_staff, admin, super_admin"
 *                   currentStatus: "pending"
 *                   requestedStatus: "preparing"
 *                   userRole: "waiter"
 *       404:
 *         description: Order not found
 */
router.patch(
	"/:id/status",
	protect,
	authorize("admin", "waiter", "kitchen_staff"),
	updateStatusValidation,
	validate,
	updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted
 */
router.delete("/:id", protect, authorize("admin"), deleteOrder);

export default router;
