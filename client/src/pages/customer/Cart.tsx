import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CartItem {
    id: string;
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    modifiers: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    specialInstructions?: string;
    totalPrice: number;
}

const Cart: React.FC = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItem[]>([
        {
            id: '1',
            itemId: '1',
            name: 'Grilled Salmon',
            price: 18,
            quantity: 2,
            modifiers: [
                { id: '1-2', name: 'Large', price: 5 },
                { id: '2-2', name: 'Extra sauce', price: 2 }
            ],
            specialInstructions: 'Medium-rare please',
            totalPrice: 50
        },
        {
            id: '2',
            itemId: '2',
            name: 'Caesar Salad',
            price: 12,
            quantity: 1,
            modifiers: [
                { id: '3-1', name: 'Add chicken', price: 6 }
            ],
            totalPrice: 18
        }
    ]);

    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);

    const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08; // 8% tax
    const tip = subtotal * 0.18; // 18% tip
    const discount = appliedPromo 
        ? appliedPromo.type === 'percentage' 
            ? subtotal * (appliedPromo.discount / 100)
            : appliedPromo.discount
        : 0;
    const total = subtotal + tax + tip - discount;

    const handleQuantityChange = (id: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(id);
            return;
        }

        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const basePrice = item.price;
                const modifierPrice = item.modifiers.reduce((sum, mod) => sum + mod.price, 0);
                const totalPrice = (basePrice + modifierPrice) * newQuantity;
                return { ...item, quantity: newQuantity, totalPrice };
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const handleApplyPromo = () => {
        // Mock promo validation
        const promos = {
            'SAVE10': { code: 'SAVE10', discount: 10, type: 'percentage' as const },
            'FIRST5': { code: 'FIRST5', discount: 5, type: 'fixed' as const }
        };

        const promo = promos[promoCode as keyof typeof promos];
        if (promo) {
            setAppliedPromo(promo);
            setPromoCode('');
        } else {
            alert('Invalid promo code');
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
    };

    const handleCheckout = () => {
        navigate('/order-status', { 
            state: { 
                cartItems,
                orderTotal: total,
                orderTime: new Date()
            }
        });
    };

    const handleContinueShopping = () => {
        navigate('/menu');
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (cartItems.length === 0) {
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
                        <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
                    </div>
                </div>

                {/* Empty Cart State */}
                <div className="flex flex-col items-center justify-center px-4 py-16">
                    <div className="text-8xl mb-6">🛒</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 text-center mb-8 max-w-sm">
                        Looks like you haven't added anything to your cart yet. Start browsing our delicious menu!
                    </p>
                    <button
                        onClick={handleContinueShopping}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
                    <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>

            <div className="pb-32">
                {/* Cart Items */}
                <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                        <div key={item.id} className="bg-white px-4 py-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🍽️</span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                    <p className="text-gray-600 text-sm mb-2">${item.price}</p>
                                    
                                    {item.modifiers.length > 0 && (
                                        <div className="mb-2">
                                            {item.modifiers.map((modifier, index) => (
                                                <span key={modifier.id} className="text-xs text-gray-600">
                                                    + {modifier.name} (+${modifier.price})
                                                    {index < item.modifiers.length - 1 && ', '}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {item.specialInstructions && (
                                        <p className="text-xs text-gray-500 italic mb-3">
                                            Note: {item.specialInstructions}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                <span className="text-lg font-bold text-gray-600">-</span>
                                            </button>
                                            <span className="text-lg font-semibold w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                <span className="text-lg font-bold text-gray-600">+</span>
                                            </button>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">${item.totalPrice.toFixed(2)}</p>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-red-500 text-sm hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Promo Code Section */}
                <div className="bg-white mt-2 px-4 py-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Promo Code</h3>
                    
                    {appliedPromo ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <span className="text-green-600 mr-2">✓</span>
                                <span className="font-medium text-green-800">{appliedPromo.code}</span>
                                <span className="text-green-600 ml-2 text-sm">
                                    -{appliedPromo.type === 'percentage' 
                                        ? `${appliedPromo.discount}%` 
                                        : `$${appliedPromo.discount}`}
                                </span>
                            </div>
                            <button
                                onClick={handleRemovePromo}
                                className="text-red-500 hover:text-red-600 text-sm"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                placeholder="Enter promo code"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={handleApplyPromo}
                                disabled={!promoCode.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="bg-white mt-2 px-4 py-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        
                        {appliedPromo && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount ({appliedPromo.code})</span>
                                <span>-${discount.toFixed(2)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-gray-600">
                            <span>Tax</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                            <span>Tip (18%)</span>
                            <span>${tip.toFixed(2)}</span>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between text-lg font-bold text-gray-900">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Shopping */}
                <div className="px-4 py-4">
                    <button
                        onClick={handleContinueShopping}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>

            {/* Bottom Checkout Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
                <button
                    onClick={handleCheckout}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                    Place Order - ${total.toFixed(2)}
                </button>
            </div>
        </div>
    );
};

export default Cart;