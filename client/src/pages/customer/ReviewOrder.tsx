import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
import orderService from '../../services/orderService';
import { toast } from 'react-toastify';

interface ItemToReview {
    menuItemId: string;
    name: string;
    rating: number;
    comment: string;
    submitted: boolean;
}

const ReviewOrder: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<ItemToReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load order details
            const orderResponse = await orderService.getOrder(orderId!);
            if (!orderResponse.success || !orderResponse.data) {
                throw new Error('Order not found');
            }

            setOrder(orderResponse.data);

            // Check which items can be reviewed
            const reviewStatus = await reviewService.canReviewOrder(orderId!);

            if (!reviewStatus.success || !reviewStatus.data.canReview) {
                setError('No items available to review from this order');
                setLoading(false);
                return;
            }

            // Initialize review form for each item
            const itemsToReview: ItemToReview[] = reviewStatus.data.items.map((item: any) => ({
                menuItemId: item.menuItemId,
                name: item.name,
                rating: 0,
                comment: '',
                submitted: false,
            }));

            setItems(itemsToReview);
        } catch (err: any) {
            console.error('Load order error:', err);
            setError(err.message || 'Failed to load order');
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (index: number, rating: number) => {
        const newItems = [...items];
        newItems[index].rating = rating;
        setItems(newItems);
    };

    const handleCommentChange = (index: number, comment: string) => {
        const newItems = [...items];
        newItems[index].comment = comment;
        setItems(newItems);
    };

    const handleSubmitReview = async (index: number) => {
        const item = items[index];

        if (item.rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);

            await reviewService.createReview({
                menuItemId: item.menuItemId,
                orderId: orderId!,
                rating: item.rating,
                comment: item.comment,
            });

            toast.success(`Review submitted for ${item.name}!`);

            // Mark as submitted
            const newItems = [...items];
            newItems[index].submitted = true;
            setItems(newItems);

            // If all items reviewed, navigate back
            if (newItems.every(i => i.submitted)) {
                setTimeout(() => {
                    navigate('/order-history');
                }, 1500);
            }
        } catch (err: any) {
            console.error('Submit review error:', err);
            toast.error(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        navigate('/order-history');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading review form...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center px-4">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/order-history')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Order History
                    </button>
                </div>
            </div>
        );
    }

    const allSubmitted = items.every(i => i.submitted);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
                <div className="flex items-center px-4 py-3">
                    <button
                        onClick={handleSkip}
                        className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">Leave a Review</h1>
                        <p className="text-sm text-gray-600">{order?.orderNumber}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 pb-24">
                {/* Introduction */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <span className="text-2xl mr-3">⭐</span>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">
                                How was your experience?
                            </h3>
                            <p className="text-sm text-blue-700">
                                Help us improve by sharing your thoughts on the items you ordered
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items to Review */}
                <div className="space-y-4">
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={`bg-white rounded-lg shadow-sm border ${item.submitted ? 'border-green-200' : 'border-gray-200'
                                } p-4`}
                        >
                            {/* Item Header */}
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                                    {item.name}
                                </h3>
                                {item.submitted && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                        ✓ Submitted
                                    </span>
                                )}
                            </div>

                            {!item.submitted && (
                                <>
                                    {/* Star Rating */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Rating *
                                        </label>
                                        <div className="flex space-x-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleRatingChange(index, star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <svg
                                                        className={`w-10 h-10 ${star <= item.rating
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                            }`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                        />
                                                    </svg>
                                                </button>
                                            ))}
                                        </div>
                                        {item.rating > 0 && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {item.rating === 1 && 'Poor'}
                                                {item.rating === 2 && 'Fair'}
                                                {item.rating === 3 && 'Good'}
                                                {item.rating === 4 && 'Very Good'}
                                                {item.rating === 5 && 'Excellent'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Comment */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Comments (Optional)
                                        </label>
                                        <textarea
                                            value={item.comment}
                                            onChange={(e) => handleCommentChange(index, e.target.value)}
                                            placeholder="Share your thoughts about this item..."
                                            maxLength={500}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {item.comment.length}/500 characters
                                        </p>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={() => handleSubmitReview(index)}
                                        disabled={submitting || item.rating === 0}
                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </>
                            )}

                            {item.submitted && (
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-green-800 font-medium">
                                        Thank you for your feedback!
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Success Message */}
                {allSubmitted && (
                    <div className="mt-6 bg-green-50 rounded-lg p-6 text-center">
                        <div className="text-5xl mb-3">🎉</div>
                        <h3 className="text-xl font-bold text-green-900 mb-2">
                            All Reviews Submitted!
                        </h3>
                        <p className="text-green-700 mb-4">
                            Thank you for taking the time to share your feedback
                        </p>
                        <button
                            onClick={handleSkip}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            Back to Order History
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Skip Button */}
            {!allSubmitted && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
                    <button
                        onClick={handleSkip}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Skip for Now
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewOrder;
