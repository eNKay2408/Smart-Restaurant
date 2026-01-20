import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import Table from "../models/Table.js";
import Cart from "../models/Cart.js";
import {
    emitNewOrder,
    emitOrderAccepted,
    emitOrderRejected,
    emitOrderStatusUpdate,
} from "../socket/index.js";

// ... (existing code - getOrders, getOrder, createOrder, etc.)

// @desc    Request cash payment (Customer)
// @route   POST /api/orders/:id/request-cash-payment
// @access  Public
export const requestCashPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate({ path: "tableId", select: "tableNumber area", strictPopulate: false })
            .populate({ path: "customerId", select: "fullName email", strictPopulate: false })
            .populate({ path: "restaurantId", select: "name", strictPopulate: false });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Update order to indicate cash payment requested
        order.paymentMethod = "cash";
        order.paymentStatus = "pending_cash";
        await order.save();

        // Emit Socket.IO event to waiters
        const io = req.app.get("io");
        if (io) {
            // Validate restaurantId
            const restaurantId = order.restaurantId?._id || order.restaurantId;
            if (!restaurantId) {
                console.error('❌ No restaurantId found for order:', order._id);
                return res.status(400).json({
                    success: false,
                    message: "Order missing restaurant information",
                });
            }

            const waiterRoom = `${restaurantId}:waiter`;
            console.log(`📡 Emitting payment:cashRequested to room: ${waiterRoom}`);
            console.log(`📋 Table: ${order.tableId?.tableNumber}, Order: ${order.orderNumber}`);
            console.log(`🔍 Sockets in ${waiterRoom}:`, io.sockets.adapter.rooms.get(waiterRoom)?.size || 0);

            io.to(waiterRoom).emit("payment:cashRequested", {
                message: `Table ${order.tableId?.tableNumber} requests cash payment`,
                order,
            });
            console.log(`💵 Cash payment requested for table ${order.tableId?.tableNumber}`);
        }

        res.json({
            success: true,
            message: "Cash payment request sent to waiter",
            data: order,
        });
    } catch (error) {
        console.error("❌ Request cash payment error:", error);
        console.error("Error stack:", error.stack);
        console.error("Order ID:", req.params.id);
        res.status(500).json({
            success: false,
            message: "Error requesting cash payment",
            error: error.message,
        });
    }
};

// @desc    Confirm cash payment (Waiter)
// @route   POST /api/orders/:id/confirm-cash-payment
// @access  Private (Waiter, Admin)
export const confirmCashPayment = async (req, res) => {
    try {
        const { amountReceived, tipAmount } = req.body;

        const order = await Order.findById(req.params.id)
            .populate({ path: "tableId", select: "tableNumber area", strictPopulate: false })
            .populate({ path: "customerId", select: "fullName email", strictPopulate: false })
            .populate({ path: "restaurantId", select: "name", strictPopulate: false });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Update order payment status
        order.paymentStatus = "paid";
        order.paymentMethod = "cash";
        order.paidAt = new Date();
        order.amountReceived = amountReceived || order.total;
        order.tipAmount = tipAmount || 0;

        // Only mark as completed if order has been served
        // This ensures proper workflow: pending → accepted → preparing → ready → served → completed
        if (order.status === "served") {
            order.status = "completed";
            order.completedAt = new Date();
        }

        await order.save();

        // Clear table cart
        if (order.tableId) {
            await Cart.findOneAndDelete({ tableId: order.tableId._id });
        }

        // Update table status to available
        if (order.tableId) {
            await Table.findByIdAndUpdate(order.tableId._id, {
                status: "active",
                currentOrder: null,
            });
        }

        // Emit Socket.IO event to customer and waiters
        const io = req.app.get("io");
        if (io) {
            const tableId = order.tableId?._id || order.tableId;
            const restaurantId = order.restaurantId?._id || order.restaurantId;

            if (!tableId || !restaurantId) {
                console.error('❌ Missing IDs for emit:', { tableId, restaurantId });
            }

            const tableRoom = `table:${tableId}`;
            const waiterRoom = `${restaurantId}:waiter`;

            console.log(`📡 Emitting payment:confirmed to room: ${tableRoom}`);
            console.log(`📋 Order ID: ${order._id}`);
            console.log(`🔍 Sockets in ${tableRoom}:`, io.sockets.adapter.rooms.get(tableRoom)?.size || 0);

            // Notify customer
            io.to(tableRoom).emit("payment:confirmed", {
                message: "Payment confirmed. Thank you!",
                order,
            });

            // Notify other waiters
            io.to(waiterRoom).emit("payment:completed", {
                message: `Table ${order.tableId?.tableNumber} payment completed`,
                order,
            });

            console.log(`✅ Cash payment confirmed for table ${order.tableId?.tableNumber}`);
        }

        res.json({
            success: true,
            message: "Cash payment confirmed successfully",
            data: order,
        });
    } catch (error) {
        console.error("Confirm cash payment error:", error);
        res.status(500).json({
            success: false,
            message: "Error confirming cash payment",
            error: error.message,
        });
    }
};
