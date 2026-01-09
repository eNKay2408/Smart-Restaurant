import axiosInstance from '../config/axiosInterceptors';

// Generate or get session ID for guest users
const getSessionId = (): string => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
};

// Clear session ID (on logout or cart clear)
const clearSessionId = (): void => {
    localStorage.removeItem('cart_session_id');
};

export interface CartModifier {
    name: string;
    options: Array<{
        name: string;
        priceAdjustment: number;
    }>;
}

export interface CartItem {
    _id?: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    modifiers?: CartModifier[];
    specialInstructions?: string;
    subtotal: number;
}

export interface Cart {
    _id: string;
    sessionId?: string;
    customerId?: string;
    tableId?: string;
    restaurantId: string;
    items: CartItem[];
    totalItems: number;
    total: number;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface AddToCartData {
    menuItemId: string;
    quantity: number;
    modifiers?: CartModifier[];
    specialInstructions?: string;
    tableId?: string;
    restaurantId: string;
}

export interface UpdateCartItemData {
    quantity: number;
    modifiers?: CartModifier[];
    specialInstructions?: string;
}

class CartService {
    /**
     * Get cart (auto-detects guest vs logged-in user)
     */
    async getCart(): Promise<Cart> {
        try {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            // Only use user cart if both token AND user exist (properly authenticated)
            if (token && user) {
                // Logged-in user - try user cart first
                try {
                    const response = await axiosInstance.get('/cart');
                    return response.data.data;
                } catch (error: any) {
                    // If user cart fails, fallback to session cart
                    if (error.response?.status === 400 || error.response?.status === 401) {
                        const sessionId = getSessionId();
                        const response = await axiosInstance.get(`/cart/${sessionId}`);
                        return response.data.data;
                    }
                    throw error;
                }
            } else {
                // Guest user - always use session
                const sessionId = getSessionId();
                const response = await axiosInstance.get(`/cart/${sessionId}`);
                return response.data.data;
            }
        } catch (error: any) {
            console.error('Get cart error:', error);
            // Return empty cart instead of throwing
            return {
                _id: '',
                items: [],
                totalItems: 0,
                total: 0,
                restaurantId: '',
                expiresAt: '',
                createdAt: '',
                updatedAt: ''
            } as Cart;
        }
    }

    /**
     * Get cart summary (items count and total)
     */
    async getCartSummary(): Promise<{ itemsCount: number; total: number }> {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                const response = await axiosInstance.get('/cart/summary');
                return response.data.data;
            } else {
                const sessionId = getSessionId();
                const response = await axiosInstance.get(`/cart/${sessionId}/summary`);
                return response.data.data;
            }
        } catch (error: any) {
            console.error('Get cart summary error:', error);
            return { itemsCount: 0, total: 0 };
        }
    }

    /**
     * Add item to cart
     */
    async addItemToCart(data: AddToCartData): Promise<Cart> {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                // Logged-in user
                const response = await axiosInstance.post('/cart/items', data);
                return response.data.data;
            } else {
                // Guest user
                const sessionId = getSessionId();
                const response = await axiosInstance.post(`/cart/${sessionId}/items`, data);
                return response.data.data;
            }
        } catch (error: any) {
            console.error('Add to cart error:', error);
            throw error;
        }
    }

    /**
     * Update cart item
     */
    async updateCartItem(itemId: string, data: UpdateCartItemData): Promise<Cart> {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                const response = await axiosInstance.put(`/cart/items/${itemId}`, data);
                return response.data.data;
            } else {
                const sessionId = getSessionId();
                const response = await axiosInstance.put(`/cart/${sessionId}/items/${itemId}`, data);
                return response.data.data;
            }
        } catch (error: any) {
            console.error('Update cart item error:', error);
            throw error;
        }
    }

    /**
     * Remove item from cart
     */
    async removeCartItem(itemId: string): Promise<Cart> {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                const response = await axiosInstance.delete(`/cart/items/${itemId}`);
                return response.data.data;
            } else {
                const sessionId = getSessionId();
                const response = await axiosInstance.delete(`/cart/${sessionId}/items/${itemId}`);
                return response.data.data;
            }
        } catch (error: any) {
            console.error('Remove cart item error:', error);
            throw error;
        }
    }

    /**
     * Clear cart
     */
    async clearCart(): Promise<void> {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                await axiosInstance.delete('/cart');
            } else {
                const sessionId = getSessionId();
                await axiosInstance.delete(`/cart/${sessionId}`);
            }

            // Clear session ID for guest
            if (!token) {
                clearSessionId();
            }
        } catch (error: any) {
            console.error('Clear cart error:', error);
            throw error;
        }
    }

    /**
     * Merge guest cart with user cart (after login)
     */
    async mergeCart(): Promise<Cart> {
        try {
            const sessionId = localStorage.getItem('cart_session_id');
            if (!sessionId) {
                throw new Error('No guest cart to merge');
            }

            const response = await axiosInstance.post('/cart/merge', { sessionId });

            // Clear guest session ID after merge
            clearSessionId();

            return response.data.data;
        } catch (error: any) {
            console.error('Merge cart error:', error);
            throw error;
        }
    }

    /**
     * Get session ID (for debugging)
     */
    getSessionId(): string {
        return getSessionId();
    }

    /**
     * Clear session ID (for logout)
     */
    clearSessionId(): void {
        clearSessionId();
    }
}

export default new CartService();
