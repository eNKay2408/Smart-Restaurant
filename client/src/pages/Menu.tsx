import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQRTable } from '../hooks/useQRTable';
import { useMenu } from '../hooks/useMenu';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import cartService from '../services/cartService';
import QRScanRequired from '../components/QRScanRequired';
import { toast } from 'react-toastify';
import { getPrimaryImageUrl } from '../utils/imageHelper';


function Menu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { tableInfo, isValidTable, error: qrError, isLoading: qrLoading } = useQRTable();

    // Use backend data through useMenu hook
    const {
        filteredItems,
        categories,
        filters,
        isLoading: menuLoading,
        error: menuError,
        searchItems,
        filterByCategory,
        resetFilters
    } = useMenu(tableInfo?.restaurantId);

    const [cartItemsCount, setCartItemsCount] = useState(0);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

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

    const addToCart = async (itemId: string) => {
        // Get restaurantId from tableInfo or from the menu item itself
        const item = filteredItems.find(i => i._id === itemId);
        const restaurantId = tableInfo?.restaurantId || item?.restaurantId;

        if (!restaurantId) {
            toast.error('Restaurant information not available');
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

    return (
        <div className="min-h-screen bg-gray-50">
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
                            <div className="px-4 mt-4 mb-6">
                                <CategoryFilter
                                    categories={categories}
                                    selectedCategory={filters.selectedCategory}
                                    onCategorySelect={filterByCategory}
                                />
                            </div>
                        )}

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
                                            onClick={resetFilters}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredItems.map((item) => {
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
                                                            <div className="flex text-yellow-400 text-sm">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={i < Math.round(item.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                                                                ))}
                                                            </div>
                                                            {(item.totalReviews || 0) > 0 && (
                                                                <span className="text-sm text-gray-500">({item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'})</span>
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
                            return latestOrderId ? `/order-status/${latestOrderId}` : '/order-status';
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