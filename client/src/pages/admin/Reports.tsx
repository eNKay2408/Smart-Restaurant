import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import reportService from '../../services/reportService';
import type { ReportStats, RevenueChartData, TopSellingItem, PerformanceInsights } from '../../services/reportService';

interface DateRange {
    from: string;
    to: string;
}

const AdminReports: React.FC = () => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const [dateRange, setDateRange] = useState<DateRange>({
        from: tenDaysAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
    });

    const [stats, setStats] = useState<ReportStats>({
        totalRevenue: 0,
        revenueGrowth: 0,
        ordersCount: 0,
        ordersGrowth: 0,
        avgOrderValue: 0,
        avgOrderGrowth: 0
    });

    const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
    const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>([]);
    const [insights, setInsights] = useState<PerformanceInsights>({
        peakHourOrders: 0,
        peakHourTime: 'N/A',
        customerRating: 0,
        avgPrepTime: 0,
        tableTurnover: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReportData();
    }, []);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, chartData, topItems, insightsData] = await Promise.all([
                reportService.getStats(dateRange.from, dateRange.to),
                reportService.getRevenueChart(dateRange.from, dateRange.to),
                reportService.getTopSellingItems(dateRange.from, dateRange.to, 5),
                reportService.getInsights(dateRange.from, dateRange.to)
            ]);

            setStats(statsData);
            setRevenueChartData(chartData);
            setTopSellingItems(topItems);
            setInsights(insightsData);
        } catch (err: any) {
            console.error('Error fetching report data:', err);
            setError(err.response?.data?.message || 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const applyDateRange = () => {
        fetchReportData();
    };

    const exportReport = (format: 'pdf' | 'excel') => {
        // In a real app, this would trigger report export
        alert(`Exporting report as ${format.toUpperCase()}`);
    };

    const maxRevenue = revenueChartData.length > 0 
        ? Math.max(...revenueChartData.map(d => d.revenue))
        : 1;

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

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading reports...</p>
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
                        onClick={fetchReportData}
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
                                {revenueChartData.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No data available for this period</p>
                                ) : (
                                    revenueChartData.map((data, index) => (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div className="w-12 text-xs text-gray-600">{data.date}</div>
                                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                                <div
                                                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                                    style={{ width: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0}%` }}
                                                >
                                                    <span className="text-white text-xs font-medium">
                                                        {formatCurrency(data.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
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
                            {topSellingItems.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No sales data available for this period</p>
                            ) : (
                                topSellingItems.map((item, index) => (
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
                                ))
                            )}
                        </div>

                        {topSellingItems.length > 0 && (
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
                        )}
                    </div>
                </div>

                {/* Additional Analytics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{insights.peakHourOrders}</div>
                            <div className="text-sm text-gray-600 mt-1">Peak Hour Orders</div>
                            <div className="text-xs text-gray-500">{insights.peakHourTime}</div>
                        </div>
                        
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600">{insights.customerRating.toFixed(1)}</div>
                            <div className="text-sm text-gray-600 mt-1">Customer Rating</div>
                            <div className="text-xs text-gray-500">Based on reviews</div>
                        </div>
                        
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-3xl font-bold text-yellow-600">{insights.avgPrepTime}m</div>
                            <div className="text-sm text-gray-600 mt-1">Avg Prep Time</div>
                            <div className="text-xs text-gray-500">Minutes</div>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">{insights.tableTurnover}%</div>
                            <div className="text-sm text-gray-600 mt-1">Table Turnover</div>
                            <div className="text-xs text-gray-500">Efficiency rate</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminReports;