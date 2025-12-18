import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const { restaurantId } = req.query;

        const filter = restaurantId ? { restaurantId, isActive: true } : { isActive: true };

        const categories = await Category.find(filter).sort({ displayOrder: 1 });

        res.json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message,
        });
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message,
        });
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin only)
export const createCategory = async (req, res) => {
    try {
        const { name, description, image, displayOrder, restaurantId } = req.body;

        const category = await Category.create({
            name,
            description,
            image,
            displayOrder,
            restaurantId: restaurantId || req.user.restaurantId,
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message,
        });
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message,
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message,
        });
    }
};
