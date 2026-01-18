import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import orderService from '../../services/orderService';

const OrderStatus: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId: urlOrderId } = useParams<{ orderId: string }>();

    // Get table_id from query params
    const searchParams = new URLSearchParams(location.search);
    const tableIdFromQuery = searchParams.get('table_id');

    // Priority: URL param > location.state
    const orderId = urlOrderId || location.state?.orderId;
    const orderNumber = location.state?.orderNumber;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [needsAssistance, setNeedsAssistance] = useState(false);

    const statusSteps = [
        {
            id: 'pending',
            title: 'Order Received',
            description: 'Your order has been received',
            icon: '📝',
        },
        {
            id: 'accepted',
            title: 'Order Confirmed',
            description: 'Your order is being prepared in the kitchen',
            icon: '👨‍🍳',
        },
        {
            id: 'preparing',
            title: 'Preparing',
            description: 'Chef is working on your order',
            icon: '🔥',
        },
        {
            id: 'ready',
            title: 'Ready to Serve',
            description: 'Your order is ready! Server will bring it to your table',
            icon: '🍽️',
        },
        {
            id: 'served',
            title: 'Served',
            description: 'Enjoy your meal!',
            icon: '✨',
        }
    ];

    // Load order and setup Socket.IO listener
    useEffect(() => {
        // If we have neither orderId nor table_id, show error
        if (!orderId && !tableIdFromQuery) {
            setError('No order ID provided');
            setLoading(false);
            return;
        }

        loadOrder();

        const socket = orderService.initSocket();

        // Join order room
        orderService.joinOrderRoom(orderId);

        // Listen to real-time order status updates
        socket.on('order:statusUpdate', (data: any) => {
            console.log('📡 Order updated:', data);

            if (data.order && data.order._id === orderId) {
                // Check if order was fully rejected
                if (data.order.status === 'rejected') {
                    toast.error('Your order has been rejected by the waiter', {
                        position: 'top-center',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });

                    // Navigate back to menu after a short delay
                    setTimeout(() => {
                        navigate('/menu', {
                            state: {
                                message: 'Your order was rejected. Please order again.'
                            }
                        });
                    }, 3000);
                    return;
                }

                setOrder(data.order);
            }
        });

        // Listen for partial rejection events
        socket.on('order:partialRejection', (data: any) => {
            console.log('⚠️ Partial rejection received:', data);
            console.log('📦 Order items:', data.order?.items);
            console.log('🔍 Item statuses:', data.order?.items?.map((item: any) => ({
                name: item.name,
                status: item.status
            })));

            if (data.order && data.order._id === orderId) {
                const rejectedCount = data.rejectedItems?.length || 0;

                toast.warning(`${rejectedCount} item(s) from your order were rejected`, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });

                setOrder(data.order);
                console.log('✅ Order state updated with:', data.order);
            }
        });

        // Cleanup on unmount
        return () => {
            socket.off('order:statusUpdate');
            socket.off('order:partialRejection');
            orderService.disconnect();
        };
    }, [orderId]);

    // Timer for elapsed time
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError(null);

            let response;
            if (orderId) {
                // Fetch specific order by ID
                response = await orderService.getOrder(orderId);
            } else if (tableIdFromQuery) {
                // Fetch latest ACTIVE order for table (not completed/rejected)
                const ordersResponse = await orderService.getOrders({
                    tableId: tableIdFromQuery,
                    // Don't filter by status in query - we'll filter client-side to get most recent active
                });

                if (!ordersResponse.success || !ordersResponse.data || ordersResponse.data.length === 0) {
                    throw new Error('No orders found for this table');
                }

                // Filter for active orders (not completed/rejected AND not paid)
                const activeOrders = ordersResponse.data.filter((order: any) => {
                    // Exclude completed, rejected, or cancelled orders
                    if (['completed', 'rejected', 'cancelled'].includes(order.status)) {
                        return false;
                    }
                    // Exclude orders that have been paid
                    if (['paid', 'completed'].includes(order.paymentStatus)) {
                        return false;
                    }
                    return true;
                });

                if (activeOrders.length === 0) {
                    // No active orders - show error instead of old order
                    throw new Error('No active orders for this table. Please place a new order.');
                }

                // Get the most recent active order (already sorted by createdAt desc from backend)
                const latestActiveOrder = activeOrders[0];
                response = {
                    success: true,
                    data: latestActiveOrder
                };

                console.log(`📋 Found ${activeOrders.length} active orders for table`);
            } else {
                throw new Error('No order ID or table ID provided');
            }

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to load order');
            }

            setOrder(response.data);

            // Join table room if tableId exists
            if (response.data.tableId) {
                const tableId = typeof response.data.tableId === 'object'
                    ? response.data.tableId._id
                    : response.data.tableId;
                orderService.joinTableRoom(tableId);
                console.log('🪑 Joined table room for real-time updates');
            }
        } catch (err: any) {
            console.error('Load order error:', err);
            setError(err.message || 'Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCallWaiter = () => {
        setNeedsAssistance(true);
        // TODO: Send notification to waiter via Socket.IO
        setTimeout(() => {
            setNeedsAssistance(false);
        }, 3000);
    };

    const handleViewReceipt = () => {
        // Debug: Log all item statuses
        console.log('🧾 View Receipt clicked');
        console.log('📋 Order items:', order.items.map((item: any) => ({
            name: item.name,
            status: item.status
        })));

        // Check if any items are rejected
        const hasRejectedItems = order.items.some((item: any) => item.status === 'rejected');
        if (hasRejectedItems) {
            console.log('❌ Blocked: Has rejected items');
            toast.error('Cannot proceed to payment. Some items in your order were rejected.', {
                position: 'top-center',
                autoClose: 5000,
            });
            return;
        }

        // Check if items are still being prepared (pending or preparing)
        // Allow payment when items are 'ready' or 'served'
        const hasIncompleteItems = order.items.some((item: any) => 
            item.status === 'pending' || item.status === 'preparing'
        );
        if (hasIncompleteItems) {
            console.log('⏳ Blocked: Has incomplete items (pending/preparing)');
            toast.warning('Please wait until all items are ready before requesting the bill.', {
                position: 'top-center',
                autoClose: 5000,
            });
            return;
        }

        // Check if order status is appropriate for payment
        if (order.status === 'rejected' || order.status === 'cancelled') {
            console.log('❌ Blocked: Order is rejected or cancelled');
            toast.error('This order cannot be paid. Please contact staff for assistance.', {
                position: 'top-center',
                autoClose: 5000,
            });
            return;
        }

        console.log('✅ Payment allowed, navigating to payment page');
        navigate('/payment', {
            state: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                order: order
            }
        });
    };

    const handleBackToMenu = () => {
        navigate('/menu');
    };

    const handleHome = () => {
        navigate('/');
    };

    const getCurrentStatusIndex = () => {
        if (!order) return 0;
        return statusSteps.findIndex(step => step.id === order.status);
    };

    const getStepCompleted = (stepId: string) => {
        if (!order) return false;
        const currentIndex = getCurrentStatusIndex();
        const stepIndex = statusSteps.findIndex(s => s.id === stepId);
        return stepIndex <= currentIndex;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading order...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center px-4">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Order</h2>
                    <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
                    <button
                        onClick={loadOrder}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mr-2"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={handleBackToMenu}
                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    const currentStatus = order.status;
    const isCompleted = currentStatus === 'completed' || currentStatus === 'served';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                        <button
                            onClick={handleBackToMenu}
                            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                            title="Back to Menu"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Order Status</h1>
                            <p className="text-sm text-gray-600">#{order.orderNumber}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">
                            {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Takeout'}
                        </p>
                        <p className="text-xs text-gray-500">{formatTime(elapsedTime)} elapsed</p>
                    </div>
                </div>
            </div>

            <div className="pb-6">
                {/* Status Progress */}
                <div className="bg-white px-4 py-6 border-b border-gray-200">
                    {!isCompleted && (
                        <div className="text-center mb-6">
                            <div className="text-3xl mb-2">
                                {statusSteps[getCurrentStatusIndex()]?.icon}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                                {statusSteps[getCurrentStatusIndex()]?.title}
                            </h2>
                            <p className="text-gray-600 mb-3">
                                {statusSteps[getCurrentStatusIndex()]?.description}
                            </p>
                            {order.estimatedTime && order.estimatedTime > 0 && (
                                <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Est. {order.estimatedTime} min
                                </div>
                            )}
                        </div>
                    )}

                    {/* Progress Steps */}
                    <div className="space-y-4">
                        {statusSteps.map((step, index) => {
                            const isStepCompleted = getStepCompleted(step.id);
                            const isCurrentStep = step.id === currentStatus;

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isStepCompleted
                                        ? 'bg-green-500 text-white'
                                        : isCurrentStep
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {isStepCompleted ? '✓' : index + 1}
                                    </div>

                                    <div className="ml-4 flex-1">
                                        <p className={`font-medium ${isStepCompleted || isCurrentStep ? 'text-gray-900' : 'text-gray-500'
                                            }`}>
                                            {step.title}
                                        </p>
                                        <p className={`text-sm ${isStepCompleted || isCurrentStep ? 'text-gray-600' : 'text-gray-400'
                                            }`}>
                                            {step.description}
                                        </p>
                                    </div>

                                    {isCurrentStep && !isCompleted && (
                                        <div className="ml-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Order</h3>
                    <div className="space-y-3">
                        {order.items.map((item: any, index: number) => {
                            const isRejected = item.status === 'rejected';
                            console.log(`🍽️ Rendering item: ${item.name}, status: ${item.status}, isRejected: ${isRejected}`);

                            return (
                                <div key={index} className={`flex justify-between items-start ${isRejected ? 'opacity-60' : ''}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <span className={`font-medium ${isRejected ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                {item.name}
                                            </span>
                                            <span className={`ml-2 ${isRejected ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                                                × {item.quantity}
                                            </span>
                                            {isRejected && (
                                                <span className="ml-2 text-red-500 font-bold" title="Item rejected">
                                                    ❌
                                                </span>
                                            )}
                                        </div>
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <p className={`text-sm mt-1 ${isRejected ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                                                {item.modifiers.map((mod: any) =>
                                                    mod.options.map((opt: any) => opt.name).join(', ')
                                                ).join(', ')}
                                            </p>
                                        )}
                                        {item.specialInstructions && (
                                            <p className={`text-xs italic mt-1 ${isRejected ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                                                Note: {item.specialInstructions}
                                            </p>
                                        )}
                                        {isRejected && item.rejectionReason && (
                                            <p className="text-xs text-red-600 mt-1 italic">
                                                Reason: {item.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`font-medium ${isRejected ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                        ${item.subtotal.toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}

                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 py-6 space-y-3">
                    <button
                        onClick={handleCallWaiter}
                        disabled={needsAssistance}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors ${needsAssistance
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                    >
                        {needsAssistance ? (
                            <div className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Waiter Notified
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Need Assistance?
                            </div>
                        )}
                    </button>

                    <button
                        onClick={handleViewReceipt}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        View Receipt
                    </button>

                    <button
                        onClick={handleBackToMenu}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Order More Items
                    </button>
                </div>

                {/* Completion Message */}
                {isCompleted && (
                    <div className="mx-4 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-center">
                            <div className="text-4xl mb-3">🎉</div>
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                                Enjoy your meal!
                            </h3>
                            <p className="text-green-700 text-sm">
                                Thank you for dining with us. We hope you enjoy your food!
                            </p>
                        </div>
                    </div>
                )}

                {/* Restaurant Info */}
                <div className="mx-4 mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="text-center">
                        <h4 className="font-semibold text-gray-900 mb-1">Smart Restaurant</h4>
                        <p className="text-sm text-gray-600 mb-2">123 Food Street, City Center</p>
                        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                            <span>📞 (555) 123-4567</span>
                            <span>⭐ 4.8 rating</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatus;