import { useState, useEffect } from "react";
import orderService from "../../services/orderService";
import { useSocket } from "../../hooks/useSocket";
import type { Order } from "../../types/order.types";

function KDS() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filter, setFilter] = useState<"accepted" | "preparing" | "all">(
		"accepted"
	);

	// Get user from localStorage to get restaurantId
	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const restaurantId = user?.restaurantId || "";

	// Socket.IO real-time connection
	const { isConnected, onOrderAccepted, onOrderStatusUpdate } = useSocket({
		role: "kitchen",
		restaurantId: restaurantId,
		autoConnect: true,
	});

	// Separate effect for fetching orders on filter change
	useEffect(() => {
		fetchOrders();
	}, [filter]);

	// Separate effect for setting up real-time listeners (only once)
	useEffect(() => {
		// Set up real-time listeners
		const handleOrderAccepted = (data: any) => {
			console.log("🔔 Order accepted by waiter:", data);
			playNotificationSound();
			// Refresh orders to show the new accepted order
			fetchOrders();
		};

		const handleStatusUpdate = (data: any) => {
			console.log("📢 Order status updated:", data);

			// If order moved to served/completed, remove it from the list
			// Otherwise refresh to show updates
			if (data.order && ["served", "completed"].includes(data.order.status)) {
				console.log("🗑️ Removing order from KDS:", data.order.orderNumber);
				// Remove from list immediately using orderNumber for safer comparison
				setOrders((prev) => {
					const filtered = prev.filter(
						(o) => o.orderNumber !== data.order.orderNumber
					);
					console.log(
						`🗑️ Removed ${data.order.orderNumber}. Count: ${prev.length} → ${filtered.length}`
					);
					return filtered;
				});
			} else {
				// Refresh to show status change
				fetchOrders();
			}
		};

		onOrderAccepted(handleOrderAccepted);
		onOrderStatusUpdate(handleStatusUpdate);

		return () => {
			// Cleanup if needed
		};
	}, []);

	const fetchOrders = async () => {
		try {
			setLoading(true);
			// Fetch all orders without status filter to get accurate counts
			const response = await orderService.getOrders({});
			if (response.success && response.data) {
				// Filter to show only accepted, preparing, and ready orders
				const filteredOrders = response.data.filter((order) =>
					["accepted", "preparing", "ready"].includes(order.status)
				);
				setOrders(filteredOrders);
			}
		} catch (err: any) {
			setError(err.message || "Failed to fetch orders");
		} finally {
			setLoading(false);
		}
	};

	const handleStatusChange = async (
		orderId: string,
		newStatus: "preparing" | "ready"
	) => {
		try {
			const response = await orderService.updateOrderStatus(orderId, newStatus);
			if (response.success) {
				// Play sound notification
				playNotificationSound();
				// Refresh orders
				fetchOrders();
			}
		} catch (err: any) {
			alert(err.message || "Failed to update order status");
		}
	};

	const playNotificationSound = () => {
		// Simple beep sound (can be replaced with actual audio file)
		const audioContext = new (window.AudioContext ||
			(window as any).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		oscillator.frequency.value = 800;
		oscillator.type = "sine";

		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			audioContext.currentTime + 0.5
		);

		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.5);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "accepted":
				return "bg-blue-500 text-white";
			case "preparing":
				return "bg-orange-500 text-white";
			case "ready":
				return "bg-green-500 text-white";
			default:
				return "bg-gray-500 text-white";
		}
	};

	const getTimeSinceCreated = (createdAt: string) => {
		const now = new Date().getTime();
		const created = new Date(createdAt).getTime();
		const diffMinutes = Math.floor((now - created) / 60000);
		return diffMinutes;
	};

	const isOverdue = (createdAt: string, prepTime: number = 15) => {
		const minutes = getTimeSinceCreated(createdAt);
		return minutes > prepTime;
	};

	const formatTime = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (loading && orders.length === 0) {
		return (
			<div className="min-h-screen bg-gray-900 flex items-center justify-center">
				<div className="text-3xl font-bold text-white">
					Loading Kitchen Display...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			<div className="container mx-auto px-4 py-6">
				{/* Header */}
				<div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
					<div className="flex items-center gap-3">
						<h1 className="text-3xl md:text-4xl font-bold text-center md:text-left">
							🍳 Kitchen Display System
						</h1>
						<div className="flex items-center gap-2">
							<div
								className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
									}`}
							></div>
							<span className="text-sm text-gray-400">
								{isConnected ? "Live" : "Offline"}
							</span>
						</div>
					</div>
					<div className="text-center md:text-right">
						<p className="text-xl md:text-2xl font-bold">
							{new Date().toLocaleTimeString()}
						</p>
						<p className="text-sm text-gray-400">
							{
								orders.filter((o) =>
									filter === "all" ? true : o.status === filter
								).length
							}{" "}
							Active Orders
						</p>
					</div>
				</div>

				{error && (
					<div className="bg-red-600 text-white px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				{/* Filter Tabs */}
				<div className="mb-6 flex flex-wrap gap-2">
					<button
						onClick={() => setFilter("accepted")}
						className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold transition-all text-sm md:text-lg ${filter === "accepted"
								? "bg-blue-600 shadow-lg scale-105"
								: "bg-gray-700 hover:bg-gray-600"
							}`}
					>
						🆕 New ({orders.filter((o) => o.status === "accepted").length})
					</button>
					<button
						onClick={() => setFilter("preparing")}
						className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold transition-all text-sm md:text-lg ${filter === "preparing"
								? "bg-orange-600 shadow-lg scale-105"
								: "bg-gray-700 hover:bg-gray-600"
							}`}
					>
						🔥 Preparing (
						{orders.filter((o) => o.status === "preparing").length})
					</button>
					<button
						onClick={() => setFilter("all")}
						className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold transition-all text-sm md:text-lg ${filter === "all"
								? "bg-purple-600 shadow-lg scale-105"
								: "bg-gray-700 hover:bg-gray-600"
							}`}
					>
						📋 All ({orders.length})
					</button>
				</div>

				{/* Orders Grid */}
				{orders.length === 0 ? (
					<div className="text-center py-20">
						<p className="text-3xl text-gray-400">No orders in queue</p>
						<p className="text-gray-500 mt-2">New orders will appear here</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{orders
							.filter((o) => (filter === "all" ? true : o.status === filter))
							.map((order) => {
								const minutesSinceCreated = getTimeSinceCreated(
									order.createdAt
								);
								const overdue = isOverdue(order.createdAt);

								return (
									<div
										key={order._id}
										className={`bg-gray-800 rounded-xl p-4 border-4 ${overdue
												? "border-red-500 animate-pulse"
												: "border-gray-700"
											} hover:shadow-2xl transition-all`}
									>
										{/* Header */}
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="text-2xl font-bold">
													{order.orderNumber}
												</h3>
												<p className="text-lg text-gray-300">
													Table {order.tableId.tableNumber}
												</p>
											</div>
											<span
												className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
													order.status
												)}`}
											>
												{order.status.toUpperCase()}
											</span>
										</div>

										{/* Timer */}
										<div
											className={`mb-3 p-2 rounded ${overdue ? "bg-red-900" : "bg-gray-700"
												}`}
										>
											<p
												className={`text-center font-bold text-lg ${overdue ? "text-red-300" : "text-white"
													}`}
											>
												⏱️ {minutesSinceCreated} min
												{overdue && " - OVERDUE!"}
											</p>
											<p className="text-xs text-center text-gray-400">
												Started: {formatTime(order.createdAt)}
											</p>
										</div>

										{/* Items */}
										<div className="mb-4 bg-gray-900 p-3 rounded max-h-64 overflow-y-auto">
											<p className="font-bold mb-2 text-yellow-400">
												Items ({order.items.length}):
											</p>
											<ul className="space-y-2">
												{order.items.map((item, idx) => (
													<li
														key={idx}
														className={`border-b pb-2 ${item.status === 'served' || item.status === 'ready'
																? 'border-gray-700 opacity-50'
																: 'border-yellow-500'
															}`}
													>
														<div className="flex items-start justify-between">
															<p className={`font-semibold text-lg ${item.status === 'served' || item.status === 'ready'
																	? 'text-gray-500 line-through'
																	: 'text-white'
																}`}>
																{item.quantity}x {item.name}
															</p>
															{(item.status === 'served' || item.status === 'ready') && (
																<span className="text-green-500 text-xl">✅</span>
															)}
															{item.status === 'pending' && (
																<span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">NEW</span>
															)}
														</div>
														{item.modifiers && item.modifiers.length > 0 && (
															<div className="ml-4 mt-1">
																{item.modifiers.map((modifier, mIdx) => (
																	<p
																		key={mIdx}
																		className="text-sm text-gray-400"
																	>
																		+ {modifier.name}:{" "}
																		{modifier.options
																			.map((opt) => opt.name)
																			.join(", ")}
																	</p>
																))}
															</div>
														)}
														{item.specialInstructions && (
															<p className="text-sm text-yellow-300 mt-1">
																📝 {item.specialInstructions}
															</p>
														)}
													</li>
												))}
											</ul>
										</div>

										{/* Order Notes */}
										{order.orderNotes && (
											<div className="mb-4 bg-yellow-900 p-2 rounded">
												<p className="text-sm text-yellow-200">
													📝 {order.orderNotes}
												</p>
											</div>
										)}

										{/* Actions */}
										<div className="space-y-2">
											{order.status === "accepted" && (
												<button
													onClick={() =>
														handleStatusChange(order._id, "preparing")
													}
													className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
												>
													🔥 Start Preparing
												</button>
											)}
											{order.status === "preparing" && (
												<button
													onClick={() => handleStatusChange(order._id, "ready")}
													className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition-all hover:scale-105"
												>
													✅ Mark Ready
												</button>
											)}
											{order.status === "ready" && (
												<div className="w-full bg-green-500 text-white py-3 rounded-lg font-bold text-lg text-center">
													✅ READY FOR PICKUP
												</div>
											)}
										</div>
									</div>
								);
							})}
					</div>
				)}
			</div>
		</div>
	);
}

export default KDS;
