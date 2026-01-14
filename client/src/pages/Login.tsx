import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRestaurant } from '../contexts/RestaurantContext';
import { authService } from '../services/authService';
import type { LoginRequest, ApiError } from '../types/auth.types';

function Login() {
    const navigate = useNavigate();
    const { setRestaurantId } = useRestaurant();
    const [formData, setFormData] = useState<LoginRequest>({
        email: '',
        password: '',
        role: 'admin' // admin, staff, or customer
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await authService.login(formData);

            if (response.success) {
                setSuccess('Login successful! Redirecting...');

                // Save restaurantId to context if available
                if (response.data.user.restaurantId) {
                    setRestaurantId(response.data.user.restaurantId);
                }

                // Redirect based on user role
                setTimeout(() => {
                    const userRole = response.data.user.role;
                    if (userRole === 'admin') {
                        navigate('/admin/dashboard');
                    } else if (userRole === 'waiter') {
                        navigate('/waiter/orders');
                    } else if (userRole === 'kitchen') {
                        navigate('/kitchen/kds');
                    } else if (userRole === 'customer') {
                        navigate('/menu');
                    } else {
                        navigate('/');
                    }
                }, 1500);
            }
        } catch (error: any) {
            const apiError = error as ApiError;
            setError(apiError.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const fillDemoCredentials = (role: string) => {
        const credentials = {
            admin: { email: 'admin@restaurant.com', password: 'Admin123' },
            waiter: { email: 'waiter@restaurant.com', password: 'Waiter123' },
            kitchen: { email: 'kitchen@restaurant.com', password: 'Kitchen123' },
            customer: { email: 'customer@example.com', password: 'Customer123' },
        };

        const creds = credentials[role as keyof typeof credentials];
        if (creds) {
            setFormData({
                email: creds.email,
                password: creds.password,
                role: (role === 'waiter' || role === 'kitchen' ? 'staff' : role) as 'admin' | 'staff' | 'customer'
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                        <p className="text-purple-200">Sign in to access your dashboard</p>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-100 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Demo Credentials */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                        <h3 className="text-sm font-semibold text-purple-100 mb-3">🎭 Demo Credentials - Click to fill:</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => fillDemoCredentials('admin')}
                                className="text-xs px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-100 rounded-lg transition-colors"
                            >
                                👨‍💼 Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemoCredentials('waiter')}
                                className="text-xs px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-100 rounded-lg transition-colors"
                            >
                                👨‍🍳 Waiter
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemoCredentials('kitchen')}
                                className="text-xs px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-100 rounded-lg transition-colors"
                            >
                                🍳 Kitchen
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemoCredentials('customer')}
                                className="text-xs px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-100 rounded-lg transition-colors"
                            >
                                👤 Customer
                            </button>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-purple-100 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                                    placeholder="admin@restaurant.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-purple-100 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="block w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-300 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400 focus:ring-offset-0"
                                />
                                <span className="ml-2 text-sm text-purple-100">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-sm text-purple-200 hover:text-white transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-purple-200 mb-2">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-white font-semibold hover:underline">
                                Sign Up
                            </Link>
                        </p>
                        <p className="text-sm text-purple-200">
                            Smart Restaurant Management System
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center text-purple-200 text-sm">
                    <p>Need help? Contact your system administrator</p>
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}

export default Login;
