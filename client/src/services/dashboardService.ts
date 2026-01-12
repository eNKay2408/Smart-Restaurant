import axiosInstance from "../config/axiosConfig";

export interface DashboardStats {
	todayRevenue: number;
	revenueGrowth: number;
	unpaidOrders: number;
	pendingOrders: number;
	completedOrders: number;
	totalTables: number;
}

export interface RecentOrder {
	id: string;
	table: number | string;
	items: number;
	status: string;
	time: string;
	amount: number;
}

export interface TableStatus {
	id: string;
	tableNumber: number;
	status: string;
	label: string;
}

class DashboardService {
	/**
	 * Get dashboard statistics
	 */
	async getStats(): Promise<DashboardStats> {
		const response = await axiosInstance.get("/dashboard/stats");
		return response.data.data;
	}

	/**
	 * Get recent orders
	 */
	async getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
		const response = await axiosInstance.get("/dashboard/recent-orders", {
			params: { limit },
		});
		return response.data.data;
	}

	/**
	 * Get table status
	 */
	async getTableStatus(): Promise<TableStatus[]> {
		const response = await axiosInstance.get("/dashboard/table-status");
		return response.data.data;
	}
}

export default new DashboardService();
