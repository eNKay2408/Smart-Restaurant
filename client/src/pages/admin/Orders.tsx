import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import orderService from "../../services/orderService";
import { useSocket } from "../../hooks/useSocket";
import type { Order } from "../../types/order.types";
import { toast } from "react-toastify";
import AdminLayout from "../../components/AdminLayout";

// Extended types for admin view
interface ExtendedOrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    modifiers?: Array<{
        name: string;
        options: Array<{
            name: string;
            priceAdjustment: number;
        }>;
    }>;
    specialInstructions?: string;
    status?: "pending" | "preparing" | "ready" | "served" | "rejected";
    subtotal: number;
}

interface ExtendedOrder extends Omit<Order, 'items' | 'paymentStatus'> {
    items: ExtendedOrderItem[];
    paymentStatus?: "pending" | "pending_cash" | "paid" | "completed" | "failed" | "refunded";
}

function AdminOrders() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState<ExtendedOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Get initial filter from URL or default to "pending"
    const initialFilter = (searchParams.get("filter") as "all" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed") || "pending";
    const [filter, setFilter] = useState<
        "all" | "pending" | "accepted" | "preparing" | "ready" | "served" | "completed"
    >(initialFilter);

    // Update URL when filter changes
    useEffect(() => {
        setSearchParams({ filter }, { replace: true });
    }, [filter, setSearchParams]);

    // Get user from localStorage to get restaurantId
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const restaurantId = user?.restaurantId || "";

    // Socket.IO real-time connection (use waiter role for order monitoring)
    const { socket } = useSocket({
        role: "waiter",
        restaurantId: restaurantId,
        autoConnect: true,
    });

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await orderService.getOrders({});
            if (response.success && response.data) {
                console.log('📋 Admin: Fetched orders:', response.data.length);
                setOrders(response.data as ExtendedOrder[]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch orders on mount and filter change
    useEffect(() => {
        fetchOrders();
    }, [filter, fetchOrders]);

    // Set up real-time listeners
    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Setting up admin Socket.IO listeners');

        const handleNewOrder = (data: any) => {
            console.log("🔔 New order received:", data);
            toast.info(`New order from Table ${data.order?.tableId?.tableNumber}!`, {
                autoClose: 5000,
            });
            // Call orderService.getOrders directly to avoid dependency on fetchOrders
            orderService.getOrders({}).then(response => {
                if (response.success && response.data) {
                    setOrders(response.data as ExtendedOrder[]);
                }
            });
        };

        const handleStatusUpdate = (data: any) => {
            console.log("📢 Order status updated:", data);
            orderService.getOrders({}).then(response => {
                if (response.success && response.data) {
                    setOrders(response.data as ExtendedOrder[]);
                }
            });
        };

        const handlePaymentCompleted = (data: any) => {
            console.log("✅ Payment completed:", data);
            orderService.getOrders({}).then(response => {
                if (response.success && response.data) {
                    setOrders(response.data as ExtendedOrder[]);
                }
            });
        };

        // Register all listeners
        socket.on("order:new", handleNewOrder);
        socket.on("order:statusUpdate", handleStatusUpdate);
        socket.on("payment:completed", handlePaymentCompleted);

        console.log('✅ Admin listeners registered');

        return () => {
            console.log('🔌 Cleaning up admin listeners');
            socket.off("order:new", handleNewOrder);
            socket.off("order:statusUpdate", handleStatusUpdate);
            socket.off("payment:completed", handlePaymentCompleted);
        };
    }, [socket]); // Removed fetchOrders to prevent re-registration

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "accepted":
                return "bg-blue-100 text-blue-800";
            case "preparing":
                return "bg-purple-100 text-purple-800";
            case "ready":
                return "bg-orange-100 text-orange-800";
            case "served":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Filter orders based on selected tab
    const filteredOrders = orders.filter((o) => {
        if (filter === "all") return true;
        // Map "accepted" to "new order" for display purposes
        if (filter === "accepted") return o.status === "accepted";
        return o.status === filter;
    });

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-2xl font-semibold text-purple-600">
                        Loading orders...
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        📋 Order Monitoring
                    </h1>
                    <p className="text-gray-600 mt-1">View all orders in real-time (Read-only)</p>
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
                        onClick={() => setFilter("accepted")}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "accepted"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        🆕 New Order ({orders.filter((o) => o.status === "accepted").length})
                    </button>
                    <button
                        onClick={() => setFilter("preparing")}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "preparing"
                            ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        🔥 Preparing ({orders.filter((o) => o.status === "preparing").length})
                    </button>
                    <button
                        onClick={() => setFilter("served")}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "served"
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        🍽️ Served ({orders.filter((o) => o.status === "served").length})
                    </button>
                    <button
                        onClick={() => setFilter("completed")}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "completed"
                            ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        💯 Completed ({orders.filter((o) => o.status === "completed").length})
                    </button>
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${filter === "all"
                            ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        📊 All ({orders.length})
                    </button>
                </div>

                {/* Orders Grid */}
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600">No orders found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredOrders.map((order) => (
                            <div
                                key={order._id}
                                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-purple-500"
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
                                            {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                            order.status
                                        )}`}
                                    >
                                        {order.status === "accepted" ? "NEW ORDER" : order.status.toUpperCase()}
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
                                        {order.items.map((item, idx) => {
                                            const isRejected = item.status === 'rejected';
                                            const isCompleted = ['served', 'ready', 'completed'].includes(item.status || '');

                                            return (
                                                <li key={idx} className={`text-sm flex items-center justify-between gap-2 ${isRejected
                                                    ? 'text-gray-400 line-through opacity-60'
                                                    : isCompleted
                                                        ? 'text-gray-600'
                                                        : 'text-gray-900 font-semibold'
                                                    }`}>
                                                    <span>• {item.quantity}x {item.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        {item.status === 'pending' && (
                                                            <span className="bg-yellow-500 text-white text-xs px-1 rounded">NEW</span>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="text-green-600">✅</span>
                                                        )}
                                                        {isRejected && (
                                                            <span className="text-red-500 font-bold" title="Rejected">❌</span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
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
                                    {order.paymentStatus && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Payment: {order.paymentStatus === 'pending' ? '⏳ Pending' :
                                                order.paymentStatus === 'pending_cash' ? '💵 Cash Requested' :
                                                    order.paymentStatus === 'completed' ? '✅ Completed' :
                                                        order.paymentStatus}
                                        </p>
                                    )}
                                </div>

                                {/* Status Info - Read Only */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-600 text-center">
                                        {order.status === "pending" && "⏳ Waiting for waiter to accept"}
                                        {order.status === "accepted" && "🆕 New order - Waiting for kitchen"}
                                        {order.status === "preparing" && "🔥 Kitchen is preparing"}
                                        {order.status === "ready" && "✅ Ready - Waiting to be served"}
                                        {order.status === "served" && "🍽️ Served - Waiting for payment"}
                                        {order.status === "completed" && "💯 Order completed"}
                                        {order.status === "rejected" && order.rejectionReason && (
                                            <span className="block mt-1 text-red-600">
                                                ❌ Rejected: {order.rejectionReason}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

export default AdminOrders;
