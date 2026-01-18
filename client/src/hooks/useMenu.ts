import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { menuService } from '../services/menuService';
import { categoryService } from '../services/categoryService';
import Fuse from 'fuse.js';
import type {
	MenuItem,
	MenuCategory,
	MenuFilters,
	SortOption,
	UseMenuReturn
} from '../types/menu.types';

/**
 * Custom hook for managing menu items with search, filter, and sort functionality
 */
export function useMenu(restaurantId?: string): UseMenuReturn {
	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
	const [categories, setCategories] = useState<MenuCategory[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Track ongoing requests to prevent duplicates
	const isRequestInProgressRef = useRef(false);
	const lastRequestParamsRef = useRef<string>('');

	// Default filters
	const defaultFilters: MenuFilters = {
		searchQuery: '',
		selectedCategory: null,
		sortBy: 'name',
		sortOrder: 'asc',
		showOnlyAvailable: true,
		dietary: []
	};

	const [filters, setFilters] = useState<MenuFilters>(defaultFilters);

	// Fetch data from backend with request deduplication
	const fetchData = useCallback(async (forceRefresh: boolean = false) => {
		// Create request signature to prevent duplicates
		const requestParams = JSON.stringify({
			restaurantId,
			status: filters.showOnlyAvailable ? 'available' : undefined
		});

		// Skip if same request is already in progress or recently made
		if (!forceRefresh && (isRequestInProgressRef.current || lastRequestParamsRef.current === requestParams)) {
			return;
		}

		isRequestInProgressRef.current = true;
		lastRequestParamsRef.current = requestParams;
		setIsLoading(true);
		setError(null);

		try {
			// Fetch categories and menu items in parallel
			const [categoriesResponse, menuResponse] = await Promise.all([
				categoryService.getCategories(restaurantId),
				menuService.getMenuItems({
					restaurantId,
					status: filters.showOnlyAvailable ? 'available' : undefined
				})
			]);

			console.log('Categories Response:', categoriesResponse);
			console.log('Menu Response:', menuResponse);

			if (categoriesResponse.success) {
				setCategories(categoriesResponse.data);
				console.log('Categories loaded:', categoriesResponse.data.length);
			} else {
				console.error('Failed to load categories:', categoriesResponse);
			}

			if (menuResponse.success) {
				setMenuItems(menuResponse.data);
				console.log('Menu items loaded:', menuResponse.data.length);
			} else {
				console.error('Failed to load menu items:', menuResponse);
			}
		} catch (err: any) {
			setError(err.message || 'Failed to fetch menu data');
			console.error('Menu fetch error:', err);
		} finally {
			isRequestInProgressRef.current = false;
			setIsLoading(false);
		}
	}, [restaurantId, filters.showOnlyAvailable]);

	// Initial data fetch
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Apply filters and sorting to menu items
	const filteredItems = useMemo(() => {
		let filtered = [...menuItems];

		// Filter by availability
		if (filters.showOnlyAvailable) {
			filtered = filtered.filter(item => item.status === 'available' && item.isActive);
		}

		// Filter by search query using fuzzy search
		if (filters.searchQuery.trim()) {
			const fuseOptions = {
				keys: [
					{ name: 'name', weight: 0.5 },
					{ name: 'description', weight: 0.3 },
					{ name: 'allergens', weight: 0.2 }
				],
				threshold: 0.4,
				distance: 100,
				minMatchCharLength: 2,
				includeScore: true,
				ignoreLocation: true
			};

			const fuse = new Fuse(filtered, fuseOptions);
			const searchResults = fuse.search(filters.searchQuery.trim());
			filtered = searchResults.map(result => result.item);
		}

		// Filter by category
		if (filters.selectedCategory) {
			filtered = filtered.filter(item => {
				const categoryId = typeof item.categoryId === 'object'
					? item.categoryId._id
					: item.categoryId;
				return categoryId === filters.selectedCategory;
			});
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let comparison = 0;

			switch (filters.sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'price':
					comparison = a.price - b.price;
					break;
				case 'popularity':
					const aPopularity = (a as any).totalOrders || 0;
					const bPopularity = (b as any).totalOrders || 0;
					comparison = bPopularity - aPopularity; // Higher popularity first
					break;
				case 'newest':
					comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
					break;
				default:
					comparison = 0;
			}

			// Apply sort order
			return filters.sortOrder === 'desc' ? -comparison : comparison;
		});

		return filtered;
	}, [menuItems, filters]);

	// Update filters
	const updateFilters = useCallback((newFilters: Partial<MenuFilters>) => {
		setFilters(prev => ({ ...prev, ...newFilters }));
	}, []);

	// Reset filters to default
	const resetFilters = useCallback(() => {
		setFilters(defaultFilters);
	}, []);

	// Search items by query
	const searchItems = useCallback(async (query: string) => {
		updateFilters({ searchQuery: query });

		if (query.trim()) {
			setIsLoading(true);
			try {
				const response = await menuService.searchMenuItems(query, {
					restaurantId
				});
				if (response.success) {
					setMenuItems(response.data);
				}
			} catch (err: any) {
				console.error('Search error:', err);
				// Fall back to client-side filtering
				updateFilters({ searchQuery: query });
			} finally {
				setIsLoading(false);
			}
		} else {
			// Refresh data when clearing search
			fetchData();
		}
	}, [updateFilters, restaurantId, fetchData]);

	// Filter by category
	const filterByCategory = useCallback(async (categoryId: string | null) => {
		updateFilters({ selectedCategory: categoryId });

		if (categoryId) {
			setIsLoading(true);
			try {
				const response = await menuService.getMenuItemsByCategory(categoryId, {
					restaurantId
				});
				if (response.success) {
					setMenuItems(response.data);
				}
			} catch (err: any) {
				console.error('Category filter error:', err);
				// Fall back to client-side filtering
				updateFilters({ selectedCategory: categoryId });
			} finally {
				setIsLoading(false);
			}
		} else {
			// Refresh all data when clearing category filter
			fetchData();
		}
	}, [updateFilters, restaurantId, fetchData]);

	// Sort items (prefer client-side sorting to reduce API calls)
	const sortItems = useCallback(async (sortBy: SortOption, order: 'asc' | 'desc' = 'asc') => {
		updateFilters({ sortBy, sortOrder: order });

		// Use client-side sorting if we already have data
		// Only fetch from server if we need fresh data or complex sorting
		if (menuItems.length > 0) {
			// Client-side sorting is handled by the filteredItems useMemo
			return;
		}

		// Only fetch from server if we don't have data yet
		if (isRequestInProgressRef.current) {
			return; // Prevent duplicate requests
		}

		setIsLoading(true);
		try {
			// Map frontend sort options to backend
			let backendSortBy: 'name' | 'price' | 'popularity' | 'rating' | 'createdAt';
			if (sortBy === 'newest') {
				backendSortBy = 'createdAt';
			} else if (sortBy === 'mostOrdered') {
				backendSortBy = 'popularity'; // Backend uses popularity for totalOrders
			} else {
				backendSortBy = sortBy;
			}

			const response = await menuService.getMenuItems({
				restaurantId,
				sortBy: backendSortBy,
				order,
				status: filters.showOnlyAvailable ? 'available' : undefined
			});

			if (response.success) {
				setMenuItems(response.data);
			}
		} catch (err: any) {
			console.error('Sort error:', err);
			// Fall back to client-side sorting
			updateFilters({ sortBy, sortOrder: order });
		} finally {
			setIsLoading(false);
		}
	}, [updateFilters, restaurantId, filters.showOnlyAvailable, menuItems.length]);

	// Refresh data
	const refreshData = useCallback(async () => {
		await fetchData(true); // Force refresh
	}, [fetchData]);

	return {
		menuItems,
		categories,
		filteredItems,
		filters,
		isLoading,
		error,
		updateFilters,
		resetFilters,
		searchItems,
		filterByCategory,
		sortItems,
		refreshData
	};
}

/**
 * Hook for managing menu item search with debounced input
 */
export function useMenuSearch(onSearch: (query: string) => void, delay: number = 300) {
	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, delay);

		return () => clearTimeout(timer);
	}, [searchQuery, delay]);

	useEffect(() => {
		onSearch(debouncedQuery);
	}, [debouncedQuery, onSearch]);

	return {
		searchQuery,
		setSearchQuery,
		debouncedQuery
	};
}