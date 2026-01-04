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
        displayOrder: 1,
        isActive: true,
        options: [] as Array<{
            name: string;
            priceAdjustment: number;
            isDefault: boolean;
            isActive: boolean;
        }>
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
                await modifierService.updateModifier(editingModifier.id, formData);
            } else {
                // Create new modifier
                await modifierService.createModifier({
                    ...formData,
                    restaurantId: 'default-restaurant' // You may want to get this from context
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

    const handleDelete = async (modifierId: string) => {
        if (!confirm('Are you sure you want to delete this modifier?')) return;

        try {
            setLoading(true);
            await modifierService.deleteModifier(modifierId);
            await fetchModifiers();
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
            displayOrder: 1,
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
                                            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    modifier.type === 'single' 
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
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    modifier.isActive 
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
            </div>
        </AdminLayout>
    );
};

export default ModifierManagement;