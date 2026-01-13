import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { menuService } from '../../services/menuService';
import { categoryService } from '../../services/categoryService';
import { modifierService, Modifier } from '../../services/modifierService';
import type { MenuItem, MenuCategory } from '../../types/menu.types';

interface MenuItemForm {
    name: string;
    category: string;
    price: string;
    description: string;
    status: 'available' | 'unavailable' | 'sold_out';
    photos: string[];
    modifierIds: string[];
}

const AdminMenuItemForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [formData, setFormData] = useState<MenuItemForm>({
        name: '',
        category: 'Main Dishes',
        price: '',
        description: '',
        status: 'available',
        photos: [],
        modifierIds: []
    });

    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [availableModifiers, setAvailableModifiers] = useState<Modifier[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Create modifier modal state
    const [showCreateModifier, setShowCreateModifier] = useState(false);
    const [newModifierData, setNewModifierData] = useState({
        name: '',
        type: 'single' as 'single' | 'multiple',
        required: false,
        options: [{ name: '', priceAdjustment: 0 }]
    });
    const [creatingModifier, setCreatingModifier] = useState(false);

    // Fetch initial data (categories and modifiers)
    const fetchInitialData = async () => {
        try {
            setInitialLoading(true);
            
            // Fetch categories
            const categoriesResponse = await categoryService.getCategories();
            if (categoriesResponse.success) {
                setCategories(categoriesResponse.data);
                // Set first category as default
                if (categoriesResponse.data.length > 0 && !formData.category) {
                    setFormData(prev => ({ ...prev, category: categoriesResponse.data[0].name }));
                }
            }
            
            // Fetch available modifiers
            try {
                const modifiersResponse = await modifierService.getModifiers();
                
                if (modifiersResponse.success) {
                    // Filter active modifiers only
                    const activeModifiers = modifiersResponse.data.filter(modifier => modifier.isActive !== false);
                    setAvailableModifiers(activeModifiers);
                } else {
                    console.error('Failed to load modifiers:', modifiersResponse);
                }
            } catch (modifierError) {
                console.error('Modifier service error:', modifierError);
                // Continue without modifiers - don't break the form
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch initial data');
        } finally {
            setInitialLoading(false);
        }
    };

    // Fetch menu item data if editing
    const fetchMenuItem = async (itemId: string) => {
        try {
            const response = await menuService.getMenuItem(itemId);
            if (response.success) {
                const item = response.data;
                
                // Extract modifier IDs from the item's modifiers
                const modifierIds = item.modifiers?.map((modifier: any) => modifier._id || modifier.id).filter(Boolean) || [];
                
                setFormData({
                    name: item.name || '',
                    description: item.description || '',
                    price: item.price?.toString() || '',
                    category: item.category?.name || '',
                    photos: item.images?.length ? item.images : [''],
                    modifierIds: modifierIds,
                    status: item.status || 'available'
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch menu item');
        }
    };

    useEffect(() => {
        const initializeForm = async () => {
            await fetchInitialData();

            if (isEditing && id) {
                await fetchMenuItem(id);
            }
        };

        initializeForm();
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

            const menuItemData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                categoryId: selectedCategory?._id || categories[0]?._id,
                status: formData.status,
                images: formData.photos,
                modifierIds: formData.modifierIds,
                // Use a valid ObjectId format for restaurantId
                restaurantId: '507f1f77bcf86cd799439011' // Default restaurant ObjectId
            };

            console.log('📝 Sending menu item data:', menuItemData);
            console.log('🔧 Modifier IDs being sent:', formData.modifierIds);

            if (isEditing && id) {
                await menuService.updateMenuItem(id, menuItemData);
                console.log('✅ Updated menu item successfully');
            } else {
                const response = await menuService.createMenuItem(menuItemData);
                console.log('✅ Created menu item successfully:', response);
            }

            navigate('/admin/menu');
        } catch (err: any) {
            console.error('❌ Failed to save menu item:', err);
            console.error('Error response:', err.response?.data);
            
            // Show more specific error messages
            const errorMessage = err.response?.data?.message || err.message || 'Failed to save menu item';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin/menu');
    };

    // Handle modifier selection/deselection
    const toggleModifierSelection = (modifierId: string) => {
        setFormData(prev => ({
            ...prev,
            modifierIds: prev.modifierIds.includes(modifierId)
                ? prev.modifierIds.filter(id => id !== modifierId)
                : [...prev.modifierIds, modifierId]
        }));
    };

    // Create new modifier inline
    const handleCreateModifier = async () => {
        if (!newModifierData.name.trim()) return;
        
        setCreatingModifier(true);
        try {
            const modifierPayload = {
                name: newModifierData.name,
                type: newModifierData.type,
                required: newModifierData.required,
                displayOrder: availableModifiers.length + 1,
                options: newModifierData.options
                    .filter(opt => opt.name.trim())
                    .map(opt => ({
                        name: opt.name.trim(),
                        priceAdjustment: opt.priceAdjustment || 0,
                        isDefault: false,
                        isActive: true
                    })),
                restaurantId: '507f1f77bcf86cd799439011'
            };
            
            const response = await modifierService.createModifier(modifierPayload);
            
            if (response.success) {
                // Refresh modifiers list
                await fetchInitialData();
                
                // Auto-select the newly created modifier
                setFormData(prev => ({
                    ...prev,
                    modifierIds: [...prev.modifierIds, response.data.id]
                }));
                
                // Reset and close modal
                setNewModifierData({
                    name: '',
                    type: 'single',
                    required: false,
                    options: [{ name: '', priceAdjustment: 0 }]
                });
                setShowCreateModifier(false);
            }
        } catch (error: any) {
            setError(error.message || 'Failed to create modifier');
        } finally {
            setCreatingModifier(false);
        }
    };
    
    const addModifierOption = () => {
        setNewModifierData(prev => ({
            ...prev,
            options: [...prev.options, { name: '', priceAdjustment: 0 }]
        }));
    };
    
    const removeModifierOption = (index: number) => {
        setNewModifierData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };
    
    const updateModifierOption = (index: number, field: string, value: any) => {
        setNewModifierData(prev => ({
            ...prev,
            options: prev.options.map((opt, i) => 
                i === index ? { ...opt, [field]: value } : opt
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

    if (initialLoading) {
        return (
            <AdminLayout>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-4 text-gray-600">Loading...</span>
                    </div>
                </div>
            </AdminLayout>
        );
    }

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

                        <div className="space-y-4">
                            {/* URL Input for adding images */}
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const input = e.target as HTMLInputElement;
                                            const url = input.value.trim();
                                            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    photos: [...prev.photos, url]
                                                }));
                                                input.value = '';
                                            } else {
                                                alert('Please enter a valid URL starting with http:// or https://');
                                            }
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const input = (e.target as HTMLButtonElement).previousElementSibling as HTMLInputElement;
                                        const url = input.value.trim();
                                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                                            setFormData(prev => ({
                                                ...prev,
                                                photos: [...prev.photos, url]
                                            }));
                                            input.value = '';
                                        } else {
                                            alert('Please enter a valid URL starting with http:// or https://');
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Image
                                </button>
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.photos.map((photo, index) => (
                                    <div key={index} className="relative">
                                        <div className="w-full h-32 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                                            {photo ? (
                                                <img 
                                                    src={photo} 
                                                    alt={`Photo ${index + 1}`} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        img.style.display = 'none';
                                                        const parent = img.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = '<span class="text-red-500 text-xs">❌ Image failed to load</span>';
                                                        }
                                                    }}
                                                />
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
                                
                                {/* Add more placeholder */}
                                {formData.photos.length === 0 && (
                                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                                        <div className="text-center">
                                            <span className="text-4xl">📷</span>
                                            <p className="text-sm mt-1">No images yet</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modifiers */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Modifiers</h3>
                            <div className="text-sm text-gray-500">
                                Select existing modifiers or create new ones
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Available Modifiers */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">
                                        Available Modifier Groups ({availableModifiers.length})
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModifier(true)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                        + Create Modifier
                                    </button>
                                </div>
                                
                                {availableModifiers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {availableModifiers.map((modifier) => (
                                            <div 
                                                key={modifier.id}
                                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                                    formData.modifierIds.includes(modifier.id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => toggleModifierSelection(modifier.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.modifierIds.includes(modifier.id)}
                                                                onChange={() => toggleModifierSelection(modifier.id)}
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                            />
                                                            <span className="ml-2 font-medium text-gray-900">{modifier.name}</span>
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-500">
                                                            {modifier.type === 'multiple' ? 'Multi-select' : 'Single select'} • 
                                                            {modifier.required ? ' Required' : ' Optional'} • 
                                                            {modifier.options?.length || 0} options
                                                        </div>
                                                        {modifier.options && modifier.options.length > 0 && (
                                                            <div className="mt-2 text-xs text-gray-400">
                                                                Options: {modifier.options.slice(0, 3).map(opt => opt.name).join(', ')}
                                                                {modifier.options.length > 3 && `, +${modifier.options.length - 3} more`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-2">No modifier groups available</p>
                                        <p className="text-gray-400 text-xs mb-4">Create modifier groups to add options like Size, Extras, or Add-ons</p>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModifier(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                            Create Your First Modifier
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Selected modifiers summary */}
                            {formData.modifierIds.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-green-800 mb-2">
                                        Selected Modifiers ({formData.modifierIds.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.modifierIds.map((modifierId) => {
                                            const modifier = availableModifiers.find(m => m.id === modifierId);
                                            return modifier ? (
                                                <span 
                                                    key={modifierId}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                >
                                                    {modifier.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleModifierSelection(modifierId)}
                                                        className="ml-1 text-green-600 hover:text-green-800"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
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
                
                {/* Create Modifier Modal */}
                {showCreateModifier && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Create New Modifier</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModifier(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Modifier Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Modifier Group Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newModifierData.name}
                                            onChange={(e) => setNewModifierData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Size, Add-ons, Spice Level"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    
                                    {/* Type and Required */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                            <select
                                                value={newModifierData.type}
                                                onChange={(e) => setNewModifierData(prev => ({ ...prev, type: e.target.value as 'single' | 'multiple' }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="single">Single Select</option>
                                                <option value="multiple">Multiple Select</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Required</label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    checked={newModifierData.required}
                                                    onChange={(e) => setNewModifierData(prev => ({ ...prev, required: e.target.checked }))}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="ml-2 text-sm text-gray-600">Required selection</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Options */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Options</label>
                                            <button
                                                type="button"
                                                onClick={addModifierOption}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                + Add Option
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {newModifierData.options.map((option, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={option.name}
                                                        onChange={(e) => updateModifierOption(index, 'name', e.target.value)}
                                                        placeholder={`Option ${index + 1} name`}
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <div className="w-20">
                                                        <div className="flex items-center">
                                                            <span className="text-sm text-gray-500 mr-1">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={option.priceAdjustment}
                                                                onChange={(e) => updateModifierOption(index, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                                                className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                    {newModifierData.options.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeModifierOption(index)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Modal Actions */}
                                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModifier(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreateModifier}
                                        disabled={creatingModifier || !newModifierData.name.trim() || newModifierData.options.every(opt => !opt.name.trim())}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creatingModifier ? 'Creating...' : 'Create Modifier'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminMenuItemForm;