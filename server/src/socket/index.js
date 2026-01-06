import { Server } from "socket.io";

/**
 * Initialize Socket.IO server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocket = (httpServer) => {
	const io = new Server(httpServer, {
		cors: {
			origin: process.env.CLIENT_URL || "http://localhost:5173",
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	// Socket.IO connection handler
	io.on("connection", (socket) => {
		console.log(`✅ Client connected: ${socket.id}`);

		// Join room based on role
		socket.on("join:role", (data) => {
			const { role, restaurantId } = data;
			const room = `${restaurantId}:${role}`;
			socket.join(room);
			console.log(`👤 Socket ${socket.id} joined room: ${room}`);
		});

		// Join specific table room (for customers)
		socket.on("join:table", (data) => {
			const { tableId } = data;
			socket.join(`table:${tableId}`);
			console.log(`🪑 Socket ${socket.id} joined table: ${tableId}`);
		});

		// Join order room (for order-specific updates)
		socket.on("join:order", (data) => {
			const { orderId } = data;
			socket.join(`order:${orderId}`);
			console.log(`📋 Socket ${socket.id} joined order: ${orderId}`);
		});

		// Disconnect handler
		socket.on("disconnect", () => {
			console.log(`❌ Client disconnected: ${socket.id}`);
		});
	});

	return io;
};

/**
 * Emit new order event to waiters
 * @param {Object} io - Socket.IO server instance
 * @param {String} restaurantId - Restaurant ID
 * @param {Object} order - Order data
 */
export const emitNewOrder = (io, restaurantId, order) => {
	io.to(`${restaurantId}:waiter`).emit("order:new", {
		message: "New order received",
		order,
	});
	console.log(`📢 New order emitted to waiters: ${order.orderNumber}`);
};

/**
 * Emit order accepted event to kitchen and customer
 * @param {Object} io - Socket.IO server instance
 * @param {String} restaurantId - Restaurant ID
 * @param {Object} order - Order data
 */
export const emitOrderAccepted = (io, restaurantId, order) => {
	const kitchenRoom = `${restaurantId}:kitchen`;
	const waiterRoom = `${restaurantId}:waiter`;
	const tableRoom = `table:${order.tableId}`;

	// Debug: Check rooms
	console.log(`🔍 [DEBUG] Emitting order:accepted to room: ${kitchenRoom}`);
	console.log(
		`🔍 [DEBUG] Sockets in ${kitchenRoom}:`,
		io.sockets.adapter.rooms.get(kitchenRoom)?.size || 0
	);

	console.log(`🔍 [DEBUG] Emitting order:statusUpdate to room: ${waiterRoom}`);
	console.log(
		`🔍 [DEBUG] Sockets in ${waiterRoom}:`,
		io.sockets.adapter.rooms.get(waiterRoom)?.size || 0
	);

	// Notify kitchen staff
	io.to(kitchenRoom).emit("order:accepted", {
		message: "Order accepted by waiter",
		order,
	});

	// Notify waiters (so other waiters see the update too)
	io.to(waiterRoom).emit("order:statusUpdate", {
		message: "Order accepted",
		order,
	});

	// Notify customer at table
	io.to(tableRoom).emit("order:statusUpdate", {
		message: "Your order has been accepted",
		order,
	});

	console.log(`✅ Order accepted emitted: ${order.orderNumber}`);
};

/**
 * Emit order rejected event to customer
 * @param {Object} io - Socket.IO server instance
 * @param {Object} order - Order data
 */
export const emitOrderRejected = (io, order) => {
	// Notify customer at table
	io.to(`table:${order.tableId}`).emit("order:statusUpdate", {
		message: "Your order has been rejected",
		order,
	});

	// Notify waiters (so other waiters see the update too)
	if (order.restaurantId) {
		io.to(`${order.restaurantId}:waiter`).emit("order:statusUpdate", {
			message: "Order rejected",
			order,
		});
	}

	console.log(`❌ Order rejected emitted: ${order.orderNumber}`);
};

/**
 * Emit order status update
 * @param {Object} io - Socket.IO server instance
 * @param {String} restaurantId - Restaurant ID
 * @param {Object} order - Order data
 */
export const emitOrderStatusUpdate = (io, restaurantId, order) => {
	const waiterRoom = `${restaurantId}:waiter`;
	const kitchenRoom = `${restaurantId}:kitchen`;
	const tableRoom = `table:${order.tableId}`;

	// Debug logs
	console.log(`🔍 [DEBUG] Emitting order:statusUpdate to room: ${waiterRoom}`);
	console.log(
		`🔍 [DEBUG] Sockets in ${waiterRoom}:`,
		io.sockets.adapter.rooms.get(waiterRoom)?.size || 0
	);

	// Notify customer
	io.to(tableRoom).emit("order:statusUpdate", {
		message: `Order status updated to ${order.status}`,
		order,
	});

	// Notify waiters
	io.to(waiterRoom).emit("order:statusUpdate", {
		message: `Order ${order.orderNumber} status updated`,
		order,
	});

	// Notify kitchen if status is preparing or ready
	if (order.status === "preparing" || order.status === "ready") {
		console.log(
			`🔍 [DEBUG] Emitting order:statusUpdate to room: ${kitchenRoom}`
		);
		console.log(
			`🔍 [DEBUG] Sockets in ${kitchenRoom}:`,
			io.sockets.adapter.rooms.get(kitchenRoom)?.size || 0
		);

		io.to(kitchenRoom).emit("order:statusUpdate", {
			message: `Order ${order.orderNumber} is ${order.status}`,
			order,
		});
	}

	console.log(
		`🔄 Order status update emitted: ${order.orderNumber} - ${order.status}`
	);
};

export default initializeSocket;
