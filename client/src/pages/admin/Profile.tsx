import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

interface AdminProfileData {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    isEmailVerified: boolean;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const AdminProfile: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<AdminProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    // Profile form
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        phone: ''
    });
    const [profileErrors, setProfileErrors] = useState<any>({});
    const [savingProfile, setSavingProfile] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState<PasswordForm>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState<any>({});
    const [savingPassword, setSavingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const currentUser = authService.getCurrentUser();

            if (!currentUser) {
                toast.error('Please login to view profile');
                navigate('/login');
                return;
            }

            const userProfile: AdminProfileData = {
                ...currentUser,
                isEmailVerified: currentUser.isEmailVerified || false,
                phone: (currentUser as any).phone || ''
            };
            setUser(userProfile);
            setProfileForm({
                fullName: currentUser.fullName || '',
                phone: (currentUser as any).phone || ''
            });

            // Try to fetch fresh data
            try {
                const response = await authService.getProfile();
                if (response.success && response.data) {
                    setUser(response.data);
                    setProfileForm({
                        fullName: response.data.fullName || '',
                        phone: response.data.phone || ''
                    });
                }
            } catch (apiError) {
                console.error('Error fetching fresh profile:', apiError);
            }
        } catch (error: any) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const validateProfileForm = (): boolean => {
        const errors: any = {};

        if (!profileForm.fullName.trim()) {
            errors.fullName = 'Full name is required';
        } else if (profileForm.fullName.trim().length < 2) {
            errors.fullName = 'Full name must be at least 2 characters';
        }

        if (profileForm.phone && !profileForm.phone.match(/^[\d\s\-\+\(\)]+$/)) {
            errors.phone = 'Please enter a valid phone number';
        }

        setProfileErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validatePasswordForm = (): boolean => {
        const errors: any = {};

        if (!passwordForm.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }

        if (!passwordForm.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordForm.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
            errors.newPassword = 'Password must contain uppercase, lowercase, and number';
        }

        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateProfileForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            setSavingProfile(true);
            const response = await authService.updateProfile(profileForm);

            if (response.success) {
                toast.success('✅ Profile updated successfully!');
                await fetchUserProfile();
            } else {
                toast.error(response.message || 'Failed to update profile');
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePasswordForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            setSavingPassword(true);
            const response = await authService.updatePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response.success) {
                toast.success('✅ Password updated successfully!');
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setPasswordErrors({});
            } else {
                toast.error(response.message || 'Failed to update password');
            }
        } catch (error: any) {
            console.error('Update password error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update password';
            toast.error(errorMsg);
            if (errorMsg.includes('incorrect')) {
                setPasswordErrors({ currentPassword: 'Current password is incorrect' });
            }
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Please login to view profile</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Login
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                            {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                            <p className="text-gray-600">{user.email}</p>
                            {user.phone && <p className="text-gray-600">{user.phone}</p>}
                            <div className="flex items-center mt-2 space-x-2">
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full capitalize font-medium">
                                    {user.role}
                                </span>
                                {user.isEmailVerified && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <div className="flex px-6">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Profile Information
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${activeTab === 'password'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.fullName}
                                        onChange={(e) => {
                                            setProfileForm({ ...profileForm, fullName: e.target.value });
                                            if (profileErrors.fullName) setProfileErrors({ ...profileErrors, fullName: '' });
                                        }}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${profileErrors.fullName ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your full name"
                                    />
                                    {profileErrors.fullName && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.fullName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => {
                                            setProfileForm({ ...profileForm, phone: e.target.value });
                                            if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: '' });
                                        }}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${profileErrors.phone ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter your phone number"
                                    />
                                    {profileErrors.phone && (
                                        <p className="mt-1 text-sm text-red-600">{profileErrors.phone}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${savingProfile
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => {
                                                setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                                                if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                                            }}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                    {passwordErrors.currentPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => {
                                                setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                                                if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                                            }}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                    {passwordErrors.newPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        At least 8 characters with uppercase, lowercase, and number
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => {
                                                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                                                if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                                            }}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                    </div>
                                    {passwordErrors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingPassword}
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${savingPassword
                                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {savingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminProfile;
