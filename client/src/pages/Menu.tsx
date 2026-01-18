import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQRTable } from '../hooks/useQRTable';
import { useMenu } from '../hooks/useMenu';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import cartService from '../services/cartService';
import QRScanRequired from '../components/QRScanRequired';
import QRLoginModal from '../components/QRLoginModal';
import { toast } from 'react-toastify';
import { getPrimaryImageUrl } from '../utils/imageHelper';


function Menu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { tableInfo, isValidTable, error: qrError, isLoading: qrLoading, showLoginModal, closeLoginModal } = useQRTable();

    // Use backend data through useMenu hook
    const {
        filteredItems,
        categories,
        filters,
        isLoading: menuLoading,
        error: menuError,
        searchItems,
        filterByCategory,
        sortItems,
        resetFilters
    } = useMenu(tableInfo?.restaurantId);

    const [cartItemsCount, setCartItemsCount] = useState(0);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sync URL with filters and pagination
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlPage = params.get('page');
        const urlSearch = params.get('search');
        const urlCategory = params.get('category');
        const urlSort = params.get('sort');

        // Initialize from URL on mount
        if (urlPage) setCurrentPage(parseInt(urlPage));
        if (urlSearch) searchItems(urlSearch);
        if (urlCategory) filterByCategory(urlCategory);
        if (urlSort) sortItems(urlSort as any);
    }, []); // Only run on mount

    // Update URL when filters or page changes
    useEffect(() => {
        const params = new URLSearchParams();

        if (currentPage > 1) params.set('page', currentPage.toString());
        if (filters.searchQuery) params.set('search', filters.searchQuery);
        if (filters.selectedCategory) params.set('category', filters.selectedCategory);
        if (filters.sortBy !== 'name') params.set('sort', filters.sortBy);

        const newSearch = params.toString();
        const currentSearch = location.search.slice(1); // Remove '?'

        if (newSearch !== currentSearch) {
            navigate(`${location.pathname}?${newSearch}`, { replace: true });
        }
    }, [currentPage, filters.searchQuery, filters.selectedCategory, filters.sortBy]);

    // Check if navigated from rejected order
    useEffect(() => {
        if (location.state?.message) {
            toast.warning(location.state.message, {
                position: 'top-center',
                autoClose: 5000,
            });
            // Clear the state to prevent showing toast on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state]);

    // Load cart summary on mount and when table changes
    useEffect(() => {
        loadCartSummary();
    }, [tableInfo?.tableId]);

    const loadCartSummary = async () => {
        try {
            // Get tableId from tableInfo or localStorage
            let currentTableId = tableInfo?.tableId;
            if (!currentTableId) {
                const savedTableInfo = localStorage.getItem('current_table_info');
                if (savedTableInfo) {
                    try {
                        const tableData = JSON.parse(savedTableInfo);
                        currentTableId = tableData.tableId;
                    } catch (e) {
                        console.error('Failed to parse table info:', e);
                    }
                }
            }

            if (currentTableId) {
                // Load table cart
                const cart = await cartService.getTableCart(currentTableId);
                setCartItemsCount(cart.totalItems || 0);
            } else {
                // Fallback to regular cart summary
                const summary = await cartService.getCartSummary();
                setCartItemsCount(summary.itemsCount);
            }
        } catch (error) {
            console.error('Failed to load cart summary:', error);
            setCartItemsCount(0);
        }
    };

    const addToCart = async (itemId: string, isRecommendation: boolean = false) => {
        // Get restaurantId from tableInfo or from the menu item itself
        const item = filteredItems.find(i => i._id === itemId);
        const restaurantId = tableInfo?.restaurantId || item?.restaurantId;

        if (!restaurantId) {
            toast.error('Restaurant information not available');
            return;
        }

        // Check if item has any modifiers - redirect to detail page for modifier selection
        if (item?.modifiers && item.modifiers.length > 0) {
            // Navigate to item detail page for modifier selection
            toast.info('This item has customization options', {
                position: 'top-center',
                autoClose: 2000,
            });
            viewItemDetails(itemId);
            return;
        }

        // Get tableId from tableInfo or localStorage
        let currentTableId = tableInfo?.tableId;
        if (!currentTableId) {
            const savedTableInfo = localStorage.getItem('current_table_info');
            if (savedTableInfo) {
                try {
                    const tableData = JSON.parse(savedTableInfo);
                    currentTableId = tableData.tableId;
                } catch (e) {
                    console.error('Failed to parse table info:', e);
                }
            }
        }

        if (!currentTableId) {
            toast.warning('Please scan QR code first');
            return;
        }

        console.log('🛒 Adding to table cart:', currentTableId);

        setAddingToCart(itemId);
        try {
            // Use table-based cart API
            await cartService.addItemToTableCart(currentTableId, {
                menuItemId: itemId,
                quantity: 1,
                restaurantId: restaurantId,
                modifiers: [],
                specialInstructions: ''
            });

            // Update cart count
            await loadCartSummary();

            // Show success feedback
            toast.success('✅ Added to cart!');
        } catch (error: any) {
            console.error('Add to cart error:', error);
            toast.error('Failed to add to cart. Please try again.');
        } finally {
            setAddingToCart(null);
        }
    };

    // Block direct access - require QR scan
    if (!qrLoading && !tableInfo?.tableId) {
        return <QRScanRequired />;
    }

    const viewItemDetails = (itemId: string) => {
        navigate(`/item/${itemId}`, {
            state: { tableInfo, returnPath: `/menu${tableInfo ? `/table/${tableInfo.tableId}` : ''}` }
        });
    };

    // Helper function to get category name
    const getCategoryName = (categoryId: any): string => {
        if (typeof categoryId === 'object' && categoryId?.name) {
            return categoryId.name;
        }
        return categories.find(cat => cat._id === categoryId)?.name || 'Unknown';
    };

    // Helper function to get emoji for category
    const getCategoryEmoji = (categoryName: string): string => {
        const emojiMap: { [key: string]: string } = {
            'Appetizers': '🥗',
            'Main Dishes': '🍽️',
            'Drinks': '🥤',
            'Desserts': '🍰',
            'Main Course': '🍽️',
            'Beverages': '🥤',
            'Beverage': '🥤'
        };
        return emojiMap[categoryName] || '🍽️';
    };

    const isLoading = qrLoading || menuLoading;

    const handleGuestContinue = () => {
        toast.success('Welcome! Continue browsing as a guest.', {
            position: 'top-center',
            autoClose: 3000,
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* QR Login Modal */}
            <QRLoginModal
                isOpen={showLoginModal}
                onClose={closeLoginModal}
                onGuestContinue={handleGuestContinue}
                tableNumber={tableInfo?.tableNumber}
            />

            {/* Mobile Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Smart Restaurant</h1>
                            {isValidTable && tableInfo && (
                                <p className="text-sm text-gray-600">Table {tableInfo.tableNumber}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Profile Button */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="My Profile"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </button>
                        {/* Order History Button */}
                        <button
                            onClick={() => navigate('/order-history')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Order History"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        {isValidTable && (
                            <div className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
                                Table {tableInfo?.tableNumber}
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 pb-3">
                    <SearchBar
                        onSearch={searchItems}
                        placeholder="🔍 Search menu items..."
                    />
                </div>
            </div>

            <div className="pb-20">
                {qrError && (
                    <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-red-500">⚠️</span>
                            <span className="ml-2 text-red-700 text-sm">{qrError}</span>
                        </div>
                    </div>
                )}

                {menuError && (
                    <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <span className="text-red-500">⚠️</span>
                            <span className="ml-2 text-red-700 text-sm">{menuError}</span>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading menu...</span>
                    </div>
                )}

                {!isLoading && (
                    <>
                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="px-4 mt-4 mb-4">
                                <CategoryFilter
                                    categories={categories}
                                    selectedCategory={filters.selectedCategory}
                                    onCategorySelect={filterByCategory}
                                />
                            </div>
                        )}

                        {/* Sort & Filter Options */}
                        <div className="px-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                    </svg>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => {
                                            sortItems(e.target.value as any);
                                            setCurrentPage(1);
                                        }}
                                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="name">Name (A-Z)</option>
                                        <option value="price">Price (Low to High)</option>
                                        <option value="popularity">Most Popular</option>
                                        <option value="newest">Newest</option>
                                    </select>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="px-4">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
                                    <p className="text-gray-500 mb-4">
                                        {menuError ? 'Unable to load menu items. Please try again later.' : 'Try adjusting your search or filter criteria'}
                                    </p>
                                    {!menuError && (
                                        <button
                                            onClick={() => {
                                                resetFilters();
                                                setCurrentPage(1);
                                            }}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Chef's Recommendations */}
                                    {filters.selectedCategory === null && filters.searchQuery === '' && (
                                        <div className="mb-6">
                                            {filteredItems.filter(item => item.isRecommended && item.status === 'available').length > 0 && (
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                                        <span className="text-2xl mr-2">👨‍🍳</span>
                                                        Chef's Recommendations
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {filteredItems
                                                            .filter(item => item.isRecommended && item.status === 'available')
                                                            .slice(0, 3)
                                                            .map((item) => {
                                                                const categoryName = getCategoryName(item.categoryId);
                                                                const isAvailable = item.status === 'available' && item.isActive;

                                                                return (
                                                                    <div
                                                                        key={item._id}
                                                                        className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-sm border-2 border-amber-200 p-4 hover:shadow-md transition-shadow"
                                                                    >
                                                                        <div className="flex space-x-4">
                                                                            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                                {item.images && item.images.length > 0 ? (
                                                                                    <img
                                                                                        src={getPrimaryImageUrl(item.images, item.primaryImageIndex)}
                                                                                        alt={item.name}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <span className="text-3xl">{getCategoryEmoji(categoryName)}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex justify-between items-start mb-1">
                                                                                    <h3
                                                                                        className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-amber-700"
                                                                                        onClick={() => viewItemDetails(item._id)}
                                                                                    >
                                                                                        {item.name}
                                                                                    </h3>
                                                                                    <p className="text-lg font-bold text-amber-700 ml-4">${item.price.toFixed(2)}</p>
                                                                                </div>
                                                                                <p
                                                                                    className="text-sm text-gray-600 line-clamp-2 cursor-pointer"
                                                                                    onClick={() => viewItemDetails(item._id)}
                                                                                >
                                                                                    {item.description}
                                                                                </p>

                                                                                {/* Order Count */}
                                                                                {(item.totalOrders || 0) > 0 && (
                                                                                    <div className="flex items-center gap-1 mb-2">
                                                                                        <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                                                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                                                                        </svg>
                                                                                        <span className="text-xs font-semibold text-orange-600">
                                                                                            {item.totalOrders} orders
                                                                                        </span>
                                                                                    </div>
                                                                                )}

                                                                                <div className="flex items-center justify-between mt-3">
                                                                                    <span className="text-xs text-amber-600 font-medium">👨‍🍳 Chef's Choice</span>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            if (isAvailable) {
                                                                                                addToCart(item._id, true); // Pass true for recommendations
                                                                                            }
                                                                                        }}
                                                                                        disabled={!isAvailable || addingToCart === item._id}
                                                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isAvailable
                                                                                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                                                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                                            } ${addingToCart === item._id ? 'opacity-50 cursor-wait' : ''}`}
                                                                                    >
                                                                                        {addingToCart === item._id ? (
                                                                                            <span className="flex items-center">
                                                                                                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                                </svg>
                                                                                                Adding...
                                                                                            </span>
                                                                                        ) : '+ Add'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                    <div className="border-t border-gray-200 my-6"></div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Regular Menu Items with Pagination */}
                                    <div className="space-y-4">
                                        {filteredItems
                                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                            .map((item) => {
                                                const isAvailable = item.status === 'available' && item.isActive;
                                                const categoryName = getCategoryName(item.categoryId);

                                                return (
                                                    <div
                                                        key={item._id}
                                                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                                        onClick={() => viewItemDetails(item._id)}
                                                    >
                                                        <div className="flex space-x-4">
                                                            {/* Item Image */}
                                                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                                {item.images && item.images.length > 0 ? (
                                                                    <img
                                                                        src={getPrimaryImageUrl(item.images, item.primaryImageIndex)}
                                                                        alt={item.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="text-3xl">{getCategoryEmoji(categoryName)}</span>
                                                                )}
                                                            </div>

                                                            {/* Item Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                                        {item.name}
                                                                    </h3>
                                                                    <div className="text-right ml-4">
                                                                        <p className="text-lg font-bold text-gray-900">${item.price.toFixed(2)}</p>
                                                                        {!isAvailable && (
                                                                            <span className="text-xs text-red-500">🔴 Sold Out</span>
                                                                        )}
                                                                        {isAvailable && (
                                                                            <span className="text-xs text-green-500">🟢 Available</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    {/* Order Count (Popularity) */}
                                                                    {(item.totalOrders || 0) > 0 && (
                                                                        <div className="flex items-center gap-1">
                                                                            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                                                            </svg>
                                                                            <span className="text-sm font-semibold text-orange-600">
                                                                                {item.totalOrders}
                                                                            </span>
                                                                            <span className="text-xs text-gray-500">orders</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                                    {item.description}
                                                                </p>

                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs text-gray-500">{categoryName}</span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (isAvailable) {
                                                                                addToCart(item._id);
                                                                            }
                                                                        }}
                                                                        disabled={!isAvailable || addingToCart === item._id}
                                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isAvailable
                                                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                            } ${addingToCart === item._id ? 'opacity-50 cursor-wait' : ''}`}
                                                                    >
                                                                        {addingToCart === item._id ? (
                                                                            <span className="flex items-center">
                                                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                                Adding...
                                                                            </span>
                                                                        ) : '+ Add'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>

                                    {/* Pagination */}
                                    {filteredItems.length > itemsPerPage && (
                                        <div className="mt-6 pb-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                    className={`px-4 py-2 rounded-lg font-medium ${currentPage === 1
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    Previous
                                                </button>
                                                <div className="flex items-center space-x-1">
                                                    {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }, (_, i) => i + 1)
                                                        .filter(page => {
                                                            const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
                                                            if (totalPages <= 7) return true;
                                                            if (page === 1 || page === totalPages) return true;
                                                            if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                                                            return false;
                                                        })
                                                        .map((page, index, array) => {
                                                            const prevPage = array[index - 1];
                                                            const showEllipsis = prevPage && page - prevPage > 1;
                                                            return (
                                                                <React.Fragment key={page}>
                                                                    {showEllipsis && (
                                                                        <span className="px-2 text-gray-400">...</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setCurrentPage(page)}
                                                                        className={`w-10 h-10 rounded-lg font-medium ${currentPage === page
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                                            }`}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredItems.length / itemsPerPage), prev + 1))}
                                                    disabled={currentPage >= Math.ceil(filteredItems.length / itemsPerPage)}
                                                    className={`px-4 py-2 rounded-lg font-medium ${currentPage >= Math.ceil(filteredItems.length / itemsPerPage)
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                            <p className="text-center text-sm text-gray-600 mt-3">
                                                Page {currentPage} of {Math.ceil(filteredItems.length / itemsPerPage)}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                <div className="grid grid-cols-3 h-16">
                    <Link to="/" className="flex flex-col items-center justify-center text-blue-600">
                        <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className="text-xs font-medium">Menu</span>
                    </Link>
                    <Link
                        to={tableInfo?.tableId ? `/cart?table_id=${tableInfo.tableId}` : '/cart'}
                        className="flex flex-col items-center justify-center text-gray-400 relative"
                    >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M7 13v6a1 1 0 001 1h8a1 1 0 001-1v-6" />
                        </svg>
                        {cartItemsCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {cartItemsCount}
                            </div>
                        )}
                        <span className="text-xs">Cart({cartItemsCount})</span>
                    </Link>
                    <Link
                        to={(() => {
                            const latestOrderId = localStorage.getItem('latestOrderId');
                            if (latestOrderId) {
                                return `/order-status/${latestOrderId}`;
                            } else if (tableInfo?.tableId) {
                                // Pass table_id to fetch active order for this table
                                return `/order-status?table_id=${tableInfo.tableId}`;
                            }
                            return '/order-status';
                        })()}
                        className="flex flex-col items-center justify-center text-gray-400"
                    >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-2 4h2m-2 4h2" />
                        </svg>
                        <span className="text-xs">Orders</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Menu;