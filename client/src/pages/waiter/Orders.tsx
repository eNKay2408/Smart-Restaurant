import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../../services/orderService";
import { useSocket } from "../../hooks/useSocket";
import type { Order } from "../../types/order.types";
import { toast } from "react-toastify";

function WaiterOrders() {
	const navigate = useNavigate();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState<
		"all" | "pending" | "ready" | "served" | "completed"
	>("pending");
	const [showRejectModal, setShowRejectModal] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const [rejectionReason, setRejectionReason] = useState("");
	const [soundEnabled, setSoundEnabled] = useState(true); // ✅ Sound toggle
	const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);
	const [confirmPaymentData, setConfirmPaymentData] = useState<{ orderId: string; total: number } | null>(null);

	// Get user from localStorage to get restaurantId
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const restaurantId = user?.restaurantId || "";

	// Socket.IO real-time connection
	const { isConnected, socket } = useSocket({
		role: "waiter",
		restaurantId: restaurantId,
		autoConnect: true,
	});

	// Use useCallback to prevent stale closure
	const fetchOrders = useCallback(async () => {
		try {
			setLoading(true);
			// Fetch all orders without status filter to get accurate counts
			const response = await orderService.getOrders({});
			if (response.success && response.data) {
				console.log('📋 Fetched orders:', response.data.length);
				setOrders(response.data);
			}
		} catch (err: any) {
			setError(err.message || "Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	}, []);

	// Separate effect for fetching orders on filter change
	useEffect(() => {
		fetchOrders();
	}, [filter, fetchOrders]);

	// Separate effect for setting up real-time listeners (only once)
	useEffect(() => {
		if (!socket) return;

		console.log('🔌 Setting up waiter Socket.IO listeners');

		// Set up real-time listeners - use socket.on() directly!
		const handleNewOrder = (data: any) => {
			console.log("🔔 New order received:", data);

			if (soundEnabled) {
				playNotificationSound(); // ✅ Sound for new order
			}
			toast.success(`New order from Table ${data.order?.tableId?.tableNumber}!`, {
				autoClose: 5000,
			});
			fetchOrders();
		};

		const handleStatusUpdate = (data: any) => {
			console.log("📢 Order status updated:", data);

			// Play sound only for READY status (kitchen finished)
			if (data.order?.status === 'ready') {
				if (soundEnabled) {
					playNotificationSound(); // ✅ Sound for ready order
				}
				toast.info(`Table ${data.order?.tableId?.tableNumber} order is ready!`, {
					autoClose: 5000,
				});
			}

			fetchOrders();
		};

		// Listen for cash payment requests
		const handleCashPaymentRequest = (data: any) => {
			console.log("💵 Cash payment requested:", data);

			if (soundEnabled) {
				playNotificationSound(); // ✅ Sound for cash payment
			}
			toast.warning(`Table ${data.order?.tableId?.tableNumber} requests cash payment!`, {
				autoClose: 5000,
			});
			fetchOrders();
		};

		// Listen for payment completed
		const handlePaymentCompleted = (data: any) => {
			console.log("✅ Payment completed:", data);
			fetchOrders();
		};

		// Register all listeners DIRECTLY on socket
		socket.on("order:new", handleNewOrder);
		socket.on("order:statusUpdate", handleStatusUpdate);
		socket.on("payment:cashRequested", handleCashPaymentRequest);
		socket.on("payment:completed", handlePaymentCompleted);

		console.log('✅ Waiter listeners registered');

		return () => {
			console.log('🔌 Cleaning up waiter listeners');
			socket.off("order:new", handleNewOrder);
			socket.off("order:statusUpdate", handleStatusUpdate);
			socket.off("payment:cashRequested", handleCashPaymentRequest);
			socket.off("payment:completed", handlePaymentCompleted);
		};
	}, [socket, fetchOrders, soundEnabled]); // ✅ Added soundEnabled

	const handleAccept = async (orderId: string) => {
		try {
			const response = await orderService.acceptOrder(orderId);
			if (response.success) {
				// Refresh orders
				fetchOrders();
			}
		} catch (err: any) {
			console.error("Failed to accept order:", err);
		}
	};

	const handleRejectClick = (order: Order) => {
		setSelectedOrder(order);
		setShowRejectModal(true);
	};

	const handleRejectSubmit = async () => {
		if (!selectedOrder || !rejectionReason.trim()) {
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
			}
		} catch (err: any) {
			console.error("Failed to reject order:", err);
		}
	};

	const handleMarkAsServed = async (orderId: string) => {
		try {
			const response = await orderService.updateOrderStatus(orderId, "served");
			if (response.success) {
				fetchOrders();
			}
		} catch (err: any) {
			console.error("Failed to mark order as served:", err);
		}
	};

	const handleMarkAsCompleted = async (orderId: string) => {
		try {
			const response = await orderService.updateOrderStatus(
				orderId,
				"completed"
			);
			if (response.success) {
				fetchOrders();
			}
		} catch (err: any) {
			console.error("Failed to mark order as completed:", err);
		}
	};

	const handleConfirmCashPayment = async (orderId: string, total: number) => {
		// Show custom modal instead of window.confirm
		setConfirmPaymentData({ orderId, total });
		setShowConfirmPaymentModal(true);
	};

	const confirmCashPayment = async () => {
		if (!confirmPaymentData) return;

		const { orderId, total } = confirmPaymentData;

		try {
			const response = await fetch(`http://localhost:5000/api/orders/${orderId}/confirm-cash-payment`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem('token')}`,
				},
				body: JSON.stringify({
					amountReceived: total,
					tipAmount: 0,
				}),
			});

			const data = await response.json();

			if (data.success) {
				toast.success('Payment confirmed successfully!');
				// Auto complete after payment confirmed
				await handleMarkAsCompleted(orderId);
			} else {
				throw new Error(data.message || 'Failed to confirm payment');
			}
		} catch (err: any) {
			console.error("Failed to confirm cash payment:", err);
			toast.error(err.message || 'Failed to confirm payment');
		} finally {
			setShowConfirmPaymentModal(false);
			setConfirmPaymentData(null);
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

	const playNotificationSound = () => {
		// Simple beep sound for new orders
		try {
			const audioContext = new (window.AudioContext ||
				(window as any).webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);

			oscillator.frequency.value = 1000;
			oscillator.type = "sine";

			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				audioContext.currentTime + 0.3
			);

			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.3);
		} catch (error) {
			console.log("Unable to play notification sound");
		}
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
				<div className="flex justify-between items-center mb-6 md:mb-8">
					<h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-center md:text-left">
						👔 Waiter Dashboard
					</h1>
					<div className="flex items-center gap-4">
						{/* Sound Toggle */}
						<button
							onClick={() => setSoundEnabled(!soundEnabled)}
							className={`px-3 py-1 rounded-lg font-medium transition-all text-sm ${soundEnabled
								? "bg-green-500 text-white hover:bg-green-600"
								: "bg-gray-300 text-gray-700 hover:bg-gray-400"
								}`}
							title={soundEnabled ? "Sound ON" : "Sound OFF"}
						>
							{soundEnabled ? "🔔" : "🔕"}
						</button>

						{/* Live Status */}
						<div className="flex items-center gap-2">
							<div
								className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
									}`}
							></div>
							<span className="text-sm text-gray-600">
								{isConnected ? "Live" : "Offline"}
							</span>
						</div>
					</div>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				{/* Filter Tabs */}
				<div className="mb-6 flex flex-wrap gap-2">
					<button
						onClick={() => setFilter("pending")}
						className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "pending"
							? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg"
							: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
					>
						⏳ Pending ({orders.filter((o) => o.status === "pending").length})
					</button>
					<button
						onClick={() => setFilter("ready")}
						className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "ready"
							? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
							: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
					>
						✅ Ready ({orders.filter((o) => o.status === "ready").length})
					</button>
					<button
						onClick={() => setFilter("served")}
						className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base relative ${filter === "served"
							? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
							: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
					>
						🍽️ Served ({orders.filter((o) => o.status === "served").length})
						{orders.filter((o) => o.status === "served" && o.paymentStatus === "pending_cash").length > 0 && (
							<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
								{orders.filter((o) => o.status === "served" && o.paymentStatus === "pending_cash").length}
							</span>
						)}
					</button>
					<button
						onClick={() => setFilter("completed")}
						className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "completed"
							? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
							: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
					>
						💯 Completed (
						{orders.filter((o) => o.status === "completed").length})
					</button>
					<button
						onClick={() => setFilter("all")}
						className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "all"
							? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
							: "bg-white text-gray-700 hover:bg-gray-100"
							}`}
					>
						📋 All ({orders.length})
					</button>
				</div>

				{/* Orders Grid */}
				{orders.filter((o) => (filter === "all" ? true : o.status === filter))
					.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-xl text-gray-600">No orders found</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{orders
							.filter((o) => (filter === "all" ? true : o.status === filter))
							.map((order) => (
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
												<li key={idx} className={`text-sm flex items-center justify-between ${item.status === 'served' || item.status === 'ready'
													? 'text-gray-400 line-through'
													: 'text-gray-900 font-semibold'
													}`}>
													<span>• {item.quantity}x {item.name}</span>
													{item.status === 'pending' && (
														<span className="bg-yellow-500 text-white text-xs px-1 rounded">NEW</span>
													)}
													{(item.status === 'served' || item.status === 'ready') && (
														<span className="text-green-600">✅</span>
													)}
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

									{order.status === "accepted" && (
										<div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
											<p className="text-sm text-blue-700 text-center">
												⏳ Waiting for kitchen to start preparing
											</p>
										</div>
									)}

									{order.status === "preparing" && (
										<div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
											<p className="text-sm text-orange-700 text-center">
												🔥 Kitchen is preparing the order
											</p>
										</div>
									)}

									{order.status === "ready" && (
										<button
											onClick={() => handleMarkAsServed(order._id)}
											className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
										>
											🍽️ Mark as Served
										</button>
									)}

									{order.status === "served" && (
										<div className="flex gap-2">
											<button
												onClick={() => navigate(`/waiter/bill/${order._id}`)}
												className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
											>
												📄 View Bill
											</button>
											{/* Only show Complete button if customer has requested payment */}
											{order.paymentStatus !== 'pending' && (
												<button
													onClick={() => {
														if (order.paymentStatus === 'pending_cash') {
															handleConfirmCashPayment(order._id, order.total);
														} else {
															handleMarkAsCompleted(order._id);
														}
													}}
													className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all relative"
												>
													{order.paymentStatus === 'pending_cash' && (
														<span className="absolute -top-1 -right-1 flex h-3 w-3">
															<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
															<span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
														</span>
													)}
													{order.paymentStatus === 'pending_cash' ? '💵 Confirm Payment' : '✅ Complete'}
												</button>
											)}

											{/* Show message if payment not requested yet */}
											{order.paymentStatus === 'pending' && (
												<div className="flex-1 bg-yellow-50 border border-yellow-300 text-yellow-700 py-2 rounded-lg text-center text-sm">
													⏳ Waiting for payment request
												</div>
											)}
										</div>
									)}

									{order.status === "completed" && (
										<button
											onClick={() => navigate(`/waiter/bill/${order._id}`)}
											className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all"
										>
											📄 View Bill
										</button>
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
							className={`w-full border rounded-lg p-3 mb-2 focus:outline-none focus:ring-2 ${!rejectionReason.trim()
								? "border-gray-300 focus:ring-red-500"
								: "border-gray-300 focus:ring-red-500"
								}`}
							rows={4}
						/>
						{!rejectionReason.trim() && (
							<p className="text-xs text-red-500 mb-2">
								Please provide a rejection reason
							</p>
						)}
						<div className="flex gap-2 mt-2">
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
								disabled={!rejectionReason.trim()}
								className={`flex-1 py-2 rounded-lg font-medium transition-all ${!rejectionReason.trim()
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg"
									}`}
							>
								Confirm Reject
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Confirm Payment Modal */}
			{showConfirmPaymentModal && confirmPaymentData && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
						<h3 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
							💵 Confirm Cash Payment
						</h3>
						<div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
							<p className="text-sm text-gray-600 mb-2">Payment Amount:</p>
							<p className="text-3xl font-bold text-green-600">
								${confirmPaymentData.total.toFixed(2)}
							</p>
						</div>
						<p className="text-sm text-gray-600 mb-6">
							Please confirm that you have received the cash payment from the customer.
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => {
									setShowConfirmPaymentModal(false);
									setConfirmPaymentData(null);
								}}
								className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all"
							>
								Cancel
							</button>
							<button
								onClick={confirmCashPayment}
								className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
							>
								✓ Confirm Payment
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default WaiterOrders;
