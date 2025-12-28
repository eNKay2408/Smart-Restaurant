import axiosInstance from '../config/axiosInterceptors';
import type { MenuResponse, CategoriesResponse, MenuItemResponse } from '../types/menu.types';

class MenuService {
	/**
	 * Get all menu items with optional filtering
	 */
	async getMenuItems(params?: {
		restaurantId?: string;
		categoryId?: string;
		status?: string;
		search?: string;
		sortBy?: string;
		order?: 'asc' | 'desc';
		page?: number;
		limit?: number;
	}): Promise<MenuResponse> {
		try {
			const response = await axiosInstance.get<MenuResponse>('/menu-items', {
				params,
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to fetch menu items',
				error: error.message,
			};
		}
	}

	/**
	 * Get menu item by ID
	 */
	async getMenuItem(itemId: string): Promise<MenuItemResponse> {
		try {
			const response = await axiosInstance.get<MenuItemResponse>(`/menu-items/${itemId}`);
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to fetch menu item',
				error: error.message,
			};
		}
	}

	/**
	 * Get all menu categories
	 */
	async getCategories(restaurantId?: string): Promise<CategoriesResponse> {
		try {
			const response = await axiosInstance.get<CategoriesResponse>('/categories', {
				params: { restaurantId },
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to fetch categories',
				error: error.message,
			};
		}
	}

	/**
	 * Search menu items
	 */
	async searchMenuItems(query: string, restaurantId?: string): Promise<MenuResponse> {
		try {
			const response = await axiosInstance.get<MenuResponse>('/menu-items', {
				params: { search: query, restaurantId },
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to search menu items',
				error: error.message,
			};
		}
	}

	/**
	 * Get popular menu items
	 */
	async getPopularItems(limit: number = 10, restaurantId?: string): Promise<MenuResponse> {
		try {
			const response = await axiosInstance.get<MenuResponse>('/menu-items', {
				params: { 
					sortBy: 'popularity', 
					order: 'desc', 
					limit, 
					restaurantId 
				},
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to fetch popular items',
				error: error.message,
			};
		}
	}

	/**
	 * Get menu items by category
	 */
	async getMenuItemsByCategory(categoryId: string, restaurantId?: string): Promise<MenuResponse> {
		try {
			const response = await axiosInstance.get<MenuResponse>('/menu-items', {
				params: { categoryId, restaurantId },
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to fetch category items',
				error: error.message,
			};
		}
	}

	/**
	 * Add item to cart/order for a specific table
	 */
	async addToOrder(itemId: string, tableId: string, quantity: number = 1, modifiers?: any[]): Promise<any> {
		try {
			const response = await axiosInstance.post('/orders', {
				tableId,
				items: [{
					menuItemId: itemId,
					quantity,
					modifiers,
				}],
			});
			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: 'Failed to add item to order',
				error: error.message,
			};
		}
	}
}

// Create and export an instance
const menuService = new MenuService();
export { menuService };
export default menuService;