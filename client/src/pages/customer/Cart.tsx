import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import cartService, { Cart as CartType } from '../../services/cartService';
import orderService from '../../services/orderService';
import { tableService } from '../../services/tableService';
import { promotionService, PromotionValidationResult } from '../../services/promotionService';
import { useQRTable } from '../../hooks/useQRTable';
import { toast } from 'react-toastify';


const Cart: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { tableInfo: qrTableInfo, isLoading: qrLoading } = useQRTable();

    const [cart, setCart] = useState<CartType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<PromotionValidationResult | null>(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [tableInfo, setTableInfo] = useState<{ tableNumber: number; area?: string; tableId?: string } | null>(null);

    // Load cart on mount and when table info changes
    useEffect(() => {
        loadCart();
    }, [qrTableInfo]);

    const loadCart = async () => {
        try {
            setLoading(true);
            setError(null);

            // Priority order for table info:
            // 1. From URL/QR code (qrTableInfo)
            // 2. From localStorage
            let currentTableId = qrTableInfo?.tableId;

            if (!currentTableId) {
                // Try to get table info from localStorage
                const savedTableInfo = localStorage.getItem('current_table_info');
                if (savedTableInfo) {
                    try {
                        const tableData = JSON.parse(savedTableInfo);
                        if (tableData.tableId) {
                            currentTableId = tableData.tableId;
                            console.log('🔄 Using tableId from localStorage:', currentTableId);
                        }
                    } catch (e) {
                        console.error('Failed to parse saved table info:', e);
                    }
                }
            }

            // Ensure tableId is a string, not an object
            if (currentTableId && typeof currentTableId === 'object') {
                currentTableId = (currentTableId as any)._id || String(currentTableId);
            }

            console.log('📦 Loading cart for tableId:', currentTableId);

            // Load cart by tableId (dine-in) or regular cart
            const data = currentTableId
                ? await cartService.getTableCart(currentTableId)
                : await cartService.getCart();

            setCart(data);

            // Fetch table information if tableId exists
            if (currentTableId) {
                try {
                    const tableResponse = await tableService.getTable(currentTableId);
                    if (tableResponse.success && tableResponse.data) {
                        const tableData = {
                            tableId: currentTableId,
                            tableNumber: typeof tableResponse.data.tableNumber === 'string'
                                ? parseInt(tableResponse.data.tableNumber)
                                : tableResponse.data.tableNumber,
                            area: tableResponse.data.location
                        };
                        setTableInfo(tableData);

                        // Update URL to include table info if not already there
                        if (!searchParams.get('table_id')) {
                            const newUrl = `/cart?table_id=${currentTableId}`;
                            window.history.replaceState({}, '', newUrl);
                        }
                    }
                } catch (tableError) {
                    console.error('Failed to load table info:', tableError);
                    // Don't fail the whole cart load if table info fails
                }
            } else {
                setTableInfo(null);
            }
        } catch (err: any) {
            console.error('Load cart error:', err);
            setError('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }

        try {
            // Get tableId
            const currentTableId = tableInfo?.tableId || cart?.tableId;

            if (currentTableId) {
                // Use table-based cart
                const updatedCart = await cartService.updateTableCartItem(currentTableId, itemId, {
                    quantity: newQuantity
                });
                setCart(updatedCart);
            } else {
                // Fallback to regular cart
                const updatedCart = await cartService.updateCartItem(itemId, {
                    quantity: newQuantity
                });
                setCart(updatedCart);
            }
        } catch (err: any) {
            console.error('Update quantity error:', err);
            toast.error('Failed to update quantity');
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            // Get tableId
            const currentTableId = tableInfo?.tableId || cart?.tableId;

            if (currentTableId) {
                // Use table-based cart
                const updatedCart = await cartService.removeTableCartItem(currentTableId, itemId);
                setCart(updatedCart);
            } else {
                // Fallback to regular cart
                const updatedCart = await cartService.removeCartItem(itemId);
                setCart(updatedCart);
            }
        } catch (err: any) {
            console.error('Remove item error:', err);
            toast.error('Failed to remove item');
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            toast.error('Please enter a promo code');
            return;
        }

        if (!cart?.restaurantId) {
            toast.error('Restaurant information is missing');
            return;
        }

        try {
            // Call real API to validate promo code
            const result = await promotionService.validatePromotionCode(
                promoCode,
                subtotal,
                cart.restaurantId
            );

            if (result.success && result.data) {
                setAppliedPromo(result.data);
                setPromoCode('');
                toast.success(`Promo code "${result.data.code}" applied successfully!`);
            }
        } catch (error: any) {
            console.error('Promo validation error:', error);
            toast.error(error.message || 'Invalid promo code');
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
    };

    const handleCheckout = async () => {
        if (!cart || cart.items.length === 0) {
            toast.warning('Your cart is empty');
            return;
        }

        try {
            setPlacingOrder(true);

            // Get tableId from tableInfo state (already resolved from URL/cart/localStorage)
            const finalTableId = tableInfo?.tableId || cart.tableId;

            // Validate tableId is present (required for dine-in)
            if (!finalTableId) {
                throw new Error('Table information is required. Please scan the QR code on your table.');
            }

            // Create order from cart
            const orderData: any = {
                restaurantId: cart.restaurantId,
                tableId: finalTableId, // Use finalTableId from cart or localStorage
                customerId: cart.customerId,
                guestName: 'Guest',
                items: cart.items.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    modifiers: item.modifiers,
                    specialInstructions: item.specialInstructions
                })),
                orderNotes: ''
            };

            const response = await orderService.createOrder(orderData);

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to create order');
            }

            const order = response.data;

            // ✅ Cart is automatically cleared by backend in orderController.js
            // No need to manually clear here

            // Store latest order ID for Orders tab navigation
            localStorage.setItem('latestOrderId', order._id);

            // Navigate to order status with order ID in URL
            navigate(`/order-status/${order._id}`, {
                state: {
                    orderNumber: order.orderNumber
                }
            });
        } catch (error: any) {
            console.error('Create order error:', error);
            toast.error(error.message || 'Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleContinueShopping = () => {
        navigate('/menu');
    };

    const handleBack = () => {
        navigate(-1);
    };

    // Calculate totals
    const subtotal = cart?.total || 0;
    const tax = subtotal * 0.08; // 8% tax
    const tip = subtotal * 0.18; // 18% tip
    const discount = appliedPromo ? appliedPromo.discountAmount : 0;
    const total = subtotal + tax + tip - discount;

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading cart...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Cart</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadCart}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty cart state
    if (!cart || cart.items.length === 0) {
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
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">Your Cart</h1>
                        {tableInfo && (
                            <p className="text-sm text-blue-600 font-medium">
                                🪑 Table {tableInfo.tableNumber}
                                {tableInfo.area && ` - ${tableInfo.area}`}
                            </p>
                        )}
                    </div>
                    <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>

            <div className="pb-32">
                {/* Warning if no table info */}
                {!cart.tableId && !tableInfo && (
                    <div className="mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-yellow-800 mb-1">No Table Selected</h4>
                                <p className="text-sm text-yellow-700 mb-3">
                                    Please scan the QR code on your table to place an order.
                                    Orders must be associated with a table.
                                </p>
                                <button
                                    onClick={() => navigate('/menu')}
                                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                                >
                                    Scan QR Code
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cart Items */}
                <div className="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                        <div key={item._id} className="bg-white px-4 py-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🍽️</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                    <p className="text-gray-600 text-sm mb-2">${item.price.toFixed(2)}</p>

                                    {item.modifiers && item.modifiers.length > 0 && (
                                        <div className="mb-2">
                                            {item.modifiers.map((modifier, modIdx) => (
                                                <div key={modIdx}>
                                                    {modifier.options.map((option, optIdx) => (
                                                        <span key={optIdx} className="text-xs text-gray-600">
                                                            + {option.name} (+${option.priceAdjustment.toFixed(2)})
                                                            {optIdx < modifier.options.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                </div>
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
                                                onClick={() => handleQuantityChange(item._id!, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                <span className="text-lg font-bold text-gray-600">-</span>
                                            </button>
                                            <span className="text-lg font-semibold w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item._id!, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                                            >
                                                <span className="text-lg font-bold text-gray-600">+</span>
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">${item.subtotal.toFixed(2)}</p>
                                            <button
                                                onClick={() => handleRemoveItem(item._id!)}
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
                                    -{appliedPromo.discountType === 'percentage'
                                        ? `${appliedPromo.discountValue}%`
                                        : `$${appliedPromo.discountValue}`}
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

                    {/* Table Information */}
                    {tableInfo && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-2xl mr-2">🪑</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Dining at</p>
                                        <p className="text-base font-bold text-blue-700">
                                            Table {tableInfo.tableNumber}
                                            {tableInfo.area && ` - ${tableInfo.area}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                    disabled={placingOrder}
                    className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${placingOrder
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {placingOrder ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Placing Order...
                        </span>
                    ) : `Place Order - $${total.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
};

export default Cart;