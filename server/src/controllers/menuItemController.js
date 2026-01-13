import MenuItem from '../models/MenuItem.js';

// @desc    Get all menu items with filters
// @route   GET /api/menu-items
// @access  Public
export const getMenuItems = async (req, res) => {
    try {
        const {
            restaurantId,
            categoryId,
            status,
            search,
            sortBy = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 20,
        } = req.query;

        // Build filter
        const filter = { isActive: true };
        if (restaurantId) filter.restaurantId = restaurantId;
        if (categoryId) filter.categoryId = categoryId;
        if (status) filter.status = status;

        // Text search
        if (search) {
            filter.$text = { $search: search };
        }

        // Build sort
        const sortOptions = {};
        if (sortBy === 'popularity') {
            sortOptions.totalOrders = -1;
        } else if (sortBy === 'price') {
            sortOptions.price = order === 'asc' ? 1 : -1;
        } else if (sortBy === 'rating') {
            sortOptions.averageRating = -1;
        } else {
            sortOptions[sortBy] = order === 'asc' ? 1 : -1;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const menuItems = await MenuItem.find(filter)
            .populate('categoryId', 'name')
            .populate({
                path: 'modifierIds',
                model: 'Modifier',
                select: 'name type required displayOrder options isActive'
            })
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MenuItem.countDocuments(filter);

        // Process menu items to combine embedded and referenced modifiers
        const processedMenuItems = menuItems.map(item => {
            let allModifiers = [];
            
            // Add embedded modifiers (legacy)
            if (item.modifiers && item.modifiers.length > 0) {
                allModifiers = [...item.modifiers];
            }
            
            // Add referenced modifiers (new format)
            if (item.modifierIds && item.modifierIds.length > 0) {
                allModifiers = [...allModifiers, ...item.modifierIds];
            }

            return {
                ...item.toObject(),
                modifiers: allModifiers
            };
        });

        res.json({
            success: true,
            count: menuItems.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: processedMenuItems,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching menu items',
            error: error.message,
        });
    }
};

// @desc    Get single menu item
// @route   GET /api/menu-items/:id
// @access  Public
export const getMenuItem = async (req, res) => {
    try {
        console.log('🔍 Fetching menu item:', req.params.id);
        
        const menuItem = await MenuItem.findById(req.params.id)
            .populate('categoryId', 'name')
            .populate({
                path: 'modifierIds',
                model: 'Modifier',
                select: 'name type required displayOrder options isActive'
            });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        // Combine embedded modifiers and referenced modifiers
        let allModifiers = [];
        
        // Add embedded modifiers (legacy)
        if (menuItem.modifiers && menuItem.modifiers.length > 0) {
            allModifiers = [...menuItem.modifiers];
        }
        
        // Add referenced modifiers (new format)
        if (menuItem.modifierIds && menuItem.modifierIds.length > 0) {
            allModifiers = [...allModifiers, ...menuItem.modifierIds];
        }

        console.log('📄 Menu item loaded:', {
            id: menuItem._id,
            name: menuItem.name,
            embeddedModifiers: menuItem.modifiers?.length || 0,
            referencedModifiers: menuItem.modifierIds?.length || 0,
            totalModifiers: allModifiers.length
        });

        // Return with combined modifiers
        const responseData = {
            ...menuItem.toObject(),
            modifiers: allModifiers
        };

        res.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error('❌ Error fetching menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching menu item',
            error: error.message,
        });
    }
};

// @desc    Create menu item
// @route   POST /api/menu-items
// @access  Private (Admin only)
export const createMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.create({
            ...req.body,
            restaurantId: req.body.restaurantId || req.user.restaurantId,
        });

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: menuItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating menu item',
            error: error.message,
        });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu-items/:id
// @access  Private (Admin only)
export const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: menuItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating menu item',
            error: error.message,
        });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private (Admin only)
export const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        res.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting menu item',
            error: error.message,
        });
    }
};

// @desc    Update menu item status
// @route   PATCH /api/menu-items/:id/status
// @access  Private (Admin only)
export const updateMenuItemStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        res.json({
            success: true,
            message: 'Menu item status updated successfully',
            data: menuItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating menu item status',
            error: error.message,
        });
    }
};

// @desc    Update primary image index
// @route   PATCH /api/menu-items/:id/primary-image
// @access  Private (Admin only)
export const updatePrimaryImage = async (req, res) => {
    try {
        const { primaryImageIndex } = req.body;

        // Validate index
        if (typeof primaryImageIndex !== 'number' || primaryImageIndex < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid primary image index',
            });
        }

        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        // Check if index is within bounds
        if (primaryImageIndex >= menuItem.images.length) {
            return res.status(400).json({
                success: false,
                message: `Primary image index must be less than ${menuItem.images.length}`,
            });
        }

        menuItem.primaryImageIndex = primaryImageIndex;
        await menuItem.save();

        res.json({
            success: true,
            message: 'Primary image updated successfully',
            data: menuItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating primary image',
            error: error.message,
        });
    }
};
