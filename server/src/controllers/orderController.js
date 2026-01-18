import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
import Cart from "../models/Cart.js";
import {
	emitNewOrder,
	emitOrderAccepted,
	emitOrderRejected,
	emitOrderStatusUpdate,
} from "../socket/index.js";

// @desc    Get all orders with filters
// @route   GET /api/orders
// @access  Private (Admin, Waiter, Kitchen Staff)
export const getOrders = async (req, res) => {
	try {
		const {
			restaurantId,
			tableId,
			customerId,
			status,
			paymentStatus,
			sortBy = "createdAt",
			order = "desc",
			page = 1,
			limit = 1000, // Increased to show all orders by default
		} = req.query;

		// Build filter
		const filter = {};
		if (restaurantId) filter.restaurantId = restaurantId;
		if (tableId) filter.tableId = tableId;
		if (customerId) filter.customerId = customerId;
		if (status) filter.status = status;
		if (paymentStatus) filter.paymentStatus = paymentStatus;

		// Build sort
		const sortOptions = {};
		sortOptions[sortBy] = order === "asc" ? 1 : -1;

		// Pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const orders = await Order.find(filter)
			.populate("tableId", "tableNumber area")
			.populate("customerId", "fullName email")
			.populate("waiterId", "fullName")
			.populate("items.menuItemId", "name price images")
			.sort(sortOptions)
			.skip(skip)
			.limit(parseInt(limit));

		const total = await Order.countDocuments(filter);

		res.json({
			success: true,
			count: orders.length,
			total,
			page: parseInt(page),
			pages: Math.ceil(total / parseInt(limit)),
			data: orders,
		});
	} catch (error) {
		console.error("Get orders error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching orders",
			error: error.message,
		});
	}
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id)
			.populate("tableId", "tableNumber area")
			.populate("customerId", "fullName email avatar")
			.populate("waiterId", "fullName")
			.populate("items.menuItemId", "name price images");

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		res.json({
			success: true,
			data: order,
		});
	} catch (error) {
		console.error("Get order error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching order",
			error: error.message,
		});
	}
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (Guest can order)
export const createOrder = async (req, res) => {
	try {
		const { restaurantId, tableId, customerId, guestName, items, orderNotes } =
			req.body;

		// Validate table exists
		const table = await Table.findById(tableId);
		if (!table) {
			return res.status(404).json({
				success: false,
				message: "Table not found",
			});
		}

		// Check if there's an existing unpaid order for this table
		// Only merge with orders that are still being prepared (pending/accepted)
		const existingOrder = await Order.findOne({
			tableId,
			paymentStatus: "pending",
			status: { $in: ["pending", "accepted", "preparing", "ready", "served"] }, // Added "served" for bill merging
		});

		// If there's an existing order, add items to it (merge orders)
		if (existingOrder) {
			// Process new items
			const processedItems = [];
			let itemsSubtotal = 0;

			for (const item of items) {
				const menuItem = await MenuItem.findById(item.menuItemId);
				if (!menuItem) {
					return res.status(404).json({
						success: false,
						message: `Menu item not found: ${item.menuItemId}`,
					});
				}

				// Calculate modifier price adjustments
				let modifierTotal = 0;
				if (item.modifiers && item.modifiers.length > 0) {
					item.modifiers.forEach((modifier) => {
						modifier.options.forEach((option) => {
							modifierTotal += option.priceAdjustment || 0;
						});
					});
				}

				const itemSubtotal = (menuItem.price + modifierTotal) * item.quantity;
				itemsSubtotal += itemSubtotal;

				processedItems.push({
					menuItemId: menuItem._id,
					name: menuItem.name,
					price: menuItem.price,
					quantity: item.quantity,
					modifiers: item.modifiers || [],
					specialInstructions: item.specialInstructions || "",
					status: "pending",
					subtotal: itemSubtotal,
				});
			}

			// Add new items to existing order - preserve existing item statuses
			const existingItems = existingOrder.items.map(item => item.toObject()); // Convert to plain objects to preserve
			existingOrder.items = [...existingItems, ...processedItems];
			existingOrder.subtotal += itemsSubtotal;
			existingOrder.total =
				existingOrder.subtotal + existingOrder.tax - existingOrder.discount;

			// ALWAYS reset order status to pending when new items are added (restart cycle)
			const oldStatus = existingOrder.status;
			existingOrder.status = "pending";
			console.log(`🔄 Order ${existingOrder.orderNumber} status: ${oldStatus} → pending (new items added, restarting cycle)`);

			// Debug: Log item statuses before save
			console.log('📋 Items before save:', existingOrder.items.map(i => ({ name: i.name, status: i.status })));

			await existingOrder.save();

			const populatedOrder = await Order.findById(existingOrder._id)
				.populate("tableId", "tableNumber area")
				.populate("customerId", "fullName email")
				.populate("items.menuItemId", "name price images");

			// Clear cart after adding items to order
			await Cart.findOneAndDelete({ tableId });

			// Emit real-time event to waiters - use status update for merged orders
			const io = req.app.get("io");
			if (io) {
				emitOrderStatusUpdate(io, restaurantId, populatedOrder);
				console.log(`📡 Emitted order status update for merged order ${populatedOrder.orderNumber}`);
			}

			return res.status(200).json({
				success: true,
				message: "Items added to existing order",
				data: populatedOrder,
			});
		}

		// No existing order - create new order
		const processedItems = [];
		let subtotal = 0;

		for (const item of items) {
			const menuItem = await MenuItem.findById(item.menuItemId);
			if (!menuItem) {
				return res.status(404).json({
					success: false,
					message: `Menu item not found: ${item.menuItemId}`,
				});
			}

			// Calculate modifier price adjustments
			let modifierTotal = 0;
			if (item.modifiers && item.modifiers.length > 0) {
				item.modifiers.forEach((modifier) => {
					modifier.options.forEach((option) => {
						modifierTotal += option.priceAdjustment || 0;
					});
				});
			}

			const itemSubtotal = (menuItem.price + modifierTotal) * item.quantity;
			subtotal += itemSubtotal;

			processedItems.push({
				menuItemId: menuItem._id,
				name: menuItem.name,
				price: menuItem.price,
				quantity: item.quantity,
				modifiers: item.modifiers || [],
				specialInstructions: item.specialInstructions || "",
				status: "pending",
				subtotal: itemSubtotal,
			});
		}

		// Create order
		const order = await Order.create({
			restaurantId,
			tableId,
			customerId: customerId || null,
			guestName: guestName || "Guest",
			items: processedItems,
			orderNotes: orderNotes || "",
			subtotal,
			tax: 0, // Calculate tax if needed
			discount: 0,
			total: subtotal,
			status: "pending",
			paymentStatus: "pending",
		});

		const populatedOrder = await Order.findById(order._id)
			.populate("tableId", "tableNumber area")
			.populate("customerId", "fullName email")
			.populate("items.menuItemId", "name price images");

		// Update table status to occupied
		await Table.findByIdAndUpdate(tableId, { status: "occupied", currentOrder: order._id });
		console.log(`🪑 Table status updated to occupied for order ${order.orderNumber}`);

		// Clear cart after creating order
		await Cart.findOneAndDelete({ tableId });

		// Emit real-time event to waiters - use status update for merged orders
		const io = req.app.get("io");
		if (io) {
			emitOrderStatusUpdate(io, restaurantId, populatedOrder);
			console.log(`📡 Emitted order status update for merged order ${populatedOrder.orderNumber}`);
		}

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			data: populatedOrder,
		});
	} catch (error) {
		console.error("Create order error:", error);
		res.status(500).json({
			success: false,
			message: "Error creating order",
			error: error.message,
		});
	}
};

// @desc    Accept order (Waiter)
// @route   PATCH /api/orders/:id/accept
// @access  Private (Waiter, Admin)
export const acceptOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		if (order.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Only pending orders can be accepted",
			});
		}

		order.status = "accepted";
		order.waiterId = req.user.id;
		order.acceptedAt = new Date();
		await order.save();

		const populatedOrder = await Order.findById(order._id)
			.populate("tableId", "tableNumber area")
			.populate("customerId", "fullName email")
			.populate("waiterId", "fullName")
			.populate("items.menuItemId", "name price images");

		// Emit real-time events
		const io = req.app.get("io");
		if (io) {
			emitOrderAccepted(io, order.restaurantId.toString(), populatedOrder);
		}

		res.json({
			success: true,
			message: "Order accepted successfully",
			data: populatedOrder,
		});
	} catch (error) {
		console.error("Accept order error:", error);
		res.status(500).json({
			success: false,
			message: "Error accepting order",
			error: error.message,
		});
	}
};

// @desc    Reject order (Waiter)
// @route   PATCH /api/orders/:id/reject
// @access  Private (Waiter, Admin)
export const rejectOrder = async (req, res) => {
	try {
		const { rejectionReason } = req.body;

		const order = await Order.findById(req.params.id);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		// Separate items by their status
		const pendingItems = order.items.filter(item => item.status === "pending");
		const workingItems = order.items.filter(item =>
			["preparing", "ready", "served"].includes(item.status)
		);

		if (pendingItems.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No pending items to reject",
			});
		}

		// Check if this is a full rejection or partial rejection
		const isFullRejection = workingItems.length === 0;

		if (isFullRejection) {
			// Full rejection: reject entire order
			order.status = "rejected";
			order.waiterId = req.user.id;
			order.rejectionReason = rejectionReason || "No reason provided";
			order.rejectedAt = new Date();
			await order.save();

			const populatedOrder = await Order.findById(order._id)
				.populate("tableId", "tableNumber area")
				.populate("customerId", "fullName email")
				.populate("waiterId", "fullName")
				.populate("items.menuItemId", "name price images");

			// Emit full rejection event
			const io = req.app.get("io");
			if (io) {
				emitOrderRejected(io, populatedOrder);
			}

			return res.json({
				success: true,
				message: "Order fully rejected",
				data: populatedOrder,
				isPartialRejection: false,
			});
		} else {
			// Partial rejection: mark rejected items and keep working items
			// Add rejection info to pending items
			const rejectedItemIds = pendingItems.map(item => item._id.toString());

			console.log('📋 Rejecting items:', rejectedItemIds);
			console.log('🔍 Items before modification:', order.items.map(i => ({ name: i.name, status: i.status })));

			order.items = order.items.map(item => {
				if (rejectedItemIds.includes(item._id.toString())) {
					console.log(`❌ Marking ${item.name} as rejected`);
					return {
						...item.toObject(),
						status: "rejected",
						rejectionReason: rejectionReason || "No reason provided",
						rejectedAt: new Date(),
					};
				}
				return item;
			});

			// ⚠️ IMPORTANT: Mark items as modified for Mongoose to save changes
			order.markModified('items');
			console.log('🔍 Items after modification:', order.items.map(i => ({ name: i.name, status: i.status })));

			// Recalculate totals (only count non-rejected items)
			const activeItems = order.items.filter(item => item.status !== "rejected");
			order.subtotal = activeItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
			order.total = order.subtotal + (order.tax || 0) - (order.discount || 0);

			// Move order to served status (so it appears in Served tab)
			order.status = "served";
			order.servedAt = new Date();
			order.waiterId = req.user.id;

			console.log(`📋 Order ${order.orderNumber} moved to SERVED after partial rejection`);

			await order.save();

			const populatedOrder = await Order.findById(order._id)
				.populate("tableId", "tableNumber area")
				.populate("customerId", "fullName email")
				.populate("waiterId", "fullName")
				.populate("items.menuItemId", "name price images");

			// Emit partial rejection event
			const io = req.app.get("io");
			if (io) {
				// Emit to table room
				io.to(`table:${populatedOrder.tableId._id || populatedOrder.tableId}`).emit("order:partialRejection", {
					message: "Some items in your order were rejected",
					order: populatedOrder,
					rejectedItems: pendingItems,
				});

				// Emit to order-specific room
				io.to(`order:${populatedOrder._id}`).emit("order:partialRejection", {
					message: "Some items in your order were rejected",
					order: populatedOrder,
					rejectedItems: pendingItems,
				});

				// Emit to waiters
				if (populatedOrder.restaurantId) {
					io.to(`${populatedOrder.restaurantId}:waiter`).emit("order:statusUpdate", {
						message: "Order partially rejected",
						order: populatedOrder,
					});
				}

				console.log(`⚠️ Order partially rejected: ${populatedOrder.orderNumber}`);
			}

			return res.json({
				success: true,
				message: "Order partially rejected",
				data: populatedOrder,
				isPartialRejection: true,
				rejectedItemsCount: pendingItems.length,
			});
		}
	} catch (error) {
		console.error("Reject order error:", error);
		res.status(500).json({
			success: false,
			message: "Error rejecting order",
			error: error.message,
		});
	}
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Kitchen Staff, Waiter, Admin)
export const updateOrderStatus = async (req, res) => {
	try {
		const { status } = req.body;

		const validStatuses = [
			"pending",
			"accepted",
			"preparing",
			"ready",
			"served",
			"completed",
			"cancelled",
		];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: "Invalid status",
			});
		}

		const order = await Order.findById(req.params.id);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		order.status = status;

		// Update timestamps based on status
		if (status === "preparing") {
			order.preparingAt = new Date();
		} else if (status === "ready") {
			order.readyAt = new Date();
		} else if (status === "served") {
			order.servedAt = new Date();
		} else if (status === "completed") {
			order.completedAt = new Date();

			// Update totalOrders for each menu item when order is completed
			// This helps track popularity for "Most Popular" sorting
			try {
				for (const item of order.items) {
					if (item.status !== "rejected") {
						await MenuItem.findByIdAndUpdate(
							item.menuItemId,
							{ $inc: { totalOrders: item.quantity } },
							{ new: true }
						);
						console.log(`📊 Incremented totalOrders for ${item.name} by ${item.quantity}`);
					}
				}
			} catch (error) {
				console.error("Failed to update menu item totalOrders:", error);
				// Don't fail the whole request if this fails
			}
		}

		// Update ALL item statuses to match order status (except for merged orders)
		// Only update items that are still pending (don't override already served items)
		if (status === "served" || status === "ready" || status === "completed") {
			order.items.forEach(item => {
				if (item.status === "pending" || item.status === "preparing" || item.status === "ready") {
					item.status = status;
				}
			});
			console.log(`📋 Updated item statuses to ${status} for order ${order.orderNumber}`);
		}

		await order.save();

		const populatedOrder = await Order.findById(order._id)
			.populate("tableId", "tableNumber area")
			.populate("customerId", "fullName email")
			.populate("waiterId", "fullName")
			.populate("items.menuItemId", "name price images");

		// Emit real-time event
		const io = req.app.get("io");
		if (io) {
			emitOrderStatusUpdate(io, order.restaurantId.toString(), populatedOrder);
		}

		res.json({
			success: true,
			message: "Order status updated",
			data: populatedOrder,
		});
	} catch (error) {
		console.error("Update order status error:", error);
		res.status(500).json({
			success: false,
			message: "Error updating order status",
			error: error.message,
		});
	}
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin only)
export const deleteOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.id);

		if (!order) {
			return res.status(404).json({
				success: false,
				message: "Order not found",
			});
		}

		await order.deleteOne();

		res.json({
			success: true,
			message: "Order deleted successfully",
		});
	} catch (error) {
		console.error("Delete order error:", error);
		res.status(500).json({
			success: false,
			message: "Error deleting order",
			error: error.message,
		});
	}
};

// @desc    Apply promotion to order
// @route   POST /api/orders/:orderId/apply-promotion
// @access  Public
export const applyPromotionToOrder = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { promotionId, promotionCode, discount, tip, tax, total } = req.body;

		// Find order
		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		// Update order with promotion and payment details
		order.discount = discount || 0;
		order.tipAmount = tip || 0;
		order.tax = tax || 0;
		order.total = total;

		await order.save();

		// Increment promotion usage count if promotion was applied
		if (promotionId) {
			try {
				const Promotion = (await import('../models/Promotion.js')).default;
				await Promotion.findByIdAndUpdate(promotionId, {
					$inc: { usedCount: 1 }
				});
				console.log(`✅ Incremented usage for promotion: ${promotionCode}`);
			} catch (promoError) {
				console.error('Failed to increment promotion usage:', promoError);
				// Don't fail the whole request if promotion update fails
			}
		}

		console.log(`✅ Applied promotion to order ${order.orderNumber}:`, {
			discount,
			tip,
			tax,
			total
		});

		res.status(200).json({
			success: true,
			message: 'Promotion applied successfully',
			data: order
		});

	} catch (error) {
		console.error('Apply promotion error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to apply promotion'
		});
	}
};

