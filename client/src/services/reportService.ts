import axiosInstance from "../config/axiosConfig";

export interface ReportStats {
	totalRevenue: number;
	revenueGrowth: number;
	ordersCount: number;
	ordersGrowth: number;
	avgOrderValue: number;
	avgOrderGrowth: number;
}

export interface RevenueChartData {
	date: string;
	revenue: number;
}

export interface TopSellingItem {
	name: string;
	orders: number;
	revenue: number;
}

export interface PerformanceInsights {
	peakHourOrders: number;
	peakHourTime: string;
	customerRating: number;
	avgPrepTime: number;
	tableTurnover: number;
}

class ReportService {
	/**
	 * Get report statistics for date range
	 */
	async getStats(from: string, to: string): Promise<ReportStats> {
		const response = await axiosInstance.get("/reports/stats", {
			params: { from, to },
		});
		return response.data.data;
	}

	/**
	 * Get revenue chart data
	 */
	async getRevenueChart(
		from: string,
		to: string
	): Promise<RevenueChartData[]> {
		const response = await axiosInstance.get("/reports/revenue-chart", {
			params: { from, to },
		});
		return response.data.data;
	}

	/**
	 * Get top selling items
	 */
	async getTopSellingItems(
		from: string,
		to: string,
		limit: number = 10
	): Promise<TopSellingItem[]> {
		const response = await axiosInstance.get("/reports/top-selling", {
			params: { from, to, limit },
		});
		return response.data.data;
	}

	/**
	 * Get performance insights
	 */
	async getInsights(
		from: string,
		to: string
	): Promise<PerformanceInsights> {
		const response = await axiosInstance.get("/reports/insights", {
			params: { from, to },
		});
		return response.data.data;
	}
}

export default new ReportService();
