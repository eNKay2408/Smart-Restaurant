import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import type { MenuItem as BackendMenuItem } from '../../types/menu.types';
import { getPrimaryImageUrl, getImageUrl } from '../../utils/imageHelper';
import Fuse from 'fuse.js';

// Use backend MenuItem type
type MenuItem = BackendMenuItem & {
    id: string; // Transformed from _id
    category: string; // Display category name instead of full object
};

const AdminMenuManagement: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'popularity'>('newest');
    const itemsPerPage = 10;

    // Fetch menu items from backend
    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await menuService.getMenuItems();

            if (response.success) {
                // Transform backend data to match local format
                const transformedItems: MenuItem[] = response.data.map(item => ({
                    ...item,
                    id: item._id,
                    category: (item.categoryId && typeof item.categoryId === 'object') ? item.categoryId.name : 'Unknown'
                }));
                setMenuItems(transformedItems);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch menu items');
        } finally {
            setLoading(false);
        }
    };

    const [categories, setCategories] = useState<string[]>(['All']);

    // Fetch categories from backend
    const fetchCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            if (response.success) {
                const categoryNames = response.data.map(cat => cat.name);
                setCategories(['All', ...categoryNames]);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            // Fallback to basic categories if fetch fails
            setCategories(['All']);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchCategories();
        fetchMenuItems();
    }, []);

    // Initialize filters from URL parameters on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlPage = params.get('page');
        const urlSearch = params.get('search');
        const urlCategory = params.get('category');
        const urlSort = params.get('sort');

        if (urlPage) setCurrentPage(parseInt(urlPage));
        if (urlSearch) setSearchQuery(urlSearch);
        if (urlCategory && urlCategory !== 'All') setSelectedCategory(urlCategory);
        if (urlSort) setSortBy(urlSort as any);
    }, []); // Only run on mount

    // Update URL when filters or page changes
    useEffect(() => {
        const params = new URLSearchParams();

        if (currentPage > 1) params.set('page', currentPage.toString());
        if (searchQuery) params.set('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
        if (sortBy !== 'newest') params.set('sort', sortBy);

        const newSearch = params.toString();
        const currentSearch = location.search.slice(1); // Remove '?'

        if (newSearch !== currentSearch) {
            navigate(`${location.pathname}?${newSearch}`, { replace: true });
        }
    }, [currentPage, searchQuery, selectedCategory, sortBy, navigate, location.pathname, location.search]);

    useEffect(() => {
        let filtered = menuItems;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filter by search query using fuzzy search
        if (searchQuery) {
            const fuseOptions = {
                keys: [
                    { name: 'name', weight: 0.6 },
                    { name: 'description', weight: 0.4 }
                ],
                threshold: 0.4,
                distance: 100,
                minMatchCharLength: 2,
                includeScore: true,
                ignoreLocation: true
            };

            const fuse = new Fuse(filtered, fuseOptions);
            const searchResults = fuse.search(searchQuery);
            filtered = searchResults.map(result => result.item);
        }

        // Sort items
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    // Sort by creation date (newest first)
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                case 'oldest':
                    // Sort by creation date (oldest first)
                    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                case 'price-asc':
                    // Sort by price (low to high)
                    return a.price - b.price;
                case 'price-desc':
                    // Sort by price (high to low)
                    return b.price - a.price;
                case 'popularity':
                    // Sort by popularity (based on order count or rating)
                    const aPopularity = (a.totalOrders || 0) + (a.averageRating || 0) * 10;
                    const bPopularity = (b.totalOrders || 0) + (b.averageRating || 0) * 10;
                    return bPopularity - aPopularity;
                default:
                    return 0;
            }
        });

        setFilteredItems(sorted);
        setCurrentPage(1);
    }, [menuItems, selectedCategory, searchQuery, sortBy]);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Available', icon: '🟢' },
            unavailable: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unavailable', icon: '🔴' },
            sold_out: { bg: 'bg-red-100', text: 'text-red-800', label: 'Sold Out', icon: '🔴' },
            low_stock: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Low Stock', icon: '🟡' }
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <span className="mr-1">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; item: MenuItem | null }>({
        show: false,
        item: null
    });

    const handleDelete = async (id: string) => {
        const item = menuItems.find(i => i.id === id);
        if (!item) return;

        // Show custom confirmation modal
        setDeleteModal({ show: true, item });
    };

    const confirmDelete = async () => {
        if (!deleteModal.item) return;

        try {
            setLoading(true);
            await menuService.deleteMenuItem(deleteModal.item.id);
            // Refresh menu items
            await fetchMenuItems();
            setDeleteModal({ show: false, item: null });
        } catch (err: any) {
            setError(err.message || 'Failed to delete item');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            setLoading(true);
            // Update item status via API
            await menuService.updateMenuItem(id, { status: newStatus });
            // Refresh menu items
            await fetchMenuItems();
        } catch (err: any) {
            setError(err.message || 'Failed to update item status');
        } finally {
            setLoading(false);
        }
    };

    // Image modal state
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

    const handleOpenImageModal = (item: MenuItem) => {
        setSelectedItem(item);
        setImageModalOpen(true);
    };

    const handleSetPrimaryImage = async (itemId: string, imageIndex: number) => {
        try {
            setLoading(true);
            await menuService.updatePrimaryImage(itemId, imageIndex);
            setImageModalOpen(false);
            await fetchMenuItems();
        } catch (err: any) {
            setError(err.message || 'Failed to update primary image');
        } finally {
            setLoading(false);
        }
    };

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
                        <p className="text-gray-600 mt-1">Manage your restaurant menu items and categories</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <Link
                            to="/admin/menu/add"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Menu Item
                        </Link>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading menu items...</span>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex items-center space-x-3">
                            {/* Sort Dropdown */}
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="popularity">Most Popular</option>
                                </select>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full lg:w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Modifiers</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <div className="relative group">
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {item.images && item.images.length > 0 ? (
                                                        <img
                                                            src={getPrimaryImageUrl(item.images, item.primaryImageIndex)}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <span className="text-2xl">🖼️</span>
                                                    )}
                                                </div>
                                                {item.images && item.images.length > 1 && (
                                                    <>
                                                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                                                            {item.images.length}
                                                        </span>
                                                        <button
                                                            onClick={() => handleOpenImageModal(item)}
                                                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                            title="Change primary image"
                                                        >
                                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-500">{item.description}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-900 font-medium">${item.price}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600">{item.category}</td>
                                        <td className="py-4 px-6">
                                            {item.modifiers && item.modifiers.length > 0 ? (
                                                <div className="space-y-1">
                                                    {item.modifiers.slice(0, 2).map((modifier: any, index: number) => (
                                                        <div key={index} className="flex items-center space-x-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                {modifier.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                ({modifier.type === 'multiple' ? 'Multi' : 'Single'}{modifier.required ? ', Required' : ''})
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {item.modifiers.length > 2 && (
                                                        <span className="text-xs text-gray-400">
                                                            +{item.modifiers.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No modifiers</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                <Link
                                                    to={`/admin/menu/edit/${item.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit item"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete item"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="unavailable">Unavailable</option>
                                                    <option value="sold_out">Sold Out</option>
                                                    <option value="low_stock">Low Stock</option>
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-700">
                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} results
                                </p>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPage(index + 1)}
                                            className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === index + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
                        <p className="text-gray-500 mb-6">Try adjusting your search or filter to find what you're looking for.</p>
                        <Link
                            to="/admin/menu/add"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add First Item
                        </Link>
                    </div>
                )}
            </div>

            {/* Image Selection Modal */}
            {imageModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Select Primary Image</h3>
                                <p className="text-sm text-gray-600 mt-1">{selectedItem.name}</p>
                            </div>
                            <button
                                onClick={() => setImageModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedItem.images?.map((image, index) => (
                                    <div
                                        key={index}
                                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${index === (selectedItem.primaryImageIndex || 0)
                                            ? 'border-blue-600 ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-blue-400'
                                            }`}
                                        onClick={() => handleSetPrimaryImage(selectedItem.id, index)}
                                    >
                                        <div className="aspect-square bg-gray-100">
                                            <img
                                                src={getImageUrl(image)}
                                                alt={`${selectedItem.name} - Image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Primary Badge */}
                                        {index === (selectedItem.primaryImageIndex || 0) && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Primary
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {index === (selectedItem.primaryImageIndex || 0) ? (
                                                    <span className="text-white font-medium text-sm">Current Primary</span>
                                                ) : (
                                                    <span className="text-white font-medium text-sm">Set as Primary</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Image Number */}
                                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                            Image {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setImageModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && deleteModal.item && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Menu Item</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete this menu item?
                            </p>

                            {/* Item Preview */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center space-x-4">
                                    {deleteModal.item.images && deleteModal.item.images.length > 0 ? (
                                        <img
                                            src={getPrimaryImageUrl(deleteModal.item.images, deleteModal.item.primaryImageIndex)}
                                            alt={deleteModal.item.name}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <span className="text-2xl">🍽️</span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{deleteModal.item.name}</h4>
                                        <p className="text-sm text-gray-500">{deleteModal.item.category}</p>
                                        <p className="text-sm font-medium text-gray-900">${deleteModal.item.price}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, item: null })}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Item
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminMenuManagement;