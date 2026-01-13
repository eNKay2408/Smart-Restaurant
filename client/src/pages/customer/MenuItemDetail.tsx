import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import menuService from '../../services/menuService';
import cartService from '../../services/cartService';
import { useQRTable } from '../../hooks/useQRTable';
import { getPrimaryImageUrl } from '../../utils/imageHelper';
import { toast } from 'react-toastify';

interface Modifier {
    id: string;
    name: string;
    price: number;
    selected: boolean;
}

interface ModifierGroup {
    id: string;
    name: string;
    required: boolean;
    multiSelect: boolean;
    options: Modifier[];
}

const MenuItemDetail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { itemId } = useParams<{ itemId: string }>();
    const { tableInfo, returnPath } = location.state || {};
    const { tableInfo: qrTableInfo, isLoading: qrLoading } = useQRTable();

    const [quantity, setQuantity] = useState(1);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
    const [addingToCart, setAddingToCart] = useState(false);

    // Fetch menu item data on mount
    useEffect(() => {
        const fetchMenuItem = async () => {
            if (!itemId) return;

            try {
                setLoading(true);
                const response = await menuService.getMenuItem(itemId);

                if (response.success && response.data) {
                    setItem(response.data);

                    // Transform backend modifiers to frontend format
                    if (response.data.modifiers && response.data.modifiers.length > 0) {
                        const transformedModifiers = response.data.modifiers.map((modifier: any, idx: number) => ({
                            id: `mod-${idx}`,
                            name: modifier.name,
                            required: modifier.required || false,
                            multiSelect: modifier.type === 'multiple', // Backend uses 'single' or 'multiple'
                            options: modifier.options.map((option: any, optIdx: number) => ({
                                id: `${idx}-${optIdx}`,
                                name: option.name,
                                price: option.priceAdjustment || 0, // Backend uses 'priceAdjustment'
                                selected: false
                            }))
                        }));
                        setModifierGroups(transformedModifiers);
                    }
                }
            } catch (error) {
                console.error('Error fetching menu item:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenuItem();
    }, [itemId]);

    const handleModifierChange = (groupId: string, optionId: string) => {
        setModifierGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                if (group.multiSelect) {
                    return {
                        ...group,
                        options: group.options.map(option =>
                            option.id === optionId
                                ? { ...option, selected: !option.selected }
                                : option
                        )
                    };
                } else {
                    return {
                        ...group,
                        options: group.options.map(option => ({
                            ...option,
                            selected: option.id === optionId
                        }))
                    };
                }
            }
            return group;
        }));
    };

    const calculateTotalPrice = () => {
        let total = item.price * quantity;
        modifierGroups.forEach(group => {
            group.options.forEach(option => {
                if (option.selected) {
                    total += option.price * quantity;
                }
            });
        });
        return total;
    };

    const handleAddToCart = async () => {
        // Check if item is available
        if (!isAvailable) {
            toast.error('This item is currently unavailable');
            return;
        }
        
        setAddingToCart(true);
        
        try {
            // Get current table info - priority: passed prop, QR scan, localStorage
            let currentTableInfo = tableInfo || qrTableInfo;
            
            if (!currentTableInfo) {
                // Try to get table info from localStorage
                const savedTableInfo = localStorage.getItem('current_table_info');
                if (savedTableInfo) {
                    try {
                        const tableData = JSON.parse(savedTableInfo);
                        if (tableData.tableId) {
                            currentTableInfo = tableData;
                            console.log('🔄 Using tableId from localStorage:', tableData.tableId);
                        }
                    } catch (e) {
                        console.error('Failed to parse saved table info:', e);
                    }
                }
            }
            
            if (!currentTableInfo?.tableId) {
                toast.error('Table information not available. Please scan QR code again.');
                return;
            }
            
            // Get restaurantId
            const restaurantId = currentTableInfo.restaurantId || item.restaurantId;
            if (!restaurantId) {
                toast.error('Restaurant information not available');
                return;
            }
            
            // Prepare modifiers in the expected format (CartModifier interface)
            const selectedModifiers = modifierGroups
                .filter(group => group.options.some(option => option.selected))
                .map(group => ({
                    name: group.name,
                    options: group.options
                        .filter(option => option.selected)
                        .map(option => ({
                            name: option.name,
                            priceAdjustment: option.price
                        }))
                }));
            
            console.log('🛒 Adding to table cart:', currentTableInfo.tableId);
            console.log('📝 Item data:', {
                menuItemId: item._id,
                quantity,
                modifiers: selectedModifiers,
                specialInstructions
            });

            // Use table-based cart API
            await cartService.addItemToTableCart(currentTableInfo.tableId, {
                menuItemId: item._id,
                quantity,
                restaurantId: restaurantId,
                modifiers: selectedModifiers,
                specialInstructions
            });

            // Show success feedback
            toast.success('✅ Added to cart!');
            
            // Navigate back based on context
            if (returnPath) {
                navigate(returnPath);
            } else {
                navigate('/menu');
            }
            
        } catch (error: any) {
            console.error('Add to cart error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add to cart. Please try again.';
            toast.error(errorMessage);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading || !item) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading menu item...</p>
                </div>
            </div>
        );
    }

    // Calculate availability same as Menu page
    const isAvailable = item.status === 'available' && item.isActive;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">Menu Item</h1>
                        {tableInfo && (
                            <p className="text-sm text-gray-600">Table {tableInfo.tableNumber}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="pb-24">
                {/* Item Image */}
                <div className="bg-white">
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        {item.images && item.images.length > 0 ? (
                            <img
                                src={getPrimaryImageUrl(item.images, item.primaryImageIndex)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-8xl">🍽️</span>
                        )}
                    </div>
                </div>

                {/* Item Info */}
                <div className="bg-white px-4 py-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                        <span className={`text-sm px-2 py-1 rounded-full ${isAvailable
                            ? 'text-green-600 bg-green-100'
                            : 'text-red-600 bg-red-100'
                            }`}>
                            {isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                        </span>
                        {item.category && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {item.category.name}
                            </span>
                        )}
                    </div>

                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>

                {/* Modifiers */}
                {modifierGroups.map((group) => (
                    <div key={group.id} className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {group.name}
                            {group.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <div className="space-y-3">
                            {group.options.map((option) => (
                                <label
                                    key={option.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                >
                                    <div className="flex items-center">
                                        <input
                                            type={group.multiSelect ? 'checkbox' : 'radio'}
                                            name={group.id}
                                            checked={option.selected}
                                            onChange={() => handleModifierChange(group.id, option.id)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-3 text-gray-900">{option.name}</span>
                                    </div>
                                    <span className="text-gray-600 font-medium">
                                        {option.price > 0 ? `+$${option.price}` : 'Free'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Special Instructions */}
                <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h3>
                    <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special requests? (optional)"
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                    />
                </div>

                {/* Nutrition & Ingredients - Not available in backend yet */}
                {/* 
                <div className="bg-white mt-2 px-4 py-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Nutrition Facts</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Protein</span>
                                    <span className="font-medium">{item.nutritionFacts.protein}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Carbs</span>
                                    <span className="font-medium">{item.nutritionFacts.carbs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fat</span>
                                    <span className="font-medium">{item.nutritionFacts.fat}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fiber</span>
                                    <span className="font-medium">{item.nutritionFacts.fiber}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                            <div className="flex flex-wrap gap-2">
                                {item.ingredients.map((ingredient, index) => (
                                    <span
                                        key={index}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                    >
                                        {ingredient}
                                    </span>
                                ))}
                            </div>

                            {item.allergens.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Allergens</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {item.allergens.map((allergen, index) => (
                                            <span
                                                key={index}
                                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                                            >
                                                ⚠️ {allergen}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                */}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                            <span className="text-xl font-bold text-gray-600">-</span>
                        </button>
                        <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                            <span className="text-xl font-bold text-gray-600">+</span>
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold text-gray-900">${calculateTotalPrice().toFixed(2)}</p>
                    </div>
                </div>

                <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !isAvailable}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        addingToCart || !isAvailable
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {addingToCart ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding to Cart...
                        </span>
                    ) : !isAvailable ? (
                        'Currently Unavailable'
                    ) : (
                        'Add to Cart'
                    )}
                </button>
            </div >
        </div >
    );
};

export default MenuItemDetail;