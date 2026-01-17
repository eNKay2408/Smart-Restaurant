import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { ApiError } from '../types/auth.types';

interface QRLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGuestContinue: () => void;
    tableNumber?: number;
    tableId?: string;
}

const QRLoginModal: React.FC<QRLoginModalProps> = ({ 
    isOpen, 
    onClose, 
    onGuestContinue,
    tableNumber,
    tableId
}) => {
    const navigate = useNavigate();
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password,
                role: 'customer'
            });

            if (response.success) {
                // Store that user is authenticated for this session and table
                localStorage.setItem('qr_session_authenticated', 'true');
                if (tableId) {
                    localStorage.setItem('last_authenticated_table', tableId);
                }
                onClose();
            }
        } catch (error: any) {
            const apiError = error as ApiError;
            setError(apiError.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGuestContinue = () => {
        // Create a guest session
        const guestUser = {
            id: `guest-${Date.now()}`,
            fullName: 'Guest User',
            email: '',
            role: 'customer',
            isGuest: true
        };

        // Store guest session
        localStorage.setItem('guest_user', JSON.stringify(guestUser));
        localStorage.setItem('qr_session_authenticated', 'guest');
        if (tableId) {
            localStorage.setItem('last_authenticated_table', tableId);
        }
        
        onGuestContinue();
        onClose();
    };

    const handleRegisterRedirect = () => {
        // Save the current URL to return after registration
        localStorage.setItem('return_after_register', window.location.pathname + window.location.search);
        navigate('/register');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {!showLoginForm ? (
                    // Welcome Screen
                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome!
                            </h2>
                            {tableNumber && (
                                <p className="text-sm text-gray-600">
                                    Table #{tableNumber}
                                </p>
                            )}
                            <p className="text-gray-600 mt-2">
                                How would you like to continue?
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {/* Guest Button */}
                            <button
                                onClick={handleGuestContinue}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-center">
                                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Continue as Guest
                                </div>
                                <p className="text-sm text-blue-100 mt-1">Quick and easy ordering</p>
                            </button>

                            {/* Login Button */}
                            <button
                                onClick={() => setShowLoginForm(true)}
                                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                            >
                                <div className="flex items-center justify-center">
                                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Login
                                </div>
                                <p className="text-sm text-gray-500 mt-1">Access your account & history</p>
                            </button>

                            {/* Register Link */}
                            <div className="text-center pt-2">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={handleRegisterRedirect}
                                        className="text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </div>

                        {/* Benefits Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Why create an account?</p>
                            <div className="space-y-2">
                                <div className="flex items-start text-sm text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    View order history & reorder favorites
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Get exclusive deals & promotions
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Faster checkout with saved preferences
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Login Form
                    <div className="p-8">
                        {/* Back Button */}
                        <button
                            onClick={() => {
                                setShowLoginForm(false);
                                setError('');
                                setFormData({ email: '', password: '' });
                            }}
                            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Welcome Back
                            </h2>
                            <p className="text-gray-600">
                                Sign in to your account
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Logging in...
                                    </div>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        {/* Continue as Guest */}
                        <button
                            onClick={handleGuestContinue}
                            className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all"
                        >
                            Continue as Guest
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRLoginModal;
