import { useState, useEffect } from "react";
import orderService from "../../services/orderService";
import type { Order } from "../../types/order.types";

function WaiterOrders() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState<
		"all" | "pending" | "accepted" | "preparing"
	>("pending");
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");

	useEffect(() => {
		fetchOrders();
	}, [filter]);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const params: any = {};
			if (filter !== "all") {
				params.status = filter;
			}
			const response = await orderService.getOrders(params);
			if (response.success && response.data) {
				setOrders(response.data);
			}
		} catch (err: any) {
			setError(err.message || "Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	};

	const handleAccept = async (orderId: string) => {
		try {
			const response = await orderService.acceptOrder(orderId);
			if (response.success) {
				// Refresh orders
				fetchOrders();
				alert("Order accepted successfully!");
			}
		} catch (err: any) {
			alert(err.message || "Failed to accept order");
		}
	};

	const handleRejectClick = (order: Order) => {
		setSelectedOrder(order);
		setShowRejectModal(true);
	};

	const handleRejectSubmit = async () => {
		if (!selectedOrder || !rejectionReason.trim()) {
			alert("Please provide a rejection reason");
			return;
		}

		try {
			const response = await orderService.rejectOrder(
				selectedOrder._id,
				rejectionReason
			);
			if (response.success) {
				setShowRejectModal(false);
				setRejectionReason("");
				setSelectedOrder(null);
				fetchOrders();
				alert("Order rejected");
			}
		} catch (err: any) {
			alert(err.message || "Failed to reject order");
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "accepted":
				return "bg-blue-100 text-blue-800";
			case "preparing":
				return "bg-purple-100 text-purple-800";
			case "ready":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
				<div className="text-2xl font-semibold text-purple-600">
					Loading orders...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
			<div className="container mx-auto px-4 py-8">
				<h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
					👔 Waiter Dashboard
				</h1>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				{/* Filter Tabs */}
				<div className="mb-6 flex gap-2">
					<button
						onClick={() => setFilter("pending")}
						className={`px-6 py-2 rounded-lg font-medium transition-all ${
							filter === "pending"
								? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						Pending ({orders.filter((o) => o.status === "pending").length})
					</button>
					<button
						onClick={() => setFilter("accepted")}
						className={`px-6 py-2 rounded-lg font-medium transition-all ${
							filter === "accepted"
								? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						Accepted
					</button>
					<button
						onClick={() => setFilter("preparing")}
						className={`px-6 py-2 rounded-lg font-medium transition-all ${
							filter === "preparing"
								? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						Preparing
					</button>
					<button
						onClick={() => setFilter("all")}
						className={`px-6 py-2 rounded-lg font-medium transition-all ${
							filter === "all"
								? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						All Orders
					</button>
				</div>

				{/* Orders Grid */}
				{orders.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-xl text-gray-600">No orders found</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{orders.map((order) => (
							<div
								key={order._id}
								className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
							>
								{/* Header */}
								<div className="flex justify-between items-start mb-4">
									<div>
										<h3 className="text-xl font-bold text-gray-800">
											{order.orderNumber}
										</h3>
										<p className="text-sm text-gray-600">
											Table {order.tableId.tableNumber}
											{order.tableId.area && ` - ${order.tableId.area}`}
										</p>
										<p className="text-xs text-gray-500">
											{formatTime(order.createdAt)}
										</p>
									</div>
									<span
										className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
											order.status
										)}`}
									>
										{order.status.toUpperCase()}
									</span>
								</div>

								{/* Customer */}
								<div className="mb-4">
									<p className="text-sm font-semibold text-gray-700">
										👤{" "}
										{order.customerId
											? order.customerId.fullName
											: order.guestName}
									</p>
								</div>

								{/* Items */}
								<div className="mb-4 border-t pt-3">
									<p className="text-sm font-semibold text-gray-700 mb-2">
										Items ({order.items.length}):
									</p>
									<ul className="space-y-1 max-h-32 overflow-y-auto">
										{order.items.map((item, idx) => (
											<li key={idx} className="text-sm text-gray-600">
												• {item.quantity}x {item.name}
											</li>
										))}
									</ul>
								</div>

								{/* Notes */}
								{order.orderNotes && (
									<div className="mb-4 bg-yellow-50 p-2 rounded">
										<p className="text-xs text-gray-600">
											📝 {order.orderNotes}
										</p>
									</div>
								)}

								{/* Total */}
								<div className="border-t pt-3 mb-4">
									<p className="text-lg font-bold text-purple-600">
										Total: ${order.total.toFixed(2)}
									</p>
								</div>

								{/* Actions */}
								{order.status === "pending" && (
									<div className="flex gap-2">
										<button
											onClick={() => handleAccept(order._id)}
											className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
										>
											✅ Accept
										</button>
										<button
											onClick={() => handleRejectClick(order)}
											className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
										>
											❌ Reject
										</button>
									</div>
								)}

								{order.status === "rejected" && order.rejectionReason && (
									<div className="bg-red-50 p-2 rounded">
										<p className="text-xs text-red-600">
											Reason: {order.rejectionReason}
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Reject Modal */}
			{showRejectModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
						<h3 className="text-xl font-bold mb-4 text-gray-800">
							Reject Order
						</h3>
						<p className="text-sm text-gray-600 mb-4">
							Order: {selectedOrder?.orderNumber}
						</p>
						<textarea
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							placeholder="Enter rejection reason..."
							className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
							rows={4}
						/>
						<div className="flex gap-2">
							<button
								onClick={() => {
									setShowRejectModal(false);
									setRejectionReason("");
									setSelectedOrder(null);
								}}
								className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={handleRejectSubmit}
								className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
							>
								Confirm Reject
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default WaiterOrders;
