import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { promotionService, Promotion } from '../../services/promotionService';
import { useRestaurant } from '../../contexts/RestaurantContext';

const PromotionManagement: React.FC = () => {
    const { restaurantId } = useRestaurant();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [filteredPromotions, setFilteredPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [selectedPromotions, setSelectedPromotions] = useState<string[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage' as 'percentage' | 'fixed',
        discountValue: 0,
        minOrderAmount: undefined as number | undefined,
        maxDiscountAmount: undefined as number | undefined,
        startDate: '',
        endDate: '',
        usageLimit: undefined as number | undefined,
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [promotions, searchQuery, statusFilter, typeFilter]);

    const fetchPromotions = async () => {
        try {
            setLoading(true);
            const response = await promotionService.getPromotions();
            setPromotions(response.data);
        } catch (error: any) {
            toast.error('Failed to load promotions');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...promotions];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(promo =>
                promo.code.toLowerCase().includes(query) ||
                promo.description.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(promo => {
                const isExpired = new Date(promo.endDate) < new Date();
                if (statusFilter === 'expired') return isExpired;
                if (statusFilter === 'active') return promo.isActive && !isExpired;
                if (statusFilter === 'inactive') return !promo.isActive && !isExpired;
                return true;
            });
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(promo => promo.discountType === typeFilter);
        }

        setFilteredPromotions(filtered);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!restaurantId) {
            toast.error('Restaurant ID not found. Please login again.');
            return;
        }

        try {
            if (editingPromotion) {
                await promotionService.updatePromotion(editingPromotion._id, formData);
                toast.success('✅ Promotion updated successfully!');
            } else {
                await promotionService.createPromotion({
                    ...formData,
                    restaurantId
                });
                toast.success('✅ Promotion created successfully!');
            }

            setShowModal(false);
            resetForm();
            fetchPromotions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save promotion');
        }
    };

    const handleEdit = (promotion: Promotion) => {
        setEditingPromotion(promotion);
        setFormData({
            code: promotion.code,
            description: promotion.description,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            minOrderAmount: promotion.minOrderAmount,
            maxDiscountAmount: promotion.maxDiscountAmount,
            startDate: promotion.startDate.split('T')[0],
            endDate: promotion.endDate.split('T')[0],
            usageLimit: promotion.usageLimit,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;

        try {
            await promotionService.deletePromotion(id);
            toast.success('✅ Promotion deleted successfully!');
            fetchPromotions();
        } catch (error: any) {
            toast.error('Failed to delete promotion');
        }
    };

    const handleToggleStatus = async (id: string) => {
        try {
            await promotionService.togglePromotionStatus(id);
            toast.success('✅ Promotion status updated!');
            fetchPromotions();
        } catch (error: any) {
            toast.error('Failed to update status');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPromotions.length === 0) {
            toast.warning('Please select promotions to delete');
            return;
        }

        if (!window.confirm(`Delete ${selectedPromotions.length} selected promotion(s)?`)) return;

        try {
            await Promise.all(selectedPromotions.map(id => promotionService.deletePromotion(id)));
            toast.success(`✅ ${selectedPromotions.length} promotion(s) deleted!`);
            setSelectedPromotions([]);
            fetchPromotions();
        } catch (error) {
            toast.error('Failed to delete some promotions');
        }
    };

    const handleBulkActivate = async () => {
        if (selectedPromotions.length === 0) {
            toast.warning('Please select promotions to activate');
            return;
        }

        try {
            const promises = selectedPromotions.map(async (id) => {
                const promo = promotions.find(p => p._id === id);
                if (promo && !promo.isActive) {
                    return promotionService.togglePromotionStatus(id);
                }
            });
            await Promise.all(promises);
            toast.success(`✅ ${selectedPromotions.length} promotion(s) activated!`);
            setSelectedPromotions([]);
            fetchPromotions();
        } catch (error) {
            toast.error('Failed to activate some promotions');
        }
    };

    const handleBulkDeactivate = async () => {
        if (selectedPromotions.length === 0) {
            toast.warning('Please select promotions to deactivate');
            return;
        }

        try {
            const promises = selectedPromotions.map(async (id) => {
                const promo = promotions.find(p => p._id === id);
                if (promo && promo.isActive) {
                    return promotionService.togglePromotionStatus(id);
                }
            });
            await Promise.all(promises);
            toast.success(`✅ ${selectedPromotions.length} promotion(s) deactivated!`);
            setSelectedPromotions([]);
            fetchPromotions();
        } catch (error) {
            toast.error('Failed to deactivate some promotions');
        }
    };

    const toggleSelectPromotion = (id: string) => {
        setSelectedPromotions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPromotions.length === filteredPromotions.length) {
            setSelectedPromotions([]);
        } else {
            setSelectedPromotions(filteredPromotions.map(p => p._id));
        }
    };

    const resetForm = () => {
        setEditingPromotion(null);
        setFormData({
            code: '',
            description: '',
            discountType: 'percentage',
            discountValue: 0,
            minOrderAmount: undefined,
            maxDiscountAmount: undefined,
            startDate: '',
            endDate: '',
            usageLimit: undefined,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isExpired = (endDate: string) => {
        return new Date(endDate) < new Date();
    };

    // Analytics
    const analytics = {
        total: promotions.length,
        active: promotions.filter(p => p.isActive && !isExpired(p.endDate)).length,
        inactive: promotions.filter(p => !p.isActive).length,
        expired: promotions.filter(p => isExpired(p.endDate)).length,
        totalUsage: promotions.reduce((sum, p) => sum + p.usedCount, 0),
        percentagePromotions: promotions.filter(p => p.discountType === 'percentage').length,
        fixedPromotions: promotions.filter(p => p.discountType === 'fixed').length,
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Promotions</p>
                                <p className="text-3xl font-bold mt-1">{analytics.total}</p>
                            </div>
                            <div className="text-4xl opacity-80">🎟️</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Active</p>
                                <p className="text-3xl font-bold mt-1">{analytics.active}</p>
                            </div>
                            <div className="text-4xl opacity-80">✅</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm font-medium">Total Usage</p>
                                <p className="text-3xl font-bold mt-1">{analytics.totalUsage}</p>
                            </div>
                            <div className="text-4xl opacity-80">📊</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Expired</p>
                                <p className="text-3xl font-bold mt-1">{analytics.expired}</p>
                            </div>
                            <div className="text-4xl opacity-80">⏰</div>
                        </div>
                    </div>
                </div>

                {/* Header with Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Promotion Management</h1>
                            <p className="text-gray-600 mt-1">Manage discount codes and promotions</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Promotion
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by code or description..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="expired">Expired</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>

                    {/* Bulk Actions */}
                    {selectedPromotions.length > 0 && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-sm font-medium text-blue-900">
                                {selectedPromotions.length} selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkActivate}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={handleBulkDeactivate}
                                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    Deactivate
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Promotions List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading promotions...</p>
                    </div>
                ) : filteredPromotions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <div className="text-6xl mb-4">🎟️</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                                ? 'No promotions match your filters'
                                : 'No promotions yet'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Create your first promotion to get started'}
                        </p>
                        {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Select All */}
                        <div className="flex items-center gap-2 px-4">
                            <input
                                type="checkbox"
                                checked={selectedPromotions.length === filteredPromotions.length && filteredPromotions.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">Select All</span>
                        </div>

                        {filteredPromotions.map((promotion) => (
                            <div
                                key={promotion._id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedPromotions.includes(promotion._id)}
                                        onChange={() => toggleSelectPromotion(promotion._id)}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl font-bold text-blue-600">{promotion.code}</span>
                                            {promotion.isActive ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                                                    Inactive
                                                </span>
                                            )}
                                            {isExpired(promotion.endDate) && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 mb-3">{promotion.description}</p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Discount:</span>
                                                <p className="font-semibold text-gray-900">
                                                    {promotion.discountType === 'percentage'
                                                        ? `${promotion.discountValue}%`
                                                        : `$${promotion.discountValue}`}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Min Order:</span>
                                                <p className="font-semibold text-gray-900">
                                                    {promotion.minOrderAmount ? `$${promotion.minOrderAmount}` : 'None'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Usage:</span>
                                                <p className="font-semibold text-gray-900">
                                                    {promotion.usedCount} / {promotion.usageLimit || '∞'}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Valid Until:</span>
                                                <p className="font-semibold text-gray-900">
                                                    {formatDate(promotion.endDate)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(promotion._id)}
                                            className={`p-2 rounded-lg transition-colors ${promotion.isActive
                                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                            title={promotion.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(promotion)}
                                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(promotion._id)}
                                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Promotion Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Promotion Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="SUMMER2024"
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={3}
                                            placeholder="Summer sale - 20% off all items"
                                            required
                                        />
                                    </div>

                                    {/* Discount Type & Value */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Discount Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.discountType}
                                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount ($)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Discount Value <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.discountValue}
                                                onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Min Order & Max Discount */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Min Order Amount ($)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.minOrderAmount || ''}
                                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="0"
                                                step="0.01"
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Max Discount Amount ($)
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.maxDiscountAmount || ''}
                                                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                min="0"
                                                step="0.01"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    {/* Start & End Date */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Usage Limit */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Usage Limit
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.usageLimit || ''}
                                            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            min="1"
                                            placeholder="Unlimited"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">Leave empty for unlimited usage</p>
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForm();
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default PromotionManagement;
