import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

interface DateRange {
    from: string;
    to: string;
}

interface TopSellingItem {
    name: string;
    orders: number;
    revenue: number;
}

const AdminReports: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRange>({
        from: '2024-12-01',
        to: '2024-12-10'
    });

    const [stats, setStats] = useState({
        totalRevenue: 12500,
        revenueGrowth: 12,
        ordersCount: 245,
        ordersGrowth: 8,
        avgOrderValue: 51.02,
        avgOrderGrowth: 3
    });

    const [topSellingItems] = useState<TopSellingItem[]>([
        { name: 'Grilled Salmon', orders: 85, revenue: 1530 },
        { name: 'Caesar Salad', orders: 72, revenue: 864 },
        { name: 'Beef Steak', orders: 58, revenue: 1450 },
        { name: 'Pasta Carbonara', orders: 45, revenue: 675 },
        { name: 'Mushroom Soup', orders: 38, revenue: 304 },
    ]);

    const [revenueChartData] = useState([
        { day: 'Dec 1', revenue: 1200 },
        { day: 'Dec 2', revenue: 800 },
        { day: 'Dec 3', revenue: 1600 },
        { day: 'Dec 4', revenue: 950 },
        { day: 'Dec 5', revenue: 2000 },
        { day: 'Dec 6', revenue: 1300 },
        { day: 'Dec 7', revenue: 1800 },
        { day: 'Dec 8', revenue: 1100 },
        { day: 'Dec 9', revenue: 1700 },
        { day: 'Dec 10', revenue: 1250 }
    ]);

    const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyDateRange = () => {
        // In a real app, this would fetch new data based on the date range
        console.log('Applying date range:', dateRange);
    };

    const exportReport = (format: 'pdf' | 'excel') => {
        // In a real app, this would trigger report export
        alert(`Exporting report as ${format.toUpperCase()}`);
    };

    const maxRevenue = Math.max(...revenueChartData.map(d => d.revenue));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getGrowthIcon = (growth: number) => {
        return growth > 0 ? '↑' : growth < 0 ? '↓' : '→';
    };

    const getGrowthColor = (growth: number) => {
        return growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600';
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-1">Analyze your restaurant's performance and trends</p>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-end space-x-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={applyDateRange}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => exportReport('pdf')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                Export PDF
                            </button>
                            <button
                                onClick={() => exportReport('excel')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalRevenue)}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm font-medium ${getGrowthColor(stats.revenueGrowth)}`}>
                                        {getGrowthIcon(stats.revenueGrowth)} {Math.abs(stats.revenueGrowth)}%
                                    </span>
                                    <span className="text-gray-500 text-sm ml-2">vs last period</span>
                                </div>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Orders Count</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.ordersCount}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm font-medium ${getGrowthColor(stats.ordersGrowth)}`}>
                                        {getGrowthIcon(stats.ordersGrowth)} {Math.abs(stats.ordersGrowth)}%
                                    </span>
                                    <span className="text-gray-500 text-sm ml-2">vs last period</span>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-2 4h2m-2 4h2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.avgOrderValue)}</p>
                                <div className="flex items-center mt-2">
                                    <span className={`text-sm font-medium ${getGrowthColor(stats.avgOrderGrowth)}`}>
                                        {getGrowthIcon(stats.avgOrderGrowth)} {Math.abs(stats.avgOrderGrowth)}%
                                    </span>
                                    <span className="text-gray-500 text-sm ml-2">vs last period</span>
                                </div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart and Top Selling Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Over Time */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Over Time</h3>
                        
                        <div className="space-y-4">
                            {/* Simple Bar Chart */}
                            <div className="space-y-3">
                                {revenueChartData.map((data, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className="w-12 text-xs text-gray-600">{data.day}</div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                            <div
                                                className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                                style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                                            >
                                                <span className="text-white text-xs font-medium">
                                                    {formatCurrency(data.revenue)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart Legend */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                                        <span className="text-sm text-gray-600">Daily Revenue</span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Peak: {formatCurrency(maxRevenue)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Items</h3>
                        
                        <div className="space-y-4">
                            {topSellingItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                            index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                            index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">{item.orders} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatCurrency(item.revenue / item.orders)} avg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {topSellingItems.reduce((sum, item) => sum + item.orders, 0)}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Orders</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(topSellingItems.reduce((sum, item) => sum + item.revenue, 0))}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Revenue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Analytics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">15</div>
                            <div className="text-sm text-gray-600 mt-1">Peak Hour Orders</div>
                            <div className="text-xs text-gray-500">12:00 PM - 1:00 PM</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600">4.8</div>
                            <div className="text-sm text-gray-600 mt-1">Customer Rating</div>
                            <div className="text-xs text-gray-500">Based on 156 reviews</div>
                        </div>
                        
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600">18m</div>
                            <div className="text-sm text-gray-600 mt-1">Avg Prep Time</div>
                            <div className="text-xs text-gray-500">2 minutes faster</div>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">92%</div>
                            <div className="text-sm text-gray-600 mt-1">Table Turnover</div>
                            <div className="text-xs text-gray-500">Above target</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;