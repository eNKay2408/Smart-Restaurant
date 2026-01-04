import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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

    const [quantity, setQuantity] = useState(1);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([
        {
            id: '1',
            name: 'Size',
            required: false,
            multiSelect: false,
            options: [
                { id: '1-1', name: 'Regular', price: 0, selected: true },
                { id: '1-2', name: 'Large', price: 5, selected: false }
            ]
        },
        {
            id: '2',
            name: 'Extras',
            required: false,
            multiSelect: true,
            options: [
                { id: '2-1', name: 'Side salad', price: 4, selected: false },
                { id: '2-2', name: 'Extra sauce', price: 2, selected: false },
                { id: '2-3', name: 'Extra cheese', price: 3, selected: false }
            ]
        }
    ]);

    // Mock item data - in real app this would come from API
    const item = {
        id: itemId || '1',
        name: 'Grilled Salmon',
        price: 18,
        description: 'Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables and lemon. Our signature dish features a perfectly seasoned fillet cooked to your preference.',
        image: '🍣',
        rating: 4.5,
        reviews: 24,
        prepTime: 15,
        calories: 320,
        ingredients: ['Atlantic Salmon', 'Mixed Vegetables', 'Lemon', 'Herbs', 'Olive Oil'],
        allergens: ['Fish'],
        nutritionFacts: {
            protein: '35g',
            carbs: '8g',
            fat: '15g',
            fiber: '3g'
        }
    };

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

    const handleAddToCart = () => {
        const selectedModifiers = modifierGroups.flatMap(group =>
            group.options.filter(option => option.selected)
        );

        const cartItem = {
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity,
            modifiers: selectedModifiers,
            specialInstructions,
            totalPrice: calculateTotalPrice()
        };

        console.log('Adding to cart:', cartItem);
        
        // Navigate back to menu or cart
        if (returnPath) {
            navigate(returnPath);
        } else {
            navigate('/cart');
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

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
                        <span className="text-8xl">{item.image}</span>
                    </div>
                </div>

                {/* Item Info */}
                <div className="bg-white px-4 py-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">${item.price}</p>
                            <div className="flex items-center mt-1">
                                <div className="flex text-yellow-400 text-sm mr-2">
                                    {[...Array(Math.floor(item.rating))].map((_, i) => (
                                        <span key={i}>★</span>
                                    ))}
                                    {item.rating % 1 !== 0 && <span>☆</span>}
                                </div>
                                <span className="text-sm text-gray-500">({item.reviews} reviews)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">🟢 Available</span>
                        <span className="text-sm text-gray-600">⏱️ {item.prepTime} min</span>
                        <span className="text-sm text-gray-600">🔥 {item.calories} cal</span>
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

                {/* Nutrition & Ingredients */}
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
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

export default MenuItemDetail;