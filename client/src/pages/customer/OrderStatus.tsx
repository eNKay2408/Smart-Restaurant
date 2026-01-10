import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import orderService from '../../services/orderService';

const OrderStatus: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId: urlOrderId } = useParams<{ orderId: string }>();

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
        if (!orderId) {
            setError('No order ID provided');
            setLoading(false);
            return;
        }

        loadOrder();

        // Listen to real-time order status updates
        orderService.onOrderStatusUpdate(orderId, (updatedOrder) => {
            console.log('📡 Order updated:', updatedOrder);
            setOrder(updatedOrder);
        });

        // Cleanup on unmount
        return () => {
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
            const response = await orderService.getOrder(orderId);

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to load order');
            }

            setOrder(response.data);
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
                            onClick={handleHome}
                            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                        {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{item.name}</span>
                                        <span className="ml-2 text-gray-500">× {item.quantity}</span>
                                    </div>
                                    {item.modifiers && item.modifiers.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {item.modifiers.map((mod: any) =>
                                                mod.options.map((opt: any) => opt.name).join(', ')
                                            ).join(', ')}
                                        </p>
                                    )}
                                    {item.specialInstructions && (
                                        <p className="text-xs text-gray-500 italic mt-1">
                                            Note: {item.specialInstructions}
                                        </p>
                                    )}
                                </div>
                                <span className="font-medium text-gray-900">${item.subtotal.toFixed(2)}</span>
                            </div>
                        ))}

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