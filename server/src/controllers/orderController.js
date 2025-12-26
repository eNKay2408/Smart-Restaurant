import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Table from "../models/Table.js";
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
			status,
			paymentStatus,
			sortBy = "createdAt",
			order = "desc",
			page = 1,
			limit = 20,
		} = req.query;

		// Build filter
		const filter = {};
		if (restaurantId) filter.restaurantId = restaurantId;
		if (tableId) filter.tableId = tableId;
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
		const existingOrder = await Order.findOne({
			tableId,
			paymentStatus: "pending",
			status: { $nin: ["completed", "cancelled"] },
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

			// Add new items to existing order
			existingOrder.items.push(...processedItems);
			existingOrder.subtotal += itemsSubtotal;
			existingOrder.total =
				existingOrder.subtotal + existingOrder.tax - existingOrder.discount;

			await existingOrder.save();

			const populatedOrder = await Order.findById(existingOrder._id)
				.populate("tableId", "tableNumber area")
				.populate("customerId", "fullName email")
				.populate("items.menuItemId", "name price images");

			// Emit real-time event to waiters
			const io = req.app.get("io");
			if (io) {
				emitNewOrder(io, restaurantId, populatedOrder);
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

		// Emit real-time event to waiters
		const io = req.app.get("io");
		if (io) {
			emitNewOrder(io, restaurantId, populatedOrder);
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

		if (order.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: "Only pending orders can be rejected",
			});
		}

		order.status = "rejected";
		order.waiterId = req.user.id;
		order.rejectionReason = rejectionReason || "No reason provided";
		await order.save();

		const populatedOrder = await Order.findById(order._id)
			.populate("tableId", "tableNumber area")
			.populate("customerId", "fullName email")
			.populate("waiterId", "fullName")
			.populate("items.menuItemId", "name price images");

		// Emit real-time event
		const io = req.app.get("io");
		if (io) {
			emitOrderRejected(io, populatedOrder);
		}

		res.json({
			success: true,
			message: "Order rejected",
			data: populatedOrder,
		});
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
