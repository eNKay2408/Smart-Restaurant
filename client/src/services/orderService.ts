import axiosInstance from "../config/axiosInterceptors";
import { io, Socket } from 'socket.io-client';
import type {
	OrderResponse,
	OrdersResponse,
	CreateOrderRequest,
} from "../types/order.types";

class OrderService {
	private socket: Socket | null = null;
	private readonly socketUrl = 'http://localhost:5000';

	/**
	 * Initialize Socket.IO connection
	 */
	initSocket(): Socket {
		if (!this.socket) {
			this.socket = io(this.socketUrl, {
				transports: ['websocket', 'polling'],
				reconnection: true,
				reconnectionAttempts: 5,
				reconnectionDelay: 1000
			});

			this.socket.on('connect', () => {
				console.log('✅ Socket.IO connected');
			});

			this.socket.on('disconnect', () => {
				console.log('❌ Socket.IO disconnected');
			});

			this.socket.on('connect_error', (error) => {
				console.error('Socket.IO connection error:', error);
			});
		}
		return this.socket;
	}

	/**
	 * Join order room to receive updates
	 */
	joinOrderRoom(orderId: string): void {
		const socket = this.initSocket();
		socket.emit('join:order', { orderId });
		console.log(`📋 Joined order room: ${orderId}`);
	}

	/**
	 * Join table room to receive updates
	 */
	joinTableRoom(tableId: string): void {
		const socket = this.initSocket();
		socket.emit('join:table', { tableId });
		console.log(`🪑 Joined table room: ${tableId}`);
	}

	/**
	 * Listen to order status updates via Socket.IO
	 */
	onOrderStatusUpdate(orderId: string, callback: (order: any) => void): void {
		const socket = this.initSocket();

		// Join the order room first
		this.joinOrderRoom(orderId);

		// Listen for status updates (fixed event name)
		socket.on('order:statusUpdate', (data: any) => {
			console.log('📡 Received order:statusUpdate event:', data);
			if (data.order && data.order._id === orderId) {
				console.log('📡 Order status updated:', data.order.status);
				callback(data.order);
			}
		});
	}

	/**
	 * Listen to all new orders (for kitchen/waiter)
	 */
	onNewOrder(callback: (order: any) => void): void {
		const socket = this.initSocket();

		socket.on('newOrder', (data: any) => {
			console.log('📡 New order received:', data.orderNumber);
			callback(data);
		});
	}

	/**
	 * Remove specific event listener
	 */
	off(event: string, callback?: any): void {
		if (this.socket) {
			this.socket.off(event, callback);
		}
	}

	/**
	 * Disconnect socket
	 */
	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			console.log('🔌 Socket.IO disconnected');
		}
	}

	/**
	 * Check if socket is connected
	 */
	isConnected(): boolean {
		return this.socket?.connected || false;
	}
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
