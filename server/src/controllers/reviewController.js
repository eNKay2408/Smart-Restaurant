import Review from '../models/Review.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review for a menu item
 *     description: Customer can create a review for a menu item they have ordered. Order must be completed.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - menuItemId
 *               - orderId
 *               - rating
 *             properties:
 *               menuItemId:
 *                 type: string
 *                 description: ID of the menu item to review
 *                 example: 507f1f77bcf86cd799439011
 *               orderId:
 *                 type: string
 *                 description: ID of the order containing this menu item
 *                 example: 507f1f77bcf86cd799439012
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5 stars
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review comment
 *                 example: Excellent dish! Highly recommend.
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - validation error or already reviewed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - not authenticated
 *       403:
 *         description: Forbidden - not a customer
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/reviews/menu-item/{menuItemId}:
 *   get:
 *     summary: Get all reviews for a menu item
 *     description: Retrieve reviews with pagination, statistics, and rating distribution
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the menu item
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *                 stats:
 *                   $ref: '#/components/schemas/ReviewStats'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 24
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get customer's own reviews
 *     description: Retrieve all reviews created by the authenticated customer
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized - not authenticated
 *       403:
 *         description: Forbidden - not a customer
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/reviews/can-review/{orderId}:
 *   get:
 *     summary: Check if customer can review items from an order
 *     description: Verify if customer can review menu items from a specific order
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the order
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Review eligibility checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 canReview:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: You can review items from this order
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       menuItemId:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439012
 *                       name:
 *                         type: string
 *                         example: Grilled Salmon
 *                       alreadyReviewed:
 *                         type: boolean
 *                         example: false
 *       400:
 *         description: Bad request - order not eligible for review
 *       401:
 *         description: Unauthorized - not authenticated
 *       403:
 *         description: Forbidden - not a customer or not your order
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
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
