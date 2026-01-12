// Menu item types
export interface MenuItem {
	_id: string; // MongoDB ObjectId
	name: string;
	description: string;
	price: number;
	images?: string[];
	primaryImageIndex?: number; // Index of the primary image to display
	categoryId: MenuCategory | string; // Can be populated or just ID
	restaurantId: string;
	modifiers?: MenuModifier[];
	preparationTime?: number; // prepTime from backend
	allergens?: string[];
	status: 'available' | 'unavailable'; // Backend uses status field
	isRecommended?: boolean; // Backend field
	totalOrders?: number; // For popularity sorting
	averageRating?: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface MenuModifier {
	name: string;
	type: 'single' | 'multiple';
	required: boolean;
	options: ModifierOption[];
}

export interface ModifierOption {
	name: string;
	priceAdjustment: number;
}

export interface MenuCategory {
	_id: string;
	name: string;
	description: string;
	displayOrder?: number;
	restaurantId: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// Filter and sort types
export interface MenuFilters {
	searchQuery: string;
	selectedCategory: string | null;
	sortBy: SortOption;
	sortOrder: 'asc' | 'desc';
	showOnlyAvailable: boolean;
	dietary?: DietaryFilter[];
}

export type SortOption = 'name' | 'price' | 'popularity' | 'newest';

export type DietaryFilter = 'vegetarian' | 'vegan' | 'glutenFree';

// QR Code and table types
export interface TableInfo {
	tableId: string;
	tableNumber: number;
	area?: string;
	restaurantId: string;
}

export interface QRCodeData {
	tableId: string;
	restaurantId: string;
	tableNumber: number;
}

// API Response types
export interface MenuResponse {
	success: boolean;
	count: number;
	total: number;
	page: number;
	pages: number;
	data: MenuItem[];
	message?: string;
}

export interface CategoriesResponse {
	success: boolean;
	data: MenuCategory[];
	message?: string;
}

export interface MenuItemResponse {
	success: boolean;
	data: MenuItem;
	message?: string;
}

// Hook types for menu functionality
export interface UseMenuReturn {
	menuItems: MenuItem[];
	categories: MenuCategory[];
	filteredItems: MenuItem[];
	filters: MenuFilters;
	isLoading: boolean;
	error: string | null;
	updateFilters: (newFilters: Partial<MenuFilters>) => void;
	resetFilters: () => void;
	searchItems: (query: string) => void;
	filterByCategory: (categoryId: string | null) => void;
	sortItems: (sortBy: SortOption, order?: 'asc' | 'desc') => void;
	refreshData: () => Promise<void>;
}

// Helper functions
export const getMenuItemId = (item: MenuItem): string => item._id;
export const getMenuItemName = (item: MenuItem): string => item.name;
export const getMenuItemPrice = (item: MenuItem): number => item.price;
export const isMenuItemAvailable = (item: MenuItem): boolean => item.status === 'available' && item.isActive;
export const getMenuItemPopularity = (item: MenuItem): number => item.totalOrders || 0;
export const getMenuItemCategory = (item: MenuItem): MenuCategory | string => item.categoryId;
export const getCategoryName = (category: MenuCategory | string): string => {
	return typeof category === 'string' ? '' : category.name;
};