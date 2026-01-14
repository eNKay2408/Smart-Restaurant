import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../../services/orderService';
import { authService } from '../../services/authService';

interface Order {
    _id: string;
    orderNumber: string;
    tableId: {
        tableNumber: number;
        area?: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        subtotal: number;
        modifiers?: Array<{
            name: string;
            options: Array<{ name: string }>;
        }>;
    }>;
    status: string;
    total: number;
    paymentStatus: string;
    createdAt: string;
}

const OrderHistory: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
    const [billModal, setBillModal] = useState<{ show: boolean; order: Order | null }>({ show: false, order: null });

    useEffect(() => {
        fetchOrderHistory();
    }, [filter]);

    const fetchOrderHistory = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get logged-in customer ID
            const user = authService.getCurrentUser();
            if (!user || user.role !== 'customer') {
                setError('Please login as customer to view order history');
                setLoading(false);
                return;
            }

            const customerId = user.id || user._id;

            // Fetch orders for this customer
            const params: any = { customerId };
            if (filter === 'completed') {
                params.status = 'completed';
            } else if (filter === 'pending') {
                params.status = 'pending,accepted,preparing,ready,served';
            }

            const response = await orderService.getOrders(params);

            if (response.success && response.data) {
                setOrders(response.data);
            } else {
                setError('Failed to fetch order history');
            }
        } catch (err: any) {
            console.error('Fetch orders error:', err);
            setError(err.message || 'Failed to fetch order history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            accepted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Accepted' },
            preparing: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Preparing' },
            ready: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
            served: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Served' },
            completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewOrder = (order: Order) => {
        // If completed, show bill modal instead of navigating
        if (order.status === 'completed') {
            setBillModal({ show: true, order });
        } else {
            navigate(`/order-status/${order._id}`);
        }
    };

    const handleCloseBillModal = () => {
        setBillModal({ show: false, order: null });
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading order history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center px-4">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/menu')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">Order History</h1>
                        <p className="text-sm text-gray-600">{orders.length} orders</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="pb-6">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-16">
                        <div className="text-8xl mb-6">📋</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-600 text-center mb-8 max-w-sm">
                            When you place orders, they will appear here
                        </p>
                        <button
                            onClick={() => navigate('/menu')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                onClick={() => handleViewOrder(order)}
                                className="bg-white px-4 py-6 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                {/* Order Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {order.orderNumber}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Table {order.tableId?.tableNumber}
                                            {order.tableId?.area && ` • ${order.tableId.area}`}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(order.status)}
                                        <p className="text-lg font-bold text-gray-900 mt-2">
                                            ${order.total.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Order Items Preview */}
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}:
                                    </p>
                                    <div className="space-y-1">
                                        {order.items.slice(0, 2).map((item, idx) => (
                                            <p key={idx} className="text-sm text-gray-600">
                                                • {item.quantity}x {item.name}
                                            </p>
                                        ))}
                                        {order.items.length > 2 && (
                                            <p className="text-sm text-gray-500 italic">
                                                +{order.items.length - 2} more items...
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* View Details Arrow */}
                                <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                                    <span>View details</span>
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bill Modal */}
            {billModal.show && billModal.order && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className=" top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900">Order Receipt</h2>
                            <button
                                onClick={handleCloseBillModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Bill Content */}
                        <div className="px-6 py-4">
                            {/* Order Info */}
                            <div className="text-center mb-6 pb-4 border-b border-gray-200">
                                <p className="text-2xl font-bold text-gray-900 mb-1">{billModal.order.orderNumber}</p>
                                <p className="text-sm text-gray-600">
                                    Table {billModal.order.tableId?.tableNumber}
                                    {billModal.order.tableId?.area && ` • ${billModal.order.tableId.area}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(billModal.order.createdAt)}</p>
                            </div>

                            {/* Items List */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Items Ordered</h3>
                                <div className="space-y-3">
                                    {billModal.order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {item.quantity}x {item.name}
                                                </p>
                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {item.modifiers.map(mod =>
                                                            mod.options.map(opt => opt.name).join(', ')
                                                        ).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="font-medium text-gray-900 ml-4">
                                                ${item.subtotal.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${billModal.order.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                                    <span>Total</span>
                                    <span>${billModal.order.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
                                <p className="text-sm text-green-800 font-medium">✓ Order Completed</p>
                                <p className="text-xs text-green-600 mt-1">Thank you for your visit!</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl space-y-2">
                            <button
                                onClick={() => {
                                    handleCloseBillModal();
                                    navigate(`/review/${billModal.order._id}`);
                                }}
                                className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Leave a Review
                            </button>
                            <button
                                onClick={handleCloseBillModal}
                                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
