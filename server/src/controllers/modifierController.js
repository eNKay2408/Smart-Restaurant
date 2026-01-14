import Modifier from '../models/Modifier.js';

/**
 * @desc    Get all modifiers
 * @route   GET /api/modifiers
 * @access  Public
 */
export const getModifiers = async (req, res, next) => {
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

        const modifiers = await Modifier.find(filter)
            .sort({ displayOrder: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: modifiers.length,
            data: modifiers,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single modifier
 * @route   GET /api/modifiers/:id
 * @access  Public
 */
export const getModifier = async (req, res, next) => {
    try {
        const modifier = await Modifier.findById(req.params.id);

        if (!modifier) {
            return res.status(404).json({
                success: false,
                message: 'Modifier not found',
            });
        }

        res.status(200).json({
            success: true,
            data: modifier,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new modifier
 * @route   POST /api/modifiers
 * @access  Private/Admin
 */
export const createModifier = async (req, res, next) => {
    try {
        const { name, type, required, displayOrder, options, restaurantId } = req.body;

        // Validate options
        if (!options || options.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one option is required',
            });
        }

        // For single type, ensure only one default
        if (type === 'single') {
            const defaultOptions = options.filter(opt => opt.isDefault);
            if (defaultOptions.length > 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Single selection modifier can only have one default option',
                });
            }
        }

        const modifier = await Modifier.create({
            name,
            type,
            required,
            displayOrder,
            options,
            restaurantId: restaurantId || req.user.restaurantId,
        });

        res.status(201).json({
            success: true,
            message: 'Modifier created successfully',
            data: modifier,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update modifier
 * @route   PUT /api/modifiers/:id
 * @access  Private/Admin
 */
export const updateModifier = async (req, res, next) => {
    try {
        let modifier = await Modifier.findById(req.params.id);

        if (!modifier) {
            return res.status(404).json({
                success: false,
                message: 'Modifier not found',
            });
        }

        const { name, type, required, displayOrder, options, isActive } = req.body;

        // Validate options if provided
        if (options) {
            if (options.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one option is required',
                });
            }

            // For single type, ensure only one default
            const modifierType = type || modifier.type;
            if (modifierType === 'single') {
                const defaultOptions = options.filter(opt => opt.isDefault);
                if (defaultOptions.length > 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Single selection modifier can only have one default option',
                    });
                }
            }
        }

        // Update fields
        if (name !== undefined) modifier.name = name;
        if (type !== undefined) modifier.type = type;
        if (required !== undefined) modifier.required = required;
        if (displayOrder !== undefined) modifier.displayOrder = displayOrder;
        if (options !== undefined) modifier.options = options;
        if (isActive !== undefined) modifier.isActive = isActive;

        await modifier.save();

        res.status(200).json({
            success: true,
            message: 'Modifier updated successfully',
            data: modifier,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete modifier
 * @route   DELETE /api/modifiers/:id
 * @access  Private/Admin
 */
export const deleteModifier = async (req, res, next) => {
    try {
        const modifier = await Modifier.findById(req.params.id);

        if (!modifier) {
            return res.status(404).json({
                success: false,
                message: 'Modifier not found',
            });
        }

        await modifier.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Modifier deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle modifier active status
 * @route   PATCH /api/modifiers/:id/toggle
 * @access  Private/Admin
 */
export const toggleModifierStatus = async (req, res, next) => {
    try {
        const modifier = await Modifier.findById(req.params.id);

        if (!modifier) {
            return res.status(404).json({
                success: false,
                message: 'Modifier not found',
            });
        }

        modifier.isActive = !modifier.isActive;
        await modifier.save();

        res.status(200).json({
            success: true,
            message: `Modifier ${modifier.isActive ? 'activated' : 'deactivated'} successfully`,
            data: modifier,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get modifiers by menu item (if menu items have modifier references)
 * @route   GET /api/modifiers/menu-item/:menuItemId
 * @access  Public
 */
export const getModifiersByMenuItem = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;

        // This would require MenuItem model to have modifiers field
        // For now, return all active modifiers for the restaurant
        const modifiers = await Modifier.find({ isActive: true })
            .sort({ displayOrder: 1 });

        res.status(200).json({
            success: true,
            count: modifiers.length,
            data: modifiers,
        });
    } catch (error) {
        next(error);
    }
};
