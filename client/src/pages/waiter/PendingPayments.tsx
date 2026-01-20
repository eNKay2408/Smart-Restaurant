import React, { useState, useEffect } from 'react';
import orderService from '../../services/orderService';
import { toast } from 'react-toastify';
import { API_URL } from '../../config/constants';

interface PendingPayment {
    _id: string;
    orderNumber: string;
    tableId: {
        _id: string;
        tableNumber: number;
        area?: string;
    };
    total: number;
    customerId?: {
        fullName: string;
    };
    guestName?: string;
    createdAt: string;
}

const PendingPayments: React.FC = () => {
    const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Load pending cash payments
    const loadPendingPayments = async () => {
        try {
            setLoading(true);
            const response = await orderService.getOrders({
                paymentStatus: 'pending_cash',
            });

            if (response.success) {
                setPendingPayments(response.data || []);
            }
        } catch (error: any) {
            console.error('Error loading pending payments:', error);
            toast.error('Failed to load pending payments');
        } finally {
            setLoading(false);
        }
    };

    // Listen for real-time updates
    useEffect(() => {
        loadPendingPayments();

        // Initialize Socket.IO
        const socket = orderService.initSocket();

        // Create handler functions
        const handleCashRequested = (data: any) => {
            console.log('💵 New cash payment request:', data);
            toast.info(`Table ${data.order?.tableId?.tableNumber} requests cash payment`);
            // Call API directly to avoid stale closure
            orderService.getOrders({ paymentStatus: 'pending_cash' }).then(response => {
                if (response.success) {
                    setPendingPayments(response.data || []);
                }
            });
        };

        const handlePaymentCompleted = (data: any) => {
            console.log('✅ Payment completed:', data);
            orderService.getOrders({ paymentStatus: 'pending_cash' }).then(response => {
                if (response.success) {
                    setPendingPayments(response.data || []);
                }
            });
        };

        // Listen for new cash payment requests
        socket.on('payment:cashRequested', handleCashRequested);

        // Listen for payment completed
        socket.on('payment:completed', handlePaymentCompleted);

        return () => {
            socket.off('payment:cashRequested', handleCashRequested);
            socket.off('payment:completed', handlePaymentCompleted);
        };
    }, []);

    // Confirm cash payment
    const handleConfirmPayment = async (orderId: string, total: number) => {
        if (!window.confirm(`Confirm cash payment of $${total.toFixed(2)}?`)) {
            return;
        }

        setConfirmingId(orderId);

        try {
            const response = await fetch(`${API_URL}/orders/${orderId}/confirm-cash-payment`, {
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
                toast.success('✅ Payment confirmed successfully!');
                loadPendingPayments();
            } else {
                throw new Error(data.message || 'Failed to confirm payment');
            }
        } catch (error: any) {
            console.error('Confirm payment error:', error);
            toast.error(error.message || 'Failed to confirm payment');
        } finally {
            setConfirmingId(null);
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Pending Cash Payments</h2>
                <p className="text-gray-600 mt-1">
                    Tables waiting for cash payment confirmation
                </p>
            </div>

            {pendingPayments.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">💵</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No Pending Payments
                    </h3>
                    <p className="text-gray-600">
                        All cash payments have been processed
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingPayments.map((payment) => (
                        <div
                            key={payment._id}
                            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                                            Table {payment.tableId?.tableNumber}
                                            {payment.tableId?.area && ` - ${payment.tableId.area}`}
                                        </div>
                                        <span className="text-gray-500 text-sm">
                                            {formatTimeAgo(payment.createdAt)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>Order #{payment.orderNumber}</span>
                                        <span>•</span>
                                        <span>
                                            {payment.customerId?.fullName || payment.guestName || 'Guest'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600">Amount</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            ${payment.total.toFixed(2)}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleConfirmPayment(payment._id, payment.total)}
                                        disabled={confirmingId === payment._id}
                                        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${confirmingId === payment._id
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {confirmingId === payment._id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </div>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-5 h-5 inline mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                Confirm Payment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            {pendingPayments.length > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="font-semibold">
                                {pendingPayments.length} table{pendingPayments.length > 1 ? 's' : ''} waiting
                            </span>
                        </div>
                        <div className="text-blue-800 font-bold text-lg">
                            Total: $
                            {pendingPayments.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingPayments;
