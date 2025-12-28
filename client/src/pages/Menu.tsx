import { useState } from 'react';
import { useQRTable } from '../hooks/useQRTable';
import { useMenu } from '../hooks/useMenu';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { SortButtons } from '../components/SortControls';

function Menu() {
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
        sortItems,
        resetFilters
    } = useMenu(tableInfo?.restaurantId);
    
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    
    const addToOrder = async (itemId: string) => {
        if (!tableInfo) {
            alert('Please scan a QR code to place orders');
            return;
        }

        try {
            setSelectedItems(prev => [...prev, itemId]);
            // Call backend API to add to order
            const { menuService } = await import('../services/menuService');
            await menuService.addToOrder(itemId, tableInfo.tableId, 1);
            console.log('Added item to order:', itemId, 'for table:', tableInfo.tableNumber);
        } catch (error: any) {
            console.error('Failed to add item to order:', error);
            setSelectedItems(prev => prev.filter(id => id !== itemId));
            alert('Failed to add item to order. Please try again.');
        }
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header with table info if from QR */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        Our Menu
                    </h1>
                    {isValidTable && tableInfo && (
                        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <span>🍽️</span>
                            <span>Table {tableInfo.tableNumber}</span>
                            {tableInfo.area && <span>• {tableInfo.area}</span>}
                        </div>
                    )}
                    {qrError && (
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <span>⚠️</span>
                            <span>{qrError}</span>
                        </div>
                    )}
                    {menuError && (
                        <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <span>⚠️</span>
                            <span>{menuError}</span>
                        </div>
                    )}
                    <p className="text-center text-gray-700 mb-8 text-lg">
                        Delicious dishes prepared with love and care
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                        <span className="ml-3 text-lg text-gray-600">Loading menu...</span>
                    </div>
                )}

                {!isLoading && (
                    <>
                        {/* Search and Filter Controls */}
                        <div className="max-w-6xl mx-auto mb-8 space-y-6">
                            {/* Search Bar */}
                            <div className="flex flex-col lg:flex-row gap-4 items-center">
                                <div className="flex-1 w-full lg:max-w-md">
                                    <SearchBar 
                                        onSearch={searchItems}
                                        placeholder="Search dishes, categories, or ingredients..."
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-sm text-gray-600">
                                        {filteredItems.length} items found
                                    </span>
                                    {(filters.searchQuery || filters.selectedCategory) && (
                                        <button
                                            onClick={resetFilters}
                                            className="text-sm text-orange-600 hover:text-orange-800 underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Filter */}
                            {categories.length > 0 && (
                                <CategoryFilter
                                    categories={categories}
                                    selectedCategory={filters.selectedCategory}
                                    onCategorySelect={filterByCategory}
                                />
                            )}

                            {/* Sort Controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <SortButtons
                                    sortBy={filters.sortBy}
                                    sortOrder={filters.sortOrder}
                                    onSortChange={sortItems}
                                    compact
                                />
                            </div>
                        </div>

                        {/* Menu Items Grid */}
                        <div className="max-w-6xl mx-auto">
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
                                            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow duration-200"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredItems.map((item) => {
                                        const isAvailable = item.status === 'available' && item.isActive;
                                        const categoryName = getCategoryName(item.categoryId);
                                        
                                        return (
                                            <div
                                                key={item._id}
                                                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 ${
                                                    !isAvailable ? 'opacity-60' : ''
                                                }`}
                                            >
                                                <div className="relative">
                                                    <div className="text-5xl mb-4 text-center">
                                                        {getCategoryEmoji(categoryName)}
                                                    </div>
                                                    {!isAvailable && (
                                                        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                            Out of Stock
                                                        </div>
                                                    )}
                                                    {item.isRecommended && isAvailable && (
                                                        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                                            Popular
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <h3 className="text-xl font-semibold mb-2 text-gray-800 text-center">
                                                    {item.name}
                                                </h3>
                                                
                                                <p className="text-sm text-gray-600 mb-2 text-center line-clamp-2">
                                                    {item.description}
                                                </p>
                                                
                                                <div className="flex items-center justify-center gap-2 mb-3">
                                                    <span className="text-sm text-gray-500">{categoryName}</span>
                                                    {item.preparationTime && (
                                                        <span className="text-xs text-gray-400">• {item.preparationTime}min</span>
                                                    )}
                                                </div>
                                                
                                                {item.allergens && item.allergens.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                                                        {item.allergens.slice(0, 3).map((allergen, idx) => (
                                                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                {allergen}
                                                            </span>
                                                        ))}
                                                        {item.allergens.length > 3 && (
                                                            <span className="text-xs text-gray-500">+{item.allergens.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <p className="text-2xl font-bold text-orange-600 text-center mb-4">
                                                    ${item.price.toFixed(2)}
                                                </p>
                                                
                                                <button
                                                    onClick={() => addToOrder(item._id)}
                                                    disabled={!isAvailable}
                                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 rounded-lg hover:shadow-lg transition-shadow duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isAvailable ? 'Add to Order' : 'Unavailable'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
                
                {/* Selected items indicator */}
                {selectedItems.length > 0 && (
                    <div className="fixed bottom-6 right-6 bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg">
                        <span className="text-sm font-medium">
                            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} added
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Menu;