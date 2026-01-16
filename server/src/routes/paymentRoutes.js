import express from "express";
import { body } from "express-validator";
import {
	createPaymentIntent,
	confirmPayment,
	getPaymentStatus,
	handleWebhook,
	refundPayment,
	cashPayment,
} from "../controllers/paymentController.js";
import { protect, authorize } from "../middlewares/auth.js";
import { validate } from "../middlewares/validator.js";

const router = express.Router();

// Validation rules
const createPaymentIntentValidation = [
	body("orderId").notEmpty().withMessage("Order ID is required"),
	body("paymentMethod")
		.optional()
		.isIn(["card", "cash", "stripe", "zalopay", "momo", "vnpay"])
		.withMessage("Invalid payment method"),
];

const confirmPaymentValidation = [
	body("paymentIntentId")
		.notEmpty()
		.withMessage("Payment intent ID is required"),
];

const refundValidation = [
	body("orderId").notEmpty().withMessage("Order ID is required"),
	body("reason").optional().isString(),
];

const cashPaymentValidation = [
	body("orderId").notEmpty().withMessage("Order ID is required"),
];

// Public routes

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     tags: [Payments]
 *     summary: Create payment intent
 *     description: Create a Stripe payment intent for an order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, cash, stripe, zalopay, momo, vnpay]
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 */
router.post(
	"/create-intent",
	createPaymentIntentValidation,
	validate,
	createPaymentIntent
);

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     tags: [Payments]
 *     summary: Confirm payment
 *     description: Confirm a payment after client-side processing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 */
router.post("/confirm", confirmPaymentValidation, validate, confirmPayment);

/**
 * @swagger
 * /api/payments/status/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment status
 *     description: Get payment status for an order
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved
 */
router.get("/status/:orderId", getPaymentStatus);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     tags: [Payments]
 *     summary: Stripe webhook handler
 *     description: Handle Stripe webhook events (internal use only)
 *     responses:
 *       200:
 *         description: Webhook processed
 */
// Note: Raw body parser is applied globally in app.js for this route
router.post("/webhook", handleWebhook);

// Protected routes

/**
 * @swagger
 * /api/payments/cash:
 *   post:
 *     tags: [Payments]
 *     summary: Record cash payment
 *     description: Record a cash payment (Waiter/Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cash payment recorded
 */
router.post(
	"/cash",
	protect,
	authorize("admin", "waiter"),
	cashPaymentValidation,
	validate,
	cashPayment
);

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund payment
 *     description: Process a refund for a paid order (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 description: Amount to refund (leave empty for full refund)
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */
router.post(
	"/refund",
	protect,
	authorize("admin"),
	refundValidation,
	validate,
	refundPayment
);

export default router;
