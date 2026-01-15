import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';

interface User {
    _id: string;
    fullName: string;
    email: string;
    role: 'admin' | 'waiter' | 'kitchen';
    phone?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: string;
}

interface UserFormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'waiter' | 'kitchen';
    phone: string;
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState<UserFormData>({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'waiter',
        phone: ''
    });
    const [formErrors, setFormErrors] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'waiter' | 'kitchen'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/users');
            if (response.data.success) {
                // Filter out customers, only show staff
                const staffUsers = response.data.data.filter(
                    (user: User) => user.role !== 'customer'
                );
                setUsers(staffUsers);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: any = {};

        if (!formData.fullName.trim()) {
            errors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 2) {
            errors.fullName = 'Full name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (formData.phone && !formData.phone.match(/^[\d\s\-\+\(\)]+$/)) {
            errors.phone = 'Invalid phone number format';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            setSubmitting(true);
            const response = await axiosInstance.post('/users', {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                phone: formData.phone || undefined
            });

            if (response.data.success) {
                toast.success(`✅ ${formData.role === 'waiter' ? 'Waiter' : 'Kitchen Staff'} account created successfully!`);
                setShowCreateModal(false);
                resetForm();
                await fetchUsers();
            }
        } catch (error: any) {
            console.error('Error creating user:', error);
            const errorMsg = error.response?.data?.message || 'Failed to create user';
            toast.error(errorMsg);
            if (errorMsg.includes('already exists')) {
                setFormErrors({ email: 'Email already registered' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'waiter',
            phone: ''
        });
        setFormErrors({});
    };

    const handleToggleActive = async (userId: string, currentStatus: boolean) => {
        try {
            await axiosInstance.patch(`/users/${userId}`, {
                isActive: !currentStatus
            });
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            await fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const getRoleBadge = (role: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
            waiter: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Waiter' },
            kitchen: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Kitchen Staff' }
        };
        const c = config[role] || config.waiter;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        );
    };

    const filteredUsers = users.filter(user => {
        if (filter === 'all') return true;
        return user.role === filter;
    });

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-1">Manage staff accounts and permissions</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Staff Member
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Staff
                        </button>
                        <button
                            onClick={() => setFilter('waiter')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'waiter'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Waiters
                        </button>
                        <button
                            onClick={() => setFilter('kitchen')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'kitchen'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Kitchen Staff
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <p className="text-gray-600 mt-2">Loading users...</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            No staff members found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">{getRoleBadge(user.role)}</td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-gray-900">{user.phone || '-'}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.isActive ? '✓ Active' : '✕ Inactive'}
                                                    </span>
                                                    {user.isEmailVerified && (
                                                        <span className="block text-xs text-green-600">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm text-gray-600">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="py-4 px-6">
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleToggleActive(user._id, user.isActive)}
                                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${user.isActive
                                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                    >
                                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Add Staff Member</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'waiter' })}
                                        className={`p-4 border-2 rounded-lg transition-colors ${formData.role === 'waiter'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">🍽️</div>
                                            <p className="font-medium text-gray-900">Waiter</p>
                                            <p className="text-xs text-gray-500">Serve customers</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'kitchen' })}
                                        className={`p-4 border-2 rounded-lg transition-colors ${formData.role === 'kitchen'
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">👨‍🍳</div>
                                            <p className="font-medium text-gray-900">Kitchen Staff</p>
                                            <p className="text-xs text-gray-500">Prepare orders</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, fullName: e.target.value });
                                        if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter full name"
                                />
                                {formErrors.fullName && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="email@example.com"
                                />
                                {formErrors.email && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="(optional)"
                                />
                                {formErrors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Min 8 characters"
                                />
                                {formErrors.password && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    At least 8 characters with uppercase, lowercase, and number
                                </p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                                    }}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Re-enter password"
                                />
                                {formErrors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${submitting
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {submitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default UserManagement;
