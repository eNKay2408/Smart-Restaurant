import User from '../models/User.js';

// @desc    Get all users (staff only - no customers)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        // Exclude customers from list, only show staff
        const users = await User.find({
            role: { $in: ['admin', 'waiter', 'kitchen'] }
        }).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @desc    Create new user (waiter or kitchen staff)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
    try {
        const { fullName, email, password, role, phone } = req.body;

        // Validate role - only allow waiter or kitchen creation
        if (!['waiter', 'kitchen'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Only waiter or kitchen staff can be created'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Create user
        const user = await User.create({
            fullName,
            email,
            password,
            role,
            phone,
            isEmailVerified: true, // Staff accounts are auto-verified
            isActive: true
        });

        // Return user without password
        const userResponse = await User.findById(user._id).select('-password');

        res.status(201).json({
            success: true,
            message: `${role === 'waiter' ? 'Waiter' : 'Kitchen staff'} account created successfully`,
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// @desc    Update user
// @route   PATCH /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
    try {
        const { fullName, phone, isActive, role } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent updating admin role
        if (user.role === 'admin' && role && role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot change admin role'
            });
        }

        // Update fields
        if (fullName !== undefined) user.fullName = fullName;
        if (phone !== undefined) user.phone = phone;
        if (isActive !== undefined) user.isActive = isActive;
        if (role !== undefined && ['waiter', 'kitchen'].includes(role)) {
            user.role = role;
        }

        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting admin
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};
