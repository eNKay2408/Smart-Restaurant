// Order types
export interface OrderItem {
	menuItemId: string;
	name: string;
	price: number;
	quantity: number;
	modifiers?: Array<{
		name: string;
		options: Array<{
			name: string;
			priceAdjustment: number;
		}>;
	}>;
	specialInstructions?: string;
	status: "pending" | "preparing" | "ready" | "served";
	subtotal: number;
}

export interface Order {
	_id: string;
	orderNumber: string;
	restaurantId: string;
	tableId: {
		_id: string;
		tableNumber: number;
		area?: string;
	};
	customerId?: {
		_id: string;
		fullName: string;
		email: string;
	};
	guestName: string;
	items: OrderItem[];
	orderNotes?: string;
	status:
		| "pending"
		| "accepted"
		| "rejected"
		| "preparing"
		| "ready"
		| "served"
		| "completed"
		| "cancelled";
	waiterId?: {
		_id: string;
		fullName: string;
	};
	rejectionReason?: string;
	subtotal: number;
	tax: number;
	discount: number;
	total: number;
	paymentStatus: "pending" | "paid" | "failed" | "refunded";
	paymentMethod?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateOrderRequest {
	restaurantId: string;
	tableId: string;
	customerId?: string;
	guestName?: string;
	items: Array<{
		menuItemId: string;
		quantity: number;
		modifiers?: Array<{
			name: string;
			options: Array<{
				name: string;
				priceAdjustment: number;
			}>;
		}>;
		specialInstructions?: string;
	}>;
	orderNotes?: string;
}

export interface OrderResponse {
	success: boolean;
	message?: string;
	data?: Order;
	count?: number;
	total?: number;
	page?: number;
	pages?: number;
}

export interface OrdersResponse {
	success: boolean;
	message?: string;
	data?: Order[];
	count?: number;
	total?: number;
	page?: number;
	pages?: number;
}
