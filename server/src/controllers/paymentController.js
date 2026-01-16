import stripe from "../config/stripe.js";
import Order from "../models/Order.js";
import { emitOrderStatusUpdate } from "../socket/index.js";

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Public (Customer can pay)
export const createPaymentIntent = async (req, res) => {
	try {
		const { orderId, paymentMethod = "card" } = req.body;

		// Find order
		const order = await Order.findById(orderId).populate(
			"tableId",
			"tableNumber"
		);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Check if order is already paid
		if (order.paymentStatus === "paid") {
			return res.status(400).json({
				success: false,
				message: "Order is already paid",
			});
		}

		// Check if order is completed or cancelled
		if (order.status === "cancelled") {
			return res.status(400).json({
				success: false,
				message: "Cannot pay for cancelled order",
			});
		}

		// Create payment intent with Stripe
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(order.total * 100), // Stripe uses cents (e.g., $10.00 = 1000)
			currency: "usd", // Change to your currency
			metadata: {
				orderId: order._id.toString(),
				orderNumber: order.orderNumber,
				tableNumber: order.tableId?.tableNumber || "N/A",
			},
			description: `Payment for Order ${order.orderNumber}`,
			automatic_payment_methods: {
				enabled: true,
				allow_redirects: "never", // Only allow card payments, no redirects
			},
		});

		console.log(
			`💳 Created payment intent ${paymentIntent.id} for order ${order.orderNumber}`
		);

		// Update order with payment intent ID
		order.paymentIntentId = paymentIntent.id;
		order.paymentMethod = paymentMethod;
		await order.save();

		res.json({
			success: true,
			message: "Payment intent created successfully",
			data: {
				clientSecret: paymentIntent.client_secret,
				paymentIntentId: paymentIntent.id,
				amount: order.total,
				currency: "usd",
			},
		});
	} catch (error) {
		console.error("Create payment intent error:", error);
		res.status(500).json({
			success: false,
			message: "Error creating payment intent",
			error: error.message,
		});
	}
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Public
export const confirmPayment = async (req, res) => {
	try {
		const { paymentIntentId, cardNumber } = req.body;

		// Retrieve payment intent from Stripe
		let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

		if (!paymentIntent) {
			return res.status(404).json({
				success: false,
				message: "Payment intent not found",
			});
		}

		// Find order
		const order = await Order.findOne({ paymentIntentId });

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// If payment intent requires payment method (test mode), confirm it with test card
		if (
			paymentIntent.status === "requires_payment_method" ||
			paymentIntent.status === "requires_confirmation"
		) {
			console.log(
				`🔄 Payment intent requires confirmation, confirming with test payment method...`
			);

			// For test mode: Use Stripe test payment method
			// In production, frontend would handle this with Stripe.js
			try {
				// Determine which test payment method to use based on card number (if provided)
				let paymentMethodId = "pm_card_visa"; // Default success

				if (cardNumber) {
					const cleanCard = cardNumber.replace(/\s/g, "");
					// Map test cards to behaviors
					if (cleanCard === "4000000000000002") {
						paymentMethodId = "pm_card_chargeDeclined";
					} else if (cleanCard === "4000000000009995") {
						paymentMethodId = "pm_card_insufficient_funds";
					}
				}

				// Confirm the payment intent with the payment method
				paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
					payment_method: paymentMethodId,
					return_url: process.env.CLIENT_URL || "http://localhost:5173",
				});

				console.log(
					`✅ Payment intent confirmed with status: ${paymentIntent.status}`
				);
			} catch (confirmError) {
				console.error("❌ Payment confirmation failed:", confirmError.message);

				// Handle specific decline codes
				order.paymentStatus = "failed";
				await order.save();

				return res.status(400).json({
					success: false,
					message: confirmError.message || "Payment declined",
					data: {
						paymentStatus: "failed",
						error: confirmError.code || "card_declined",
					},
				});
			}
		}

		// Update order payment status based on Stripe status
		if (paymentIntent.status === "succeeded") {
			order.paymentStatus = "paid";
			order.paidAt = new Date();
			order.status = "completed";
			order.completedAt = new Date();
			await order.save();

			// Emit real-time event
			const io = req.app.get("io");
			if (io) {
				emitOrderStatusUpdate(io, order.restaurantId.toString(), order);
			}

			console.log(`✅ Payment succeeded for order ${order.orderNumber}`);

			return res.json({
				success: true,
				message: "Payment confirmed successfully",
				data: {
					order,
					paymentStatus: paymentIntent.status,
				},
			});
		} else if (paymentIntent.status === "processing") {
			return res.json({
				success: true,
				message: "Payment is processing",
				data: {
					paymentStatus: paymentIntent.status,
				},
			});
		} else {
			order.paymentStatus = "failed";
			await order.save();

			console.log(
				`❌ Payment failed for order ${order.orderNumber}, status: ${paymentIntent.status}`
			);

			return res.status(400).json({
				success: false,
				message: "Payment failed",
				data: {
					paymentStatus: paymentIntent.status,
				},
			});
		}
	} catch (error) {
		console.error("Confirm payment error:", error);
		res.status(500).json({
			success: false,
			message: "Error confirming payment",
			error: error.message,
		});
	}
};

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Public
export const getPaymentStatus = async (req, res) => {
	try {
		const order = await Order.findById(req.params.orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		let paymentIntentStatus = null;
		if (order.paymentIntentId) {
			const paymentIntent = await stripe.paymentIntents.retrieve(
				order.paymentIntentId
			);
			paymentIntentStatus = paymentIntent.status;
		}

		res.json({
			success: true,
			data: {
				orderId: order._id,
				orderNumber: order.orderNumber,
				paymentStatus: order.paymentStatus,
				paymentMethod: order.paymentMethod,
				total: order.total,
				paidAt: order.paidAt,
				paymentIntentId: order.paymentIntentId,
				stripeStatus: paymentIntentStatus,
			},
		});
	} catch (error) {
		console.error("Get payment status error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching payment status",
			error: error.message,
		});
	}
};

// @desc    Handle Stripe webhook events
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
export const handleWebhook = async (req, res) => {
	const sig = req.headers["stripe-signature"];
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

	let event;

	try {
		// Verify webhook signature
		// req.body is raw buffer when using express.raw() middleware
		event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

		console.log("✅ Webhook signature verified successfully");
		console.log(`📬 Received event type: ${event.type}`);
	} catch (err) {
		console.error("❌ Webhook signature verification failed:", err.message);
		console.error("   Make sure STRIPE_WEBHOOK_SECRET is set correctly");
		return res.status(400).send(`Webhook Error: ${err.message}`);
	}

	// Handle the event
	try {
		switch (event.type) {
			case "payment_intent.succeeded":
				const paymentIntent = event.data.object;
				console.log("✅ Payment succeeded:", paymentIntent.id);

				// Update order
				const order = await Order.findOne({
					paymentIntentId: paymentIntent.id,
				});
				if (order) {
					order.paymentStatus = "paid";
					order.paidAt = new Date();
					order.status = "completed";
					order.completedAt = new Date();
					await order.save();

					console.log(`Order ${order.orderNumber} marked as paid`);
				}
				break;

			case "payment_intent.payment_failed":
				const failedPayment = event.data.object;
				console.log("❌ Payment failed:", failedPayment.id);

				// Update order
				const failedOrder = await Order.findOne({
					paymentIntentId: failedPayment.id,
				});
				if (failedOrder) {
					failedOrder.paymentStatus = "failed";
					await failedOrder.save();
				}
				break;

			case "payment_intent.canceled":
				const canceledPayment = event.data.object;
				console.log("🚫 Payment canceled:", canceledPayment.id);
				break;

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		res.json({ received: true });
	} catch (error) {
		console.error("Webhook handler error:", error);
		res.status(500).json({
			success: false,
			message: "Webhook handler error",
			error: error.message,
		});
	}
};

// @desc    Refund payment
// @route   POST /api/payments/refund
// @access  Private (Admin only)
export const refundPayment = async (req, res) => {
	try {
		const { orderId, amount, reason } = req.body;

		// Find order
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		if (!order.paymentIntentId) {
			return res.status(400).json({
				success: false,
				message: "No payment intent found for this order",
			});
		}

		if (order.paymentStatus !== "paid") {
			return res.status(400).json({
				success: false,
				message: "Order is not paid yet",
			});
		}

		// Create refund
		const refund = await stripe.refunds.create({
			payment_intent: order.paymentIntentId,
			amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
			reason: reason || "requested_by_customer",
		});

		// Update order
		order.paymentStatus = "refunded";
		await order.save();

		res.json({
			success: true,
			message: "Refund processed successfully",
			data: {
				refundId: refund.id,
				amount: refund.amount / 100,
				status: refund.status,
			},
		});
	} catch (error) {
		console.error("Refund payment error:", error);
		res.status(500).json({
			success: false,
			message: "Error processing refund",
			error: error.message,
		});
	}
};

// @desc    Cash payment (Manual payment)
// @route   POST /api/payments/cash
// @access  Private (Waiter, Admin)
export const cashPayment = async (req, res) => {
	try {
		const { orderId } = req.body;

		// Find order
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		if (order.paymentStatus === "paid") {
			return res.status(400).json({
				success: false,
				message: "Order is already paid",
			});
		}

		// Update order
		order.paymentStatus = "paid";
		order.paymentMethod = "cash";
		order.paidAt = new Date();
		order.status = "completed";
		order.completedAt = new Date();
		await order.save();

		// Emit real-time event
		const io = req.app.get("io");
		if (io) {
			emitOrderStatusUpdate(io, order.restaurantId.toString(), order);
		}

		res.json({
			success: true,
			message: "Cash payment recorded successfully",
			data: order,
		});
	} catch (error) {
		console.error("Cash payment error:", error);
		res.status(500).json({
			success: false,
			message: "Error recording cash payment",
			error: error.message,
		});
	}
};
