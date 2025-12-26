import axiosInstance from "../config/axiosInterceptors";
import type {
	OrderResponse,
	OrdersResponse,
	CreateOrderRequest,
} from "../types/order.types";

class OrderService {
	/**
	 * Get all orders with filters
	 */
	async getOrders(params?: {
		restaurantId?: string;
		tableId?: string;
		status?: string;
		paymentStatus?: string;
		page?: number;
		limit?: number;
	}): Promise<OrdersResponse> {
		try {
			const response = await axiosInstance.get<OrdersResponse>("/orders", {
				params,
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error fetching orders",
			};
		}
	}

	/**
	 * Get single order by ID
	 */
	async getOrder(orderId: string): Promise<OrderResponse> {
		try {
			const response = await axiosInstance.get<OrderResponse>(
				`/orders/${orderId}`
			);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error fetching order",
			};
		}
	}

	/**
	 * Create new order
	 */
	async createOrder(orderData: CreateOrderRequest): Promise<OrderResponse> {
		try {
			const response = await axiosInstance.post<OrderResponse>(
				"/orders",
				orderData
			);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error creating order",
			};
		}
	}

	/**
	 * Accept order (Waiter)
	 */
	async acceptOrder(orderId: string): Promise<OrderResponse> {
		try {
			const response = await axiosInstance.patch<OrderResponse>(
				`/orders/${orderId}/accept`
			);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error accepting order",
			};
		}
	}

	/**
	 * Reject order (Waiter)
	 */
	async rejectOrder(
		orderId: string,
		rejectionReason: string
	): Promise<OrderResponse> {
		try {
			const response = await axiosInstance.patch<OrderResponse>(
				`/orders/${orderId}/reject`,
				{
					rejectionReason,
				}
			);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error rejecting order",
			};
		}
	}

	/**
	 * Update order status
	 */
	async updateOrderStatus(
		orderId: string,
		status:
			| "pending"
			| "accepted"
			| "preparing"
			| "ready"
			| "served"
			| "completed"
			| "cancelled"
	): Promise<OrderResponse> {
		try {
			const response = await axiosInstance.patch<OrderResponse>(
				`/orders/${orderId}/status`,
				{
					status,
				}
			);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error updating order status",
			};
		}
	}

	/**
	 * Delete order (Admin)
	 */
	async deleteOrder(orderId: string): Promise<OrderResponse> {
		try {
			const response = await axiosInstance.delete<OrderResponse>(
				`/orders/${orderId}`
			);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Error deleting order",
			};
		}
	}
}

export default new OrderService();
