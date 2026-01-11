import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import dashboardService from '../../services/dashboardService';
import type { DashboardStats, RecentOrder, TableStatus } from '../../services/dashboardService';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        todayRevenue: 0,
        revenueGrowth: 0,
        activeOrders: 0,
        pendingOrders: 0,
        totalTables: 0,
        completedOrders: 0
    });

    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [tables, setTables] = useState<TableStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, ordersData, tablesData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRecentOrders(5),
                dashboardService.getTableStatus()
            ]);

            setStats(statsData);
            setRecentOrders(ordersData);
            setTables(tablesData);
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'active': 'bg-green-500',      // Free/Available table
            'available': 'bg-green-500',   // Alternative status
            'occupied': 'bg-red-500',      // Table in use
            'reserved': 'bg-yellow-500',   // Reserved table
            'inactive': 'bg-gray-400',     // Inactive table
            'pending': 'bg-yellow-500',
            'preparing': 'bg-yellow-500',
            'ready': 'bg-green-500',
            'completed': 'bg-gray-500'
        };
        return colors[status.toLowerCase() as keyof typeof colors] || 'bg-gray-400';
    };

    const getStatusTextColor = (status: string) => {
        const colors = {
            'pending': 'text-yellow-700',
            'preparing': 'text-yellow-700',
            'ready': 'text-green-700',
            'completed': 'text-gray-700'
        };
        return colors[status.toLowerCase() as keyof typeof colors] || 'text-gray-700';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Error: {error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="text-gray-600 mt-1">Monitor your restaurant's performance and activities</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={fetchDashboardData}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">${stats.todayRevenue.toLocaleString()}</p>
                                <div className="flex items-center mt-2">
                                    <span className="text-green-600 text-sm font-medium">↑ {stats.revenueGrowth}%</span>
                                    <span className="text-gray-500 text-sm ml-2">vs yesterday</span>
                                </div>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeOrders}</p>
                                <div className="flex items-center mt-2">
                                    <span className="text-blue-600 text-sm font-medium">Currently processing</span>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-2 4h2m-2 4h2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingOrders}</p>
                                <div className="flex items-center mt-2">
                                    <span className="text-yellow-600 text-sm font-medium">Awaiting confirmation</span>
                                </div>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedOrders}</p>
                                <div className="flex items-center mt-2">
                                    <span className="text-green-600 text-sm font-medium">Total orders served</span>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Orders and Table Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Orders */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                        <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                        <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recentOrders.map((order, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="py-4 px-6 text-sm font-medium text-gray-900">{order.id}</td>
                                            <td className="py-4 px-6 text-sm text-gray-600">{order.table}</td>
                                            <td className="py-4 px-6 text-sm text-gray-600">{order.items}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusTextColor(order.status)} bg-opacity-20`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">{order.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Table Status</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {tables.map((table) => (
                                    <div key={table.id} className="text-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                                                <span className="text-lg font-semibold text-gray-700">T{table.tableNumber}</span>
                                            </div>
                                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(table.status)}`}></div>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2 capitalize">{table.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                        <span className="text-gray-600">Free</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                        <span className="text-gray-600">Active</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                        <span className="text-gray-600">Bill Requested</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;