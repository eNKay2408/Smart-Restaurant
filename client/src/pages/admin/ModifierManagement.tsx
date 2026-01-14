import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { modifierService, type Modifier, type ModifierOption } from '../../services/modifierService';

const ModifierManagement: React.FC = () => {
    const [modifiers, setModifiers] = useState<Modifier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingModifier, setEditingModifier] = useState<Modifier | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'single' as 'single' | 'multiple',
        required: false,
        displayOrder: '' as string | number,
        isActive: true,
        options: [] as Array<{
            name: string;
            priceAdjustment: number;
            isDefault: boolean;
            isActive: boolean;
        }>
    });
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; modifier: Modifier | null }>({
        show: false,
        modifier: null
    });

    const fetchModifiers = async () => {
        try {
            setLoading(true);
            const response = await modifierService.getModifiers();
            if (response.success) {
                setModifiers(response.data);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch modifiers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModifiers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingModifier) {
                // Update existing modifier
                await modifierService.updateModifier(editingModifier.id, {
                    ...formData,
                    displayOrder: Number(formData.displayOrder) || 1
                });
            } else {
                // Create new modifier - backend will use req.user.restaurantId
                await modifierService.createModifier({
                    ...formData,
                    displayOrder: Number(formData.displayOrder) || 1
                });
            }

            // Reset form and refresh data
            resetForm();
            await fetchModifiers();
        } catch (err: any) {
            setError(err.message || 'Failed to save modifier');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (modifier: Modifier) => {
        setEditingModifier(modifier);
        setFormData({
            name: modifier.name,
            type: modifier.type,
            required: modifier.required,
            displayOrder: modifier.displayOrder,
            isActive: modifier.isActive,
            options: modifier.options.map(opt => ({
                name: opt.name,
                priceAdjustment: opt.priceAdjustment,
                isDefault: opt.isDefault,
                isActive: opt.isActive
            }))
        });
        setShowCreateForm(true);
    };

    const handleDelete = (modifierId: string) => {
        const modifier = modifiers.find(m => m.id === modifierId);
        if (!modifier) return;

        // Show custom confirmation modal
        setDeleteModal({ show: true, modifier });
    };

    const confirmDelete = async () => {
        if (!deleteModal.modifier) return;

        try {
            setLoading(true);
            await modifierService.deleteModifier(deleteModal.modifier.id);
            await fetchModifiers();
            setDeleteModal({ show: false, modifier: null });
        } catch (err: any) {
            setError(err.message || 'Failed to delete modifier');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'single',
            required: false,
            displayOrder: '',
            isActive: true,
            options: []
        });
        setEditingModifier(null);
        setShowCreateForm(false);
    };

    const addOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, {
                name: '',
                priceAdjustment: 0,
                isDefault: false,
                isActive: true
            }]
        }));
    };

    const updateOption = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.map((opt, idx) =>
                idx === index ? { ...opt, [field]: value } : opt
            )
        }));
    };

    const removeOption = (index: number) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, idx) => idx !== index)
        }));
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Modifier Management</h1>
                        <p className="text-gray-600">Manage menu item modifiers and options</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        + Add Modifier
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Create/Edit Form Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">
                                    {editingModifier ? 'Edit Modifier' : 'Create New Modifier'}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto">
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Modifier Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Size, Extras"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Type *
                                        </label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'single' | 'multiple' })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="single">Single Choice</option>
                                            <option value="multiple">Multiple Choice</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Order
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.displayOrder}
                                            onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="1"
                                        />
                                    </div>

                                    <div className="flex items-end space-x-4 pb-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.required}
                                                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Required</span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Active</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Options */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Options
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                        >
                                            + Add Option
                                        </button>
                                    </div>

                                    <div className="space-y-3 max-h-40 overflow-y-auto">
                                        {formData.options.map((option, index) => (
                                            <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                                                <input
                                                    type="text"
                                                    placeholder="Option name"
                                                    value={option.name}
                                                    onChange={(e) => updateOption(index, 'name', e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs text-gray-600">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={option.priceAdjustment}
                                                        onChange={(e) => updateOption(index, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>
                                                <label className="flex items-center text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={option.isDefault}
                                                        onChange={(e) => updateOption(index, 'isDefault', e.target.checked)}
                                                        className="h-3 w-3 text-blue-600"
                                                    />
                                                    <span className="ml-1">Default</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : (editingModifier ? 'Update' : 'Create')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modifiers List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">All Modifiers</h3>
                        <p className="text-sm text-gray-600">Total: {modifiers.length} modifiers</p>
                    </div>

                    {loading && !showCreateForm ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2">Loading modifiers...</p>
                        </div>
                    ) : modifiers.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="text-gray-400 text-6xl mb-4">⚙️</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No modifiers yet</h3>
                            <p className="text-gray-600 mb-4">Create modifiers to allow customers to customize menu items.</p>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Create First Modifier
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {modifiers
                                .sort((a, b) => a.displayOrder - b.displayOrder)
                                .map((modifier) => (
                                    <div key={modifier.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                                                        {modifier.displayOrder}
                                                    </div>
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {modifier.name}
                                                    </h4>
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${modifier.type === 'single'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {modifier.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                                                    </span>
                                                    {modifier.required && (
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                            Required
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${modifier.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {modifier.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                                    {modifier.options.map((option) => (
                                                        <div key={option.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {option.name}
                                                                </span>
                                                                {option.isDefault && (
                                                                    <span className="ml-2 px-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-gray-600">
                                                                {option.priceAdjustment > 0 ? '+' : ''}${option.priceAdjustment.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex space-x-2 ml-4">
                                                <button
                                                    onClick={() => handleEdit(modifier)}
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(modifier.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteModal.show && deleteModal.modifier && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">Delete Modifier</h3>
                                        <p className="text-sm text-gray-500">This action cannot be undone</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-4">
                                <p className="text-gray-700 mb-4">
                                    Are you sure you want to delete this modifier?
                                </p>

                                {/* Modifier Preview */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-2xl">⚙️</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">{deleteModal.modifier.name}</h4>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${deleteModal.modifier.type === 'single'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {deleteModal.modifier.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                                                </span>
                                                {deleteModal.modifier.required && (
                                                    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                        Required
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500">
                                                    {deleteModal.modifier.options.length} option{deleteModal.modifier.options.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {deleteModal.modifier.options.length > 0 && (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    Options: {deleteModal.modifier.options.slice(0, 3).map(opt => opt.name).join(', ')}
                                                    {deleteModal.modifier.options.length > 3 && ` +${deleteModal.modifier.options.length - 3} more`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteModal({ show: false, modifier: null })}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete Modifier
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ModifierManagement;