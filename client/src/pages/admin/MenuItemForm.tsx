import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import type { MenuItem, MenuCategory } from '../../types/menu.types';

interface MenuItemForm {
    name: string;
    category: string;
    price: string;
    prepTime: string;
    description: string;
    status: 'available' | 'unavailable' | 'sold_out';
    photos: string[];
    modifiers: ModifierGroup[];
}

interface ModifierGroup {
    id: string;
    name: string;
    items: ModifierItem[];
    required: boolean;
    multiSelect: boolean;
}

interface ModifierItem {
    id: string;
    name: string;
    price: number;
}

const AdminMenuItemForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [formData, setFormData] = useState<MenuItemForm>({
        name: '',
        category: 'Main Dishes',
        price: '',
        prepTime: '',
        description: '',
        status: 'available',
        photos: [],
        modifiers: []
    });

    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch categories on component mount
    const fetchCategories = async () => {
        try {
            const response = await categoryService.getCategories();
            if (response.success) {
                setCategories(response.data);
                // Set first category as default
                if (response.data.length > 0 && !formData.category) {
                    setFormData(prev => ({ ...prev, category: response.data[0].name }));
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch categories');
        }
    };

    // Fetch menu item data if editing
    const fetchMenuItem = async (itemId: string) => {
        try {
            const response = await menuService.getMenuItem(itemId);
            if (response.success) {
                const item = response.data;
                setFormData({
                    name: item.name,
                    category: typeof item.categoryId === 'object' ? item.categoryId.name : 'Main Dishes',
                    price: item.price.toString(),
                    prepTime: item.prepTime?.toString() || '',
                    description: item.description,
                    status: item.status,
                    photos: item.images || [],
                    modifiers: [] // Modifiers would need separate implementation
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch menu item');
        }
    };

    useEffect(() => {
        const initializeForm = async () => {
            setInitialLoading(true);
            await fetchCategories();

            if (isEditing && id) {
                await fetchMenuItem(id);
            }

            setInitialLoading(false);
        };

        initializeForm();
    }, [id, isEditing]);

    const predefinedModifiers = [
        {
            id: '1',
            name: 'Size',
            items: [
                { id: '1-1', name: 'Regular', price: 0 },
                { id: '1-2', name: 'Large', price: 5 }
            ],
            required: false,
            multiSelect: false
        },
        {
            id: '2',
            name: 'Extras',
            items: [
                { id: '2-1', name: 'Side salad', price: 4 },
                { id: '2-2', name: 'Extra sauce', price: 2 },
                { id: '2-3', name: 'Extra cheese', price: 3 }
            ],
            required: false,
            multiSelect: true
        }
    ];

    useEffect(() => {
        if (isEditing) {
            // In a real app, fetch the item data from API
            setFormData({
                name: 'Grilled Salmon',
                category: 'Main Dishes',
                price: '18.00',
                prepTime: '15',
                description: 'Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables and lemon.',
                status: 'available',
                photos: [],
                modifiers: predefinedModifiers
            });
        }
    }, [id, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Item name is required';
        }

        if (!formData.price.trim()) {
            newErrors.price = 'Price is required';
        } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            newErrors.price = 'Please enter a valid price';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Find selected category
            const selectedCategory = categories.find(cat => cat.name === formData.category);

            // Transform modifiers from frontend format to backend format
            const transformedModifiers = formData.modifiers
                .filter(group => group.name.trim() !== '') // Only include groups with names
                .map(group => ({
                    name: group.name,
                    type: group.multiSelect ? 'multiple' : 'single',
                    required: group.required,
                    options: group.items.map(item => ({
                        name: item.name,
                        priceAdjustment: item.price
                    }))
                }));

            const menuItemData: any = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                categoryId: selectedCategory?._id || categories[0]?._id,
                status: formData.status,
                prepTime: parseInt(formData.prepTime) || 15,
                images: formData.photos,
            };

            // Only include modifiers if there are any
            if (transformedModifiers.length > 0) {
                menuItemData.modifiers = transformedModifiers;
            }

            if (isEditing && id) {
                await menuService.updateMenuItem(id, menuItemData);
            } else {
                await menuService.createMenuItem(menuItemData);
            }

            navigate('/admin/menu');
        } catch (err: any) {
            setError(err.message || 'Failed to save menu item');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/menu');
    };

    const addModifierGroup = () => {
        const newGroup: ModifierGroup = {
            id: Date.now().toString(),
            name: '',
            items: [],
            required: false,
            multiSelect: false
        };
        setFormData(prev => ({
            ...prev,
            modifiers: [...prev.modifiers, newGroup]
        }));
    };

    const removeModifierGroup = (groupId: string) => {
        setFormData(prev => ({
            ...prev,
            modifiers: prev.modifiers.filter(group => group.id !== groupId)
        }));
    };

    const updateModifierGroup = (groupId: string, field: keyof ModifierGroup, value: any) => {
        setFormData(prev => ({
            ...prev,
            modifiers: prev.modifiers.map(group =>
                group.id === groupId ? { ...group, [field]: value } : group
            )
        }));
    };

    const addModifierItem = (groupId: string) => {
        const newItem: ModifierItem = {
            id: `${groupId}-${Date.now()}`,
            name: '',
            price: 0
        };
        setFormData(prev => ({
            ...prev,
            modifiers: prev.modifiers.map(group =>
                group.id === groupId
                    ? { ...group, items: [...group.items, newItem] }
                    : group
            )
        }));
    };

    const updateModifierItem = (groupId: string, itemId: string, field: keyof ModifierItem, value: any) => {
        setFormData(prev => ({
            ...prev,
            modifiers: prev.modifiers.map(group =>
                group.id === groupId
                    ? {
                        ...group,
                        items: group.items.map(item =>
                            item.id === itemId ? { ...item, [field]: value } : item
                        )
                    }
                    : group
            )
        }));
    };

    const removeModifierItem = (groupId: string, itemId: string) => {
        setFormData(prev => ({
            ...prev,
            modifiers: prev.modifiers.map(group =>
                group.id === groupId
                    ? { ...group, items: group.items.filter(item => item.id !== itemId) }
                    : group
            )
        }));
    };

    const addPhotoSlot = () => {
        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, '']
        }));
    };

    const removePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isEditing ? 'Update menu item details' : 'Create a new menu item for your restaurant'}
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Menu
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="e.g., Grilled Salmon"
                                />
                                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                >
                                    {categories.length === 0 ? (
                                        <option value="">Loading categories...</option>
                                    ) : (
                                        categories.map(category => (
                                            <option key={category._id} value={category.name}>{category.name}</option>
                                        ))
                                    )}
                                </select>
                                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
                            </div>

                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                    Price <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.price ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="18.00"
                                    />
                                </div>
                                {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
                            </div>

                            <div>
                                <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-2">
                                    Prep Time (minutes)
                                </label>
                                <input
                                    type="number"
                                    id="prepTime"
                                    name="prepTime"
                                    value={formData.prepTime}
                                    onChange={handleInputChange}
                                    min="0"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="15"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Fresh Atlantic salmon grilled to perfection, served with seasonal vegetables and lemon."
                            />
                            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.photos.map((photo, index) => (
                                <div key={index} className="relative">
                                    <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                                        {photo ? (
                                            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl">🖼️</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div>
                                <input
                                    type="file"
                                    id="photo-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // For now, just add a placeholder URL
                                            // In production, upload to server and get URL
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const imageUrl = event.target?.result as string;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    photos: [...prev.photos, imageUrl]
                                                }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                        // Reset input
                                        e.target.value = '';
                                    }}
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer block"
                                >
                                    <div className="text-center">
                                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-sm text-gray-600">Add Photo</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Modifiers */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Modifiers</h3>
                            <button
                                type="button"
                                onClick={addModifierGroup}
                                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            >
                                + Add Modifier Group
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.modifiers.map((group) => (
                                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                                    {/* Group Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={group.name}
                                                onChange={(e) => updateModifierGroup(group.id, 'name', e.target.value)}
                                                placeholder="Group name (e.g., Size, Extras)"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeModifierGroup(group.id)}
                                            className="ml-3 text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                            title="Remove modifier group"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Group Options */}
                                    <div className="flex items-center space-x-6 mb-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={group.required}
                                                onChange={(e) => updateModifierGroup(group.id, 'required', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Required</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={group.multiSelect}
                                                onChange={(e) => updateModifierGroup(group.id, 'multiSelect', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Multi-select</span>
                                        </label>
                                    </div>

                                    {/* Modifier Items */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-gray-700">Items</label>
                                            <button
                                                type="button"
                                                onClick={() => addModifierItem(group.id)}
                                                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                + Add Item
                                            </button>
                                        </div>

                                        {group.items.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic py-2">No items added yet</p>
                                        ) : (
                                            group.items.map((item) => (
                                                <div key={item.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => updateModifierItem(group.id, item.id, 'name', e.target.value)}
                                                        placeholder="Item name"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    />
                                                    <div className="flex items-center">
                                                        <span className="text-gray-500 mr-1">$</span>
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => updateModifierItem(group.id, item.id, 'price', parseFloat(e.target.value) || 0)}
                                                            placeholder="0.00"
                                                            step="0.01"
                                                            min="0"
                                                            className="w-20 px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeModifierItem(group.id, item.id)}
                                                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Remove item"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}

                            {formData.modifiers.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No modifiers added yet. Click "Add Modifier Group" to get started.</p>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>

                        <div className="space-y-3">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="status"
                                    value="available"
                                    checked={formData.status === 'available'}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-3 text-gray-700">● Available</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="status"
                                    value="unavailable"
                                    checked={formData.status === 'unavailable'}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-3 text-gray-700">○ Unavailable</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="status"
                                    value="sold_out"
                                    checked={formData.status === 'sold_out'}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="ml-3 text-gray-700">○ Sold Out</span>
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </div>
                            ) : (
                                isEditing ? 'Update Item' : 'Create Item'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

export default AdminMenuItemForm;