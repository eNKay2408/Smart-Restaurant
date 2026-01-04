import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface KDSOrder {
    id: string;
    orderNumber: string;
    table: number;
    items: KDSOrderItem[];
    status: 'pending' | 'preparing' | 'ready' | 'completed';
    time: string;
    elapsed: number;
    notes?: string;
}

interface KDSOrderItem {
    name: string;
    quantity: number;
    modifications?: string;
    completed: boolean;
}

const AdminKDS: React.FC = () => {
    const [orders, setOrders] = useState<KDSOrder[]>([
        {
            id: '1045',
            orderNumber: '#1045',
            table: 5,
            items: [
                { name: 'Grilled Salmon', quantity: 2, modifications: 'Large, No onions', completed: false },
                { name: 'Caesar Salad', quantity: 1, modifications: undefined, completed: false }
            ],
            status: 'preparing',
            time: '12:30 PM',
            elapsed: 8
        },
        {
            id: '1046',
            orderNumber: '#1046',
            table: 3,
            items: [
                { name: 'Caesar Salad', quantity: 1, modifications: undefined, completed: true },
                { name: 'Pasta Carbonara', quantity: 1, modifications: undefined, completed: false }
            ],
            status: 'preparing',
            time: '12:25 PM',
            elapsed: 3
        },
        {
            id: '1047',
            orderNumber: '#1047',
            table: 8,
            items: [
                { name: 'Beef Steak', quantity: 2, modifications: 'Medium rare', completed: false },
                { name: 'Mushroom Soup', quantity: 1, modifications: undefined, completed: false }
            ],
            status: 'pending',
            time: '12:35 PM',
            elapsed: 15
        },
        {
            id: '1048',
            orderNumber: '#1048',
            table: 2,
            items: [
                { name: 'Chocolate Cake', quantity: 1, modifications: undefined, completed: false }
            ],
            status: 'pending',
            time: '12:38 PM',
            elapsed: 1
        },
        {
            id: '1049',
            orderNumber: '#1049',
            table: 1,
            items: [
                { name: 'Orange Juice', quantity: 2, modifications: undefined, completed: false },
                { name: 'Coffee', quantity: 1, modifications: undefined, completed: false }
            ],
            status: 'pending',
            time: '12:40 PM',
            elapsed: 0
        }
    ]);

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        preparing: 0,
        ready: 0,
        completedToday: 45
    });

    useEffect(() => {
        // Update stats whenever orders change
        const newStats = {
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            completedToday: 45
        };
        setStats(newStats);
    }, [orders]);

    useEffect(() => {
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            // Update elapsed time for all orders
            setOrders(prevOrders => 
                prevOrders.map(order => ({
                    ...order,
                    elapsed: order.elapsed + 0.5
                }))
            );
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'border-yellow-400',
            preparing: 'border-blue-400',
            ready: 'border-green-400',
            completed: 'border-gray-400'
        };
        return colors[status as keyof typeof colors] || 'border-gray-400';
    };

    const getTimeColor = (elapsed: number) => {
        if (elapsed <= 5) return 'text-green-600 bg-green-50';
        if (elapsed <= 10) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getTimeIcon = (elapsed: number) => {
        if (elapsed <= 5) return '🟢';
        if (elapsed <= 10) return '🟡';
        return '🔴';
    };

    const handleStatusChange = (orderId: string, newStatus: 'preparing' | 'ready' | 'completed') => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? { ...order, status: newStatus }
                    : order
            ).filter(order => order.status !== 'completed') // Remove completed orders
        );

        if (soundEnabled) {
            // Play notification sound
            playNotificationSound();
        }
    };

    const toggleItemCompletion = (orderId: string, itemIndex: number) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? {
                        ...order,
                        items: order.items.map((item, index) =>
                            index === itemIndex
                                ? { ...item, completed: !item.completed }
                                : item
                        )
                    }
                    : order
            )
        );
    };

    const playNotificationSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not supported');
        }
    };

    const handleRefresh = () => {
        // In a real app, this would refetch data from the server
        console.log('Refreshing KDS data...');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            🍳 Kitchen Display System
                        </h1>
                        <p className="text-gray-600 mt-1">Real-time order management for kitchen staff</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                                soundEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            <span>🔊 Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>↻</span>
                        </button>
                    </div>
                </div>

                {/* Orders Grid */}
                <div className="min-h-96">
                    {orders.length === 0 ? (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-2 4h2m-2 4h2" />
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Orders</h3>
                                <p className="text-gray-500">New orders will appear here when customers place them</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {orders.map((order) => (
                                <div key={order.id} className={`bg-white rounded-lg shadow-md border-l-4 ${getStatusColor(order.status)} flex flex-col h-fit`}>
                                    {/* Order Header */}
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeColor(order.elapsed)}`}>
                                                ⏱️ {Math.floor(order.elapsed)}:{((order.elapsed % 1) * 60).toFixed(0).padStart(2, '0')} {getTimeIcon(order.elapsed)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">Table {order.table}</p>
                                        <p className="text-xs text-gray-500">Started: {order.time}</p>
                                        {order.elapsed > 10 && (
                                            <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                                                ⚠️ OVERDUE
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Items */}
                                    <div className="p-4 flex-1">
                                        <div className="space-y-2">
                                            {order.items.map((item, index) => (
                                                <div key={index} className="flex items-start space-x-2">
                                                    <button
                                                        onClick={() => toggleItemCompletion(order.id, index)}
                                                        className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                            item.completed
                                                                ? 'bg-green-500 border-green-500'
                                                                : 'border-gray-300 hover:border-green-400'
                                                        }`}
                                                    >
                                                        {item.completed && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                            {item.name} x{item.quantity}
                                                        </p>
                                                        {item.modifications && (
                                                            <p className={`text-xs ${item.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                "{item.modifications}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {order.notes && (
                                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                                📝 {order.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-4 border-t border-gray-200 space-y-2">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusChange(order.id, 'preparing')}
                                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Start
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusChange(order.id, 'ready')}
                                                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                Ready
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusChange(order.id, 'completed')}
                                                className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-4 gap-4 text-center mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Preparing</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.preparing}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Ready</p>
                            <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed Today</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.completedToday}</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span>On time</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                <span>Warning (&gt;5min)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                <span>Overdue (&gt;10min)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminKDS;