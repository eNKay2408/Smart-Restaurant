import Promotion from '../models/Promotion.js';

/**
 * @desc    Get all promotions
 * @route   GET /api/promotions
 * @access  Private/Admin
 */
export const getPromotions = async (req, res, next) => {
    try {
        const { restaurantId, isActive } = req.query;

        // Build filter
        const filter = {};
        if (restaurantId) {
            filter.restaurantId = restaurantId;
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const promotions = await Promotion.find(filter)
            .populate({ path: 'applicableCategories', select: 'name', strictPopulate: false })
            .populate({ path: 'applicableMenuItems', select: 'name', strictPopulate: false })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: promotions.length,
            data: promotions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single promotion
 * @route   GET /api/promotions/:id
 * @access  Private/Admin
 */
export const getPromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findById(req.params.id)
            .populate({ path: 'applicableCategories', select: 'name', strictPopulate: false })
            .populate({ path: 'applicableMenuItems', select: 'name', strictPopulate: false });

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found',
            });
        }

        res.status(200).json({
            success: true,
            data: promotion,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new promotion
 * @route   POST /api/promotions
 * @access  Private/Admin
 */
export const createPromotion = async (req, res, next) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit,
            restaurantId,
            applicableCategories,
            applicableMenuItems,
        } = req.body;

        // Check if code already exists
        const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
        if (existingPromotion) {
            return res.status(400).json({
                success: false,
                message: 'Promotion code already exists',
            });
        }

        const promotion = await Promotion.create({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit,
            restaurantId,
            applicableCategories,
            applicableMenuItems,
        });

        res.status(201).json({
            success: true,
            message: 'Promotion created successfully',
            data: promotion,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update promotion
 * @route   PUT /api/promotions/:id
 * @access  Private/Admin
 */
export const updatePromotion = async (req, res, next) => {
    try {
        let promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found',
            });
        }

        // If updating code, check for duplicates
        if (req.body.code && req.body.code.toUpperCase() !== promotion.code) {
            const existingPromotion = await Promotion.findOne({
                code: req.body.code.toUpperCase(),
            });
            if (existingPromotion) {
                return res.status(400).json({
                    success: false,
                    message: 'Promotion code already exists',
                });
            }
        }

        // Update fields
        const allowedFields = [
            'code',
            'description',
            'discountType',
            'discountValue',
            'minOrderAmount',
            'maxDiscountAmount',
            'startDate',
            'endDate',
            'usageLimit',
            'isActive',
            'applicableCategories',
            'applicableMenuItems',
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                if (field === 'code') {
                    promotion[field] = req.body[field].toUpperCase();
                } else {
                    promotion[field] = req.body[field];
                }
            }
        });

        await promotion.save();

        res.status(200).json({
            success: true,
            message: 'Promotion updated successfully',
            data: promotion,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete promotion
 * @route   DELETE /api/promotions/:id
 * @access  Private/Admin
 */
export const deletePromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found',
            });
        }

        await promotion.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Promotion deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle promotion active status
 * @route   PATCH /api/promotions/:id/toggle
 * @access  Private/Admin
 */
export const togglePromotionStatus = async (req, res, next) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found',
            });
        }

        promotion.isActive = !promotion.isActive;
        await promotion.save();

        res.status(200).json({
            success: true,
            message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`,
            data: promotion,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Validate promotion code
 * @route   POST /api/promotions/validate
 * @access  Public
 */
export const validatePromotionCode = async (req, res, next) => {
    try {
        const { code, orderAmount, restaurantId } = req.body;

        if (!code || !orderAmount || !restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Code, order amount, and restaurant ID are required',
            });
        }

        // Find promotion by code
        const promotion = await Promotion.findOne({
            code: code.toUpperCase(),
            restaurantId,
        });

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Invalid promotion code',
            });
        }

        // Validate promotion for this order
        const validation = promotion.validateForOrder(orderAmount);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message,
            });
        }

        // Calculate discount
        const discountAmount = promotion.calculateDiscount(orderAmount);
        const finalAmount = orderAmount - discountAmount;

        res.status(200).json({
            success: true,
            message: 'Promotion code is valid',
            data: {
                promotionId: promotion._id,
                code: promotion.code,
                description: promotion.description,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                discountAmount: parseFloat(discountAmount.toFixed(2)),
                originalAmount: parseFloat(orderAmount.toFixed(2)),
                finalAmount: parseFloat(finalAmount.toFixed(2)),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Apply promotion (increment usage count)
 * @route   POST /api/promotions/:id/apply
 * @access  Private
 */
export const applyPromotion = async (req, res, next) => {
    try {
        const promotion = await Promotion.findById(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                message: 'Promotion not found',
            });
        }

        // Increment usage count
        promotion.usedCount += 1;
        await promotion.save();

        res.status(200).json({
            success: true,
            message: 'Promotion applied successfully',
            data: {
                usedCount: promotion.usedCount,
                remainingUses: promotion.remainingUses,
            },
        });
    } catch (error) {
        next(error);
    }
};
