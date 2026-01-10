import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import cartService from '../../services/cartService';
import { toast } from 'react-toastify';

interface PaymentMethod {
    id: string;
    name: string;
    type: 'card' | 'digital' | 'cash';
    icon: string;
    enabled: boolean;
}

const Payment: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderNumber, orderItems, total, showReceipt, order } = location.state || {};

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
    const [tipPercentage, setTipPercentage] = useState(18);
    const [customTip, setCustomTip] = useState('');
    const [showCustomTip, setShowCustomTip] = useState(false);
    const [splitBill, setSplitBill] = useState(false);
    const [splitAmount, setSplitAmount] = useState(2);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const paymentMethods: PaymentMethod[] = [
        { id: 'card', name: 'Credit/Debit Card', type: 'card', icon: '💳', enabled: true },
        { id: 'apple_pay', name: 'Apple Pay', type: 'digital', icon: '🍎', enabled: true },
        { id: 'google_pay', name: 'Google Pay', type: 'digital', icon: '🟢', enabled: true },
        { id: 'paypal', name: 'PayPal', type: 'digital', icon: '🅿️', enabled: true },
        { id: 'cash', name: 'Cash (Pay at counter)', type: 'cash', icon: '💵', enabled: true }
    ];

    const tipOptions = [15, 18, 20, 22];

    // Get table number and ID from order data
    const tableNumber = order?.tableId?.tableNumber || 'N/A';
    const tableId = order?.tableId?._id || order?.tableId;

    // Use real order items from order data
    const displayOrderItems = order?.items || orderItems || [
        { id: '1', name: 'Grilled Salmon', quantity: 2, price: 25.00, modifiers: ['Large', 'Extra sauce'] },
        { id: '2', name: 'Caesar Salad', quantity: 1, price: 18.00, modifiers: ['Add chicken'] }
    ];

    // Calculate from real order data
    const actualSubtotal = order?.total || total || 50.00;
    const subtotal = actualSubtotal;
    const tax = subtotal * 0.08;
    const tipAmount = showCustomTip && customTip ?
        parseFloat(customTip) || 0 :
        subtotal * (tipPercentage / 100);
    const finalTotal = subtotal + tax + tipAmount;
    const perPersonAmount = splitBill ? finalTotal / splitAmount : finalTotal;

    const handleTipSelection = (percentage: number) => {
        setTipPercentage(percentage);
        setShowCustomTip(false);
        setCustomTip('');
    };

    const handleCustomTip = () => {
        setShowCustomTip(true);
        setTipPercentage(0);
    };

    const handlePayment = async () => {
        if (!order?._id) {
            toast.error('Order information is missing');
            return;
        }

        setIsProcessing(true);

        try {
            let paymentResult;

            if (selectedPaymentMethod === 'cash') {
                // Cash payment - show message to customer
                toast.info('Please proceed to the counter to complete your cash payment. A waiter will assist you.');
                setIsProcessing(false);
                return;
            } else {
                // Online payment (card/digital wallet)
                // Use mock payment for demo (replace with real Stripe integration later)
                paymentResult = await paymentService.mockPayment(
                    order._id,
                    selectedPaymentMethod,
                    finalTotal
                );
            }

            if (paymentResult.success) {
                // Clear table cart after successful payment
                if (tableId) {
                    try {
                        await cartService.clearTableCart(tableId);
                        console.log('✅ Table cart cleared after payment');
                    } catch (error) {
                        console.error('Failed to clear cart:', error);
                    }
                }

                setIsProcessing(false);
                setShowPaymentSuccess(true);

                // Auto redirect after success
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 3000);
            } else {
                throw new Error('Payment failed');
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            setIsProcessing(false);
            toast.error(error.message || 'Payment failed. Please try again.');
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const formatTime = () => {
        return new Date().toLocaleString();
    };

    if (showPaymentSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 mx-4 max-w-md w-full text-center">
                    <div className="text-6xl mb-6">✅</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        Thank you for your payment. Your receipt has been sent to your email.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600">Order #{orderNumber || 'ORD-12345'}</p>
                        <p className="text-lg font-bold text-gray-900">${finalTotal.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">Paid via {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">Redirecting to home...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                {showReceipt ? 'Receipt' : 'Payment'}
                            </h1>
                            <p className="text-sm text-gray-600">#{orderNumber || 'ORD-12345'}</p>
                        </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p>Table {tableNumber}</p>
                        <p>{formatTime()}</p>
                    </div>
                </div>
            </div>

            <div className="pb-32">
                {/* Order Summary */}
                <div className="bg-white px-4 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                    <div className="space-y-3">
                        {displayOrderItems.map((item: any) => (
                            <div key={item._id || item.id} className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{item.name || item.menuItemId?.name}</span>
                                        <span className="ml-2 text-gray-500">× {item.quantity}</span>
                                    </div>
                                    {item.modifiers?.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {item.modifiers.map((mod: any) =>
                                                mod.options?.map((opt: any) => opt.name).join(', ') || mod
                                            ).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <span className="font-medium text-gray-900">${(item.subtotal || item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bill Details */}
                <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Tax (8%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Tip ({showCustomTip ? 'Custom' : `${tipPercentage}%`})</span>
                            <span>${tipAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                            <div className="flex justify-between text-lg font-bold text-gray-900">
                                <span>Total</span>
                                <span>${finalTotal.toFixed(2)}</span>
                            </div>
                            {splitBill && (
                                <div className="flex justify-between text-sm text-blue-600 mt-1">
                                    <span>Per person ({splitAmount} people)</span>
                                    <span>${perPersonAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!showReceipt && (
                    <>
                        {/* Tip Selection */}
                        <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Tip</h3>
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {tipOptions.map((percentage) => (
                                    <button
                                        key={percentage}
                                        onClick={() => handleTipSelection(percentage)}
                                        className={`py-2 px-3 rounded-lg border font-medium transition-colors ${tipPercentage === percentage && !showCustomTip
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {percentage}%
                                    </button>
                                ))}
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={handleCustomTip}
                                    className={`px-4 py-2 rounded-lg border font-medium transition-colors ${showCustomTip
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    Custom
                                </button>
                                {showCustomTip && (
                                    <input
                                        type="number"
                                        placeholder="$0.00"
                                        value={customTip}
                                        onChange={(e) => setCustomTip(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Split Bill */}
                        <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Split Bill</h3>
                                <button
                                    onClick={() => setSplitBill(!splitBill)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${splitBill ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${splitBill ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {splitBill && (
                                <div className="flex items-center space-x-4">
                                    <span className="text-gray-600">Split between</span>
                                    <select
                                        value={splitAmount}
                                        onChange={(e) => setSplitAmount(parseInt(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {[2, 3, 4, 5, 6].map(num => (
                                            <option key={num} value={num}>{num} people</option>
                                        ))}
                                    </select>
                                    <span className="text-gray-600">
                                        = <span className="font-bold">${perPersonAmount.toFixed(2)}</span> each
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Payment Methods */}
                        <div className="bg-white mt-2 px-4 py-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                            <div className="space-y-3">
                                {paymentMethods.map((method) => (
                                    <label
                                        key={method.id}
                                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedPaymentMethod === method.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={method.id}
                                            checked={selectedPaymentMethod === method.id}
                                            onChange={() => setSelectedPaymentMethod(method.id)}
                                            disabled={!method.enabled}
                                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="ml-4 flex items-center">
                                            <span className="text-2xl mr-3">{method.icon}</span>
                                            <span className="font-medium text-gray-900">{method.name}</span>
                                        </div>
                                        {!method.enabled && (
                                            <span className="ml-auto text-sm text-gray-500">Unavailable</span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Payment Button */}
            {!showReceipt && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                Processing Payment...
                            </div>
                        ) : (
                            `Pay ${splitBill ? `$${perPersonAmount.toFixed(2)} (Your share)` : `$${finalTotal.toFixed(2)}`}`
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Payment;