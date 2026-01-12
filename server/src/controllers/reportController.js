import Order from "../models/Order.js";
import Table from "../models/Table.js";
import Review from "../models/Review.js";

// @desc    Get report statistics for date range
// @route   GET /api/reports/stats
// @access  Private (Admin)
export const getReportStats = async (req, res) => {
	try {
		const { from, to } = req.query;

		if (!from || !to) {
			return res.status(400).json({
				success: false,
				message: "Date range (from and to) is required",
			});
		}

		const startDate = new Date(from);
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date(to);
		endDate.setHours(23, 59, 59, 999);

		// Calculate previous period for comparison
		const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
		const prevStartDate = new Date(startDate);
		prevStartDate.setDate(prevStartDate.getDate() - daysDiff);
		const prevEndDate = new Date(startDate);

		// Current period orders (completed and paid)
		const currentOrders = await Order.find({
			createdAt: { $gte: startDate, $lte: endDate },
			status: "completed",
			paymentStatus: "paid",
		});

		// Previous period orders (completed and paid)
		const previousOrders = await Order.find({
			createdAt: { $gte: prevStartDate, $lt: prevEndDate },
			status: "completed",
			paymentStatus: "paid",
		});

		// Calculate metrics
		const totalRevenue = currentOrders.reduce(
			(sum, order) => sum + (order.total || 0),
			0
		);
		const previousRevenue = previousOrders.reduce(
			(sum, order) => sum + (order.total || 0),
			0
		);
		const revenueGrowth =
			previousRevenue > 0
				? (((totalRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2)
				: 0;

		const ordersCount = currentOrders.length;
		const previousOrdersCount = previousOrders.length;
		const ordersGrowth =
			previousOrdersCount > 0
				? (((ordersCount - previousOrdersCount) / previousOrdersCount) * 100).toFixed(2)
				: 0;

		const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;
		const previousAvgOrderValue =
			previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
		const avgOrderGrowth =
			previousAvgOrderValue > 0
				? (((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100).toFixed(2)
				: 0;

		res.json({
			success: true,
			data: {
				totalRevenue: parseFloat(totalRevenue.toFixed(2)),
				revenueGrowth: parseFloat(revenueGrowth),
				ordersCount,
				ordersGrowth: parseFloat(ordersGrowth),
				avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
				avgOrderGrowth: parseFloat(avgOrderGrowth),
			},
		});
	} catch (error) {
		console.error("Error getting report stats:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get report statistics",
			error: error.message,
		});
	}
};

// @desc    Get revenue data by day for chart
// @route   GET /api/reports/revenue-chart
// @access  Private (Admin)
export const getRevenueChart = async (req, res) => {
	try {
		const { from, to } = req.query;

		if (!from || !to) {
			return res.status(400).json({
				success: false,
				message: "Date range (from and to) is required",
			});
		}

		const startDate = new Date(from);
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date(to);
		endDate.setHours(23, 59, 59, 999);

		// Get orders grouped by day using aggregation
		const orders = await Order.aggregate([
			{
				$match: {
					createdAt: { $gte: startDate, $lte: endDate },
					status: "completed",
					paymentStatus: "paid",
				},
			},
			{
				$group: {
					_id: {
						$dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
					},
					revenue: { $sum: "$total" },
				},
			},
			{
				$sort: { _id: 1 },
			},
		]);

		// Format data for chart
		const chartData = orders.map((order) => ({
			date: new Date(order._id).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			revenue: parseFloat(order.revenue || 0),
		}));

		res.json({
			success: true,
			data: chartData,
		});
	} catch (error) {
		console.error("Error getting revenue chart:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get revenue chart data",
			error: error.message,
		});
	}
};

// @desc    Get top selling menu items
// @route   GET /api/reports/top-selling
// @access  Private (Admin)
export const getTopSellingItems = async (req, res) => {
	try {
		const { from, to } = req.query;
		const limit = parseInt(req.query.limit) || 10;

		if (!from || !to) {
			return res.status(400).json({
				success: false,
				message: "Date range (from and to) is required",
			});
		}

		const startDate = new Date(from);
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date(to);
		endDate.setHours(23, 59, 59, 999);

		// Get all orders in date range (completed and paid)
		const orders = await Order.find({
			createdAt: { $gte: startDate, $lte: endDate },
			status: "completed",
			paymentStatus: "paid",
		}).select("items");

		// Aggregate item statistics
		const itemStats = {};

		orders.forEach((order) => {
			if (order.items && Array.isArray(order.items)) {
				order.items.forEach((item) => {
					const itemId = item.menuItemId?.toString() || item._id?.toString();
					const itemName = item.name;
					const quantity = item.quantity || 1;
					const price = parseFloat(item.price || 0);

					if (!itemStats[itemId]) {
						itemStats[itemId] = {
							name: itemName,
							orders: 0,
							revenue: 0,
						};
					}

					itemStats[itemId].orders += quantity;
					itemStats[itemId].revenue += price * quantity;
				});
			}
		});

		// Convert to array and sort by orders
		const topItems = Object.values(itemStats)
			.sort((a, b) => b.orders - a.orders)
			.slice(0, limit)
			.map((item) => ({
				name: item.name,
				orders: item.orders,
				revenue: parseFloat(item.revenue.toFixed(2)),
			}));

		res.json({
			success: true,
			data: topItems,
		});
	} catch (error) {
		console.error("Error getting top selling items:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get top selling items",
			error: error.message,
		});
	}
};

// @desc    Get performance insights
// @route   GET /api/reports/insights
// @access  Private (Admin)
export const getInsights = async (req, res) => {
	try {
		const { from, to } = req.query;

		if (!from || !to) {
			return res.status(400).json({
				success: false,
				message: "Date range (from and to) is required",
			});
		}

		const startDate = new Date(from);
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date(to);
		endDate.setHours(23, 59, 59, 999);

		// Get orders in date range
		const orders = await Order.find({
			createdAt: { $gte: startDate, $lte: endDate },
			status: { $in: ["completed", "paid", "preparing", "ready"] },
		}).select("createdAt updatedAt status items");

		// Calculate peak hour
		const hourCounts = {};
		orders.forEach((order) => {
			const hour = new Date(order.createdAt).getHours();
			hourCounts[hour] = (hourCounts[hour] || 0) + 1;
		});

		const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];

		const peakHourOrders = peakHour ? peakHour[1] : 0;
		const peakHourValue = peakHour ? parseInt(peakHour[0]) : 12;
		const peakHourTime = peakHour
			? `${peakHourValue}:00 ${peakHourValue >= 12 ? "PM" : "AM"} - ${peakHourValue + 1
			}:00 ${peakHourValue + 1 >= 12 ? "PM" : "AM"}`
			: "N/A";

		// Calculate customer rating from reviews
		const reviews = await Review.find({
			createdAt: { $gte: startDate, $lte: endDate },
		});

		const customerRating =
			reviews.length > 0
				? parseFloat(
					(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
				)
				: 0;

		// Calculate average prep time from order items
		let totalPrepTime = 0;
		let itemCount = 0;

		orders.forEach((order) => {
			if (order.items && Array.isArray(order.items)) {
				order.items.forEach((item) => {
					if (item.prepStartTime && item.prepEndTime) {
						const prepTime =
							(new Date(item.prepEndTime) - new Date(item.prepStartTime)) /
							(1000 * 60); // Convert to minutes
						totalPrepTime += prepTime;
						itemCount++;
					}
				});
			}
		});

		const avgPrepTime = itemCount > 0 ? Math.round(totalPrepTime / itemCount) : 0;

		// Calculate table turnover rate
		const completedOrdersCount = await Order.countDocuments({
			createdAt: { $gte: startDate, $lte: endDate },
			status: "completed",
			paymentStatus: "paid",
		});

		const totalTables = await Table.countDocuments({ isActive: true });
		const daysDiff =
			Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

		// Calculate turnover rate (average times a table is used per day)
		// Assuming target is 3 turnovers per table per day for 100%
		const avgTurnoversPerDay =
			totalTables > 0 ? completedOrdersCount / totalTables / daysDiff : 0;
		const tableTurnover = Math.min(Math.round((avgTurnoversPerDay / 3) * 100), 100);

		res.json({
			success: true,
			data: {
				peakHourOrders,
				peakHourTime,
				customerRating,
				avgPrepTime,
				tableTurnover,
			},
		});
	} catch (error) {
		console.error("Error getting insights:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get performance insights",
			error: error.message,
		});
	}
};
