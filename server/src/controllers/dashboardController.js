import Order from "../models/Order.js";
import Table from "../models/Table.js";

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (Admin, Waiter)
export const getDashboardStats = async (req, res) => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		// Today's orders (completed with paid status)
		const todayOrders = await Order.find({
			createdAt: { $gte: today },
			status: "completed",
			paymentStatus: "paid", // ✅ Use paymentStatus instead
		});

		const todayRevenue = todayOrders.reduce(
			(sum, order) => sum + (order.total || 0), // ✅ Use 'total' not 'totalAmount'
			0
		);

		// Yesterday's orders for growth calculation
		const yesterdayOrders = await Order.find({
			createdAt: { $gte: yesterday, $lt: today },
			status: "completed",
			paymentStatus: "paid",
		});

		const yesterdayRevenue = yesterdayOrders.reduce(
			(sum, order) => sum + (order.total || 0), // ✅ Use 'total' not 'totalAmount'
			0
		);

		const revenueGrowth =
			yesterdayRevenue > 0
				? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2)
				: 0;

		// Unpaid orders (orders that haven't been paid yet)
		// This includes all orders regardless of status that are not paid
		const unpaidOrders = await Order.countDocuments({
			paymentStatus: { $ne: "paid" },
			status: { $nin: ["cancelled", "rejected"] }, // Exclude cancelled/rejected orders
		});

		// Pending orders
		const pendingOrders = await Order.countDocuments({
			status: "pending",
		});

		// Completed orders today
		const completedOrders = todayOrders.length;

		// Total tables
		const totalTables = await Table.countDocuments();

		res.json({
			success: true,
			data: {
				todayRevenue: parseFloat(todayRevenue.toFixed(2)),
				revenueGrowth: parseFloat(revenueGrowth),
				unpaidOrders,
				pendingOrders,
				completedOrders,
				totalTables,
			},
		});
	} catch (error) {
		console.error("Error getting dashboard stats:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get dashboard statistics",
			error: error.message,
		});
	}
};

// @desc    Get recent orders for dashboard
// @route   GET /api/dashboard/recent-orders
// @access  Private (Admin, Waiter)
export const getRecentOrders = async (req, res) => {
	try {
		const limit = parseInt(req.query.limit) || 10;

		const orders = await Order.find()
			.populate({ path: "tableId", select: "tableNumber", strictPopulate: false })
			.sort({ createdAt: -1 })
			.limit(limit)
			.select("status totalAmount createdAt items");

		const recentOrders = orders.map((order) => ({
			id: `#${order._id.toString().slice(-4)}`,
			table: order.tableId?.tableNumber || "N/A",
			items: order.items?.length || 0,
			status: order.status,
			time: new Date(order.createdAt).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			}),
			amount: parseFloat(order.totalAmount || 0),
		}));

		res.json({
			success: true,
			data: recentOrders,
		});
	} catch (error) {
		console.error("Error getting recent orders:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get recent orders",
			error: error.message,
		});
	}
};

// @desc    Get table status overview
// @route   GET /api/dashboard/table-status
// @access  Private (Admin, Waiter)
export const getTableStatus = async (req, res) => {
	try {
		const tables = await Table.find()
			.select("tableNumber status capacity")
			.sort({ tableNumber: 1 });

		// Get all active orders (not completed, rejected, or cancelled)
		const activeOrders = await Order.find({
			status: { $in: ['pending', 'accepted', 'preparing', 'ready', 'served'] }
		}).select('tableId status');

		// Create a map of table IDs with active orders
		const tablesWithOrders = new Set(
			activeOrders.map(order => order.tableId.toString())
		);

		const tableStatus = tables.map((table) => {
			// Check if table has active orders
			const hasActiveOrder = tablesWithOrders.has(table._id.toString());

			// Determine status: if has active order, mark as occupied
			let status = table.status || "available";
			if (hasActiveOrder) {
				status = "occupied";
			}

			return {
				id: table._id,
				tableNumber: table.tableNumber,
				status: status,
				label:
					status === "occupied"
						? "Serving"
						: status === "reserved"
							? "Reserved"
							: "Free",
			};
		});

		res.json({
			success: true,
			data: tableStatus,
		});
	} catch (error) {
		console.error("Error getting table status:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get table status",
			error: error.message,
		});
	}
};
