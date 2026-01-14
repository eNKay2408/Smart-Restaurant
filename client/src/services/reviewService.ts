import axiosInstance from '../config/axiosConfig';

interface ReviewData {
    menuItemId: string;
    orderId: string;
    rating: number;
    comment?: string;
}

interface Review {
    _id: string;
    menuItemId: string;
    customerId: string;
    orderId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

class ReviewService {
    /**
     * Create a review for a menu item
     */
    async createReview(reviewData: ReviewData) {
        try {
            const response = await axiosInstance.post('/reviews', reviewData);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Error creating review',
            };
        }
    }

    /**
     * Get reviews for a menu item
     */
    async getMenuItemReviews(menuItemId: string, page = 1, limit = 10) {
        try {
            const response = await axiosInstance.get(`/reviews/menu-item/${menuItemId}`, {
                params: { page, limit },
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Error fetching reviews',
            };
        }
    }

    /**
     * Get customer's reviews
     */
    async getMyReviews() {
        try {
            const response = await axiosInstance.get('/reviews/my-reviews');
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Error fetching your reviews',
            };
        }
    }

    /**
     * Check if customer can review items from an order
     */
    async canReviewOrder(orderId: string) {
        try {
            const response = await axiosInstance.get(`/reviews/can-review/${orderId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Error checking review status',
            };
        }
    }
}

export const reviewService = new ReviewService();
export default reviewService;
