import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import menuService from '../../services/menuService';
import cartService from '../../services/cartService';
import { useQRTable } from '../../hooks/useQRTable';
import { getPrimaryImageUrl } from '../../utils/imageHelper';
import { toast } from 'react-toastify';
import reviewService from '../../services/reviewService';

interface Modifier {
    id: string;
    name: string;
    price: number;
    selected: boolean;
}

interface ModifierGroup {
    id: string;
    name: string;
    required: boolean;
    multiSelect: boolean;
    options: Modifier[];
}

const MenuItemDetail: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { itemId } = useParams<{ itemId: string }>();
    const { tableInfo, returnPath } = location.state || {};
    const { tableInfo: qrTableInfo } = useQRTable();

    const [quantity, setQuantity] = useState(1);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
    const [addingToCart, setAddingToCart] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewStats, setReviewStats] = useState<any>(null);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [currentReviewPage, setCurrentReviewPage] = useState(1);
    const [totalReviewPages, setTotalReviewPages] = useState(1);
    const [relatedItems, setRelatedItems] = useState<any[]>([]);
    const reviewsPerPage = 5;

    // Fetch menu item data on mount
    useEffect(() => {
        const fetchMenuItem = async () => {
            if (!itemId) return;

            try {
                setLoading(true);
                // Reset states when switching items
                setQuantity(1);
                setSpecialInstructions('');
                setModifierGroups([]);
                
                const response = await menuService.getMenuItem(itemId);

                if (response.success && response.data) {
                    setItem(response.data);

                    // Transform backend modifiers to frontend format
                    if (response.data.modifiers && response.data.modifiers.length > 0) {
                        const transformedModifiers = response.data.modifiers.map((modifier: any, idx: number) => ({
                            id: `mod-${idx}`,
                            name: modifier.name,
                            required: modifier.required || false,
                            multiSelect: modifier.type === 'multiple', // Backend uses 'single' or 'multiple'
                            options: modifier.options.map((option: any, optIdx: number) => ({
                                id: `${idx}-${optIdx}`,
                                name: option.name,
                                price: option.priceAdjustment || 0, // Backend uses 'priceAdjustment'
                                selected: false
                            }))
                        }));
                        setModifierGroups(transformedModifiers);
                    } else {
                        // Explicitly clear modifiers if item has none
                        setModifierGroups([]);
                    }

                    // Fetch related items from same category
                    if (response.data.categoryId) {
                        try {
                            const categoryId = typeof response.data.categoryId === 'object'
                                ? response.data.categoryId._id
                                : response.data.categoryId;
                            const relatedResponse = await menuService.getMenuItemsByCategory(categoryId);
                            if (relatedResponse.success) {
                                // Filter out current item and limit to 4 items
                                const related = relatedResponse.data
                                    .filter((relItem: any) => relItem._id !== itemId && relItem.status === 'available')
                                    .slice(0, 4);
                                setRelatedItems(related);
                            }
                        } catch (err) {
                            console.error('Error fetching related items:', err);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching menu item:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenuItem();
    }, [itemId]);

    // Fetch reviews with pagination support
    const fetchReviews = async (page = 1) => {
        if (!itemId) return;

        try {
            setLoadingReviews(true);
            const response = await reviewService.getMenuItemReviews(itemId, page, reviewsPerPage);

            if (response.success) {
                setReviews(response.data || []);
                setReviewStats(response.stats || null);
                setCurrentReviewPage(page);
                if (response.pagination) {
                    setTotalReviewPages(response.pagination.pages || 1);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    };

    // Load initial reviews
    useEffect(() => {
        fetchReviews();
    }, [itemId]);

    const handleModifierChange = (groupId: string, optionId: string) => {
        setModifierGroups(prev => prev.map(group => {
            if (group.id === groupId) {
                if (group.multiSelect) {
                    return {
                        ...group,
                        options: group.options.map(option =>
                            option.id === optionId
                                ? { ...option, selected: !option.selected }
                                : option
                        )
                    };
                } else {
                    return {
                        ...group,
                        options: group.options.map(option => ({
                            ...option,
                            selected: option.id === optionId
                        }))
                    };
                }
            }
            return group;
        }));
    };

    const calculateTotalPrice = () => {
        let total = item.price * quantity;
        modifierGroups.forEach(group => {
            group.options.forEach(option => {
                if (option.selected) {
                    total += option.price * quantity;
                }
            });
        });
        return total;
    };

    // Check if all required modifiers are selected
    const checkRequiredModifiers = (): { valid: boolean; missingGroups: string[] } => {
        const missingGroups: string[] = [];

        modifierGroups.forEach(group => {
            if (group.required) {
                const hasSelection = group.options.some(option => option.selected);
                if (!hasSelection) {
                    missingGroups.push(group.name);
                }
            }
        });

        return {
            valid: missingGroups.length === 0,
            missingGroups
        };
    };

    const handleAddToCart = async () => {
        // Check if item is available
        if (!isAvailable) {
            toast.error('This item is currently unavailable');
            return;
        }

        // Validate required modifiers
        const validation = checkRequiredModifiers();
        if (!validation.valid) {
            const missingText = validation.missingGroups.join(', ');
            toast.error(`Please select required options: ${missingText}`);
            return;
        }

        setAddingToCart(true);

        try {
            // Get current table info - priority: passed prop, QR scan, localStorage
            let currentTableInfo = tableInfo || qrTableInfo;

            if (!currentTableInfo) {
                // Try to get table info from localStorage
                const savedTableInfo = localStorage.getItem('current_table_info');
                if (savedTableInfo) {
                    try {
                        const tableData = JSON.parse(savedTableInfo);
                        if (tableData.tableId) {
                            currentTableInfo = tableData;
                            console.log('🔄 Using tableId from localStorage:', tableData.tableId);
                        }
                    } catch (e) {
                        console.error('Failed to parse saved table info:', e);
                    }
                }
            }

            if (!currentTableInfo?.tableId) {
                toast.error('Table information not available. Please scan QR code again.');
                return;
            }

            // Get restaurantId
            const restaurantId = currentTableInfo.restaurantId || item.restaurantId;
            if (!restaurantId) {
                toast.error('Restaurant information not available');
                return;
            }

            // Prepare modifiers in the expected format (CartModifier interface)
            const selectedModifiers = modifierGroups
                .filter(group => group.options.some(option => option.selected))
                .map(group => ({
                    name: group.name,
                    options: group.options
                        .filter(option => option.selected)
                        .map(option => ({
                            name: option.name,
                            priceAdjustment: option.price
                        }))
                }));

            console.log('🛒 Adding to table cart:', currentTableInfo.tableId);
            console.log('📝 Item data:', {
                menuItemId: item._id,
                quantity,
                modifiers: selectedModifiers,
                specialInstructions
            });

            // Use table-based cart API
            await cartService.addItemToTableCart(currentTableInfo.tableId, {
                menuItemId: item._id,
                quantity,
                restaurantId: restaurantId,
                modifiers: selectedModifiers,
                specialInstructions
            });

            // Show success feedback
            toast.success('✅ Added to cart!');

            // Navigate back based on context
            if (returnPath) {
                navigate(returnPath);
            } else {
                navigate('/menu');
            }

        } catch (error: any) {
            console.error('Add to cart error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add to cart. Please try again.';
            toast.error(errorMessage);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading || !item) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading menu item...</p>
                </div>
            </div>
        );
    }

    // Calculate availability same as Menu page
    const isAvailable = item.status === 'available' && item.isActive;

    // Check if all required modifiers are selected
    const areRequiredModifiersSelected = () => {
        return modifierGroups.every(group => {
            if (group.required) {
                return group.options.some(option => option.selected);
            }
            return true;
        });
    };

    const canAddToCart = isAvailable && areRequiredModifiersSelected();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={handleBack}
                        className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">Menu Item</h1>
                        {tableInfo && (
                            <p className="text-sm text-gray-600">Table {tableInfo.tableNumber}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="pb-24">
                {/* Item Image */}
                <div className="bg-white">
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        {item.images && item.images.length > 0 ? (
                            <img
                                src={getPrimaryImageUrl(item.images, item.primaryImageIndex)}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-8xl">🍽️</span>
                        )}
                    </div>
                </div>

                {/* Item Info */}
                <div className="bg-white px-4 py-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                        <span className={`text-sm px-2 py-1 rounded-full ${isAvailable
                            ? 'text-green-600 bg-green-100'
                            : 'text-red-600 bg-red-100'
                            }`}>
                            {isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                        </span>
                        {item.category && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {item.category.name}
                            </span>
                        )}
                    </div>

                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>

                {/* Modifiers */}
                {modifierGroups.map((group) => {
                    const hasSelection = group.options.some(option => option.selected);
                    const showError = group.required && !hasSelection;

                    return (
                        <div key={group.id} className={`bg-white mt-2 px-4 py-6 border-b ${showError ? 'border-red-200' : 'border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {group.name}
                                    {group.required && <span className="text-red-500 ml-1">*</span>}
                                </h3>
                                {showError && (
                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                        Required
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {group.options.map((option) => (
                                    <label
                                        key={option.id}
                                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type={group.multiSelect ? 'checkbox' : 'radio'}
                                                name={group.id}
                                                checked={option.selected}
                                                onChange={() => handleModifierChange(group.id, option.id)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-gray-900">{option.name}</span>
                                        </div>
                                        <span className="text-gray-600 font-medium">
                                            {option.price > 0 ? `+$${option.price}` : 'Free'}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {showError && (
                                <p className="mt-2 text-sm text-red-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Please select an option from this group
                                </p>
                            )}
                        </div>
                    );
                })}

                {/* Special Instructions */}
                <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h3>
                    <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special requests? (optional)"
                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                    />
                </div>

                {/* Reviews Section */}
                <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Ratings</h3>

                    {/* Review summary */}
                    {reviewStats && reviewStats.total > 0 ? (
                        <>
                            <div className="flex items-center mb-6">
                                <div className="text-center mr-6">
                                    <div className="text-4xl font-bold text-gray-900 mb-1">
                                        {reviewStats.average.toFixed(1)}
                                    </div>
                                    <div className="flex items-center justify-center mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.round(reviewStats.average) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'}
                                    </div>
                                </div>

                                {/* Rating distribution */}
                                <div className="flex-1">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = reviewStats.distribution[star] || 0;
                                        const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center text-sm mb-1">
                                                <span className="w-3 text-gray-600 mr-2">{star}</span>
                                                <svg className="w-3 h-3 text-yellow-400 fill-current mr-2" viewBox="0 0 20 20">
                                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                </svg>
                                                <div className="flex-1 mx-2">
                                                    <div className="bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-yellow-400 h-2 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <span className="w-8 text-gray-600 text-xs">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Individual Reviews */}
                            {loadingReviews ? (
                                <div className="text-center py-4">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                                </div>
                            ) : reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review, idx) => (
                                        <div key={idx} className="border-t border-gray-100 pt-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-2">
                                                        {review.customerId?.fullName?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {review.customerId?.fullName || 'Anonymous'}
                                                        </p>
                                                        <div className="flex items-center mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg
                                                                    key={i}
                                                                    className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            <p className="text-gray-600">No reviews yet</p>
                            <p className="text-sm text-gray-500 mt-1">Be the first to review this item!</p>
                        </div>
                    )}

                    {/* Review Pagination */}
                    {reviewStats && reviewStats.total > reviewsPerPage && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-center space-x-2">
                                <button
                                    onClick={() => fetchReviews(currentReviewPage - 1)}
                                    disabled={currentReviewPage === 1 || loadingReviews}
                                    className={`px-3 py-1 rounded text-sm font-medium ${currentReviewPage === 1 || loadingReviews
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {currentReviewPage} of {totalReviewPages}
                                </span>
                                <button
                                    onClick={() => fetchReviews(currentReviewPage + 1)}
                                    disabled={currentReviewPage >= totalReviewPages || loadingReviews}
                                    className={`px-3 py-1 rounded text-sm font-medium ${currentReviewPage >= totalReviewPages || loadingReviews
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Related Items */}
                {relatedItems.length > 0 && (
                    <div className="bg-white mt-2 px-4 py-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">You May Also Like</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {relatedItems.map((relatedItem) => (
                                <div
                                    key={relatedItem._id}
                                    onClick={() => {
                                        navigate(`/item/${relatedItem._id}`, {
                                            state: { tableInfo, returnPath }
                                        });
                                    }}
                                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                        {relatedItem.images && relatedItem.images.length > 0 ? (
                                            <img
                                                src={getPrimaryImageUrl(relatedItem.images, relatedItem.primaryImageIndex)}
                                                alt={relatedItem.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-3xl">🍽️</span>
                                        )}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                                        {relatedItem.name}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-blue-600">
                                            ${relatedItem.price.toFixed(2)}
                                        </p>
                                        {relatedItem.averageRating > 0 && (
                                            <div className="flex items-center">
                                                <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                </svg>
                                                <span className="text-xs text-gray-600 ml-1">
                                                    {relatedItem.averageRating.toFixed(1)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Nutrition & Ingredients - Not available in backend yet */}
                {/* 
                <div className="bg-white mt-2 px-4 py-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Nutrition Facts</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Protein</span>
                                    <span className="font-medium">{item.nutritionFacts.protein}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Carbs</span>
                                    <span className="font-medium">{item.nutritionFacts.carbs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fat</span>
                                    <span className="font-medium">{item.nutritionFacts.fat}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fiber</span>
                                    <span className="font-medium">{item.nutritionFacts.fiber}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                            <div className="flex flex-wrap gap-2">
                                {item.ingredients.map((ingredient, index) => (
                                    <span
                                        key={index}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                    >
                                        {ingredient}
                                    </span>
                                ))}
                            </div>

                            {item.allergens.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Allergens</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {item.allergens.map((allergen, index) => (
                                            <span
                                                key={index}
                                                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
                                            >
                                                ⚠️ {allergen}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                */}
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                            <span className="text-xl font-bold text-gray-600">-</span>
                        </button>
                        <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                            <span className="text-xl font-bold text-gray-600">+</span>
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-xl font-bold text-gray-900">${calculateTotalPrice().toFixed(2)}</p>
                    </div>
                </div>

                <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || !canAddToCart}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${addingToCart || !canAddToCart
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {addingToCart ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding to Cart...
                        </span>
                    ) : !isAvailable ? (
                        'Currently Unavailable'
                    ) : !areRequiredModifiersSelected() ? (
                        'Select Required Options'
                    ) : (
                        'Add to Cart'
                    )}
                </button>
            </div >
        </div >
    );
};

export default MenuItemDetail;