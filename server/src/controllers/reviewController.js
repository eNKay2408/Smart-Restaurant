import Review from '../models/Review.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (Customer)
export const createReview = async (req, res) => {
    try {
        const { menuItemId, orderId, rating, comment } = req.body;
        const customerId = req.user.id;

        // Validate order exists and belongs to customer
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Check if order is completed
        if (order.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'You can only review items from completed orders',
            });
        }

        // Check if customer ordered this item
        const itemInOrder = order.items.find(
            (item) => item.menuItemId.toString() === menuItemId
        );

        if (!itemInOrder) {
            return res.status(400).json({
                success: false,
                message: 'You can only review items you have ordered',
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            customerId,
            menuItemId,
            orderId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this item from this order',
            });
        }

        // Create review
        const review = await Review.create({
            menuItemId,
            customerId,
            orderId,
            rating,
            comment: comment || '',
            restaurantId: order.restaurantId,
        });

        // Update menu item average rating
        await updateMenuItemRating(menuItemId);

        const populatedReview = await Review.findById(review._id)
            .populate('customerId', 'fullName avatar')
            .populate('menuItemId', 'name');

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: populatedReview,
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating review',
            error: error.message,
        });
    }
};

// @desc    Get reviews for a menu item
// @route   GET /api/reviews/menu-item/:menuItemId
// @access  Public
export const getMenuItemReviews = async (req, res) => {
    try {
        const { menuItemId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find({ menuItemId })
            .populate('customerId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ menuItemId });

        // Calculate rating stats
        const ratingStats = await Review.aggregate([
            { $match: { menuItemId: new mongoose.Types.ObjectId(menuItemId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratings: {
                        $push: '$rating',
                    },
                },
            },
        ]);

        const stats = ratingStats[0] || {
            averageRating: 0,
            totalReviews: 0,
        };

        // Count ratings by star
        const ratingCounts = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        };

        if (stats.ratings) {
            stats.ratings.forEach((rating) => {
                ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
            });
        }

        res.json({
            success: true,
            data: reviews,
            stats: {
                average: stats.averageRating || 0,
                total: stats.totalReviews || 0,
                distribution: ratingCounts,
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message,
        });
    }
};

// @desc    Get customer's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private (Customer)
export const getMyReviews = async (req, res) => {
    try {
        const customerId = req.user.id;

        const reviews = await Review.find({ customerId })
            .populate('menuItemId', 'name images')
            .populate('orderId', 'orderNumber')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reviews',
            error: error.message,
        });
    }
};

// @desc    Check if customer can review items from an order
// @route   GET /api/reviews/can-review/:orderId
// @access  Private (Customer)
export const checkCanReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order || order.status !== 'completed') {
            return res.json({
                success: true,
                data: {
                    canReview: false,
                    items: [],
                },
            });
        }

        // Get existing reviews for this order
        const existingReviews = await Review.find({ customerId, orderId });
        const reviewedItemIds = existingReviews.map((r) =>
            r.menuItemId.toString()
        );

        // Find items that haven't been reviewed yet
        const itemsCanReview = order.items
            .filter(
                (item) => !reviewedItemIds.includes(item.menuItemId.toString())
            )
            .map((item) => ({
                menuItemId: item.menuItemId,
                name: item.name,
            }));

        res.json({
            success: true,
            data: {
                canReview: itemsCanReview.length > 0,
                items: itemsCanReview,
                alreadyReviewed: existingReviews,
            },
        });
    } catch (error) {
        console.error('Check can review error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking review status',
            error: error.message,
        });
    }
};

// Helper function to update menu item rating
async function updateMenuItemRating(menuItemId) {
    try {
        const stats = await Review.aggregate([
            { $match: { menuItemId: new mongoose.Types.ObjectId(menuItemId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        if (stats.length > 0) {
            await MenuItem.findByIdAndUpdate(menuItemId, {
                averageRating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
                totalReviews: stats[0].totalReviews,
            });
        }
    } catch (error) {
        console.error('Update menu item rating error:', error);
    }
}

export default {
    createReview,
    getMenuItemReviews,
    getMyReviews,
    checkCanReview,
};
