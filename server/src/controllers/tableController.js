import Table from '../models/Table.js';
import QRCode from 'qrcode';
import { generateQRToken } from '../config/jwt.js';

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private (Admin, Waiter)
export const getTables = async (req, res) => {
    try {
        const { restaurantId, status } = req.query;

        const filter = {};
        if (restaurantId) filter.restaurantId = restaurantId;
        if (status) filter.status = status;

        const tables = await Table.find(filter).sort({ tableNumber: 1 });

        res.json({
            success: true,
            count: tables.length,
            data: tables,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching tables',
            error: error.message,
        });
    }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Public
export const getTable = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found',
            });
        }

        res.json({
            success: true,
            data: table,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching table',
            error: error.message,
        });
    }
};

// @desc    Create table with QR code
// @route   POST /api/tables
// @access  Private (Admin only)
export const createTable = async (req, res) => {
    try {
        const { tableNumber, capacity, location, restaurantId } = req.body;

        const finalRestaurantId = restaurantId || req.user.restaurantId;

        // Generate QR token
        const qrToken = generateQRToken(null, finalRestaurantId); // tableId will be updated after creation

        // Create table
        const table = await Table.create({
            tableNumber,
            capacity,
            location,
            restaurantId: finalRestaurantId,
            qrCode: {
                token: qrToken,
                generatedAt: new Date(),
            },
        });

        // Update QR token with actual table ID
        const updatedQrToken = generateQRToken(table._id, finalRestaurantId);
        table.qrCode.token = updatedQrToken;

        // Generate QR code URL
        const qrUrl = `${process.env.QR_CODE_BASE_URL || 'http://localhost:5173/table'}?token=${updatedQrToken}`;

        // Generate QR code image (base64)
        const qrCodeImage = await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });

        table.qrCode.imageUrl = qrCodeImage;
        await table.save();

        res.status(201).json({
            success: true,
            message: 'Table created successfully with QR code',
            data: table,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating table',
            error: error.message,
        });
    }
};

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (Admin only)
export const updateTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found',
            });
        }

        res.json({
            success: true,
            message: 'Table updated successfully',
            data: table,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating table',
            error: error.message,
        });
    }
};

// @desc    Regenerate QR code for table
// @route   POST /api/tables/:id/regenerate-qr
// @access  Private (Admin only)
export const regenerateQRCode = async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found',
            });
        }

        // Generate new QR token
        const newQrToken = generateQRToken(table._id, table.restaurantId);
        const qrUrl = `${process.env.QR_CODE_BASE_URL || 'http://localhost:5173/table'}?token=${newQrToken}`;

        // Generate new QR code image
        const qrCodeImage = await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 2,
        });

        table.qrCode = {
            token: newQrToken,
            imageUrl: qrCodeImage,
            generatedAt: new Date(),
        };

        await table.save();

        res.json({
            success: true,
            message: 'QR code regenerated successfully',
            data: table,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error regenerating QR code',
            error: error.message,
        });
    }
};

// @desc    Delete table (soft delete)
// @route   DELETE /api/tables/:id
// @access  Private (Admin only)
export const deleteTable = async (req, res) => {
    try {
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            { isActive: false, status: 'inactive' },
            { new: true }
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found',
            });
        }

        res.json({
            success: true,
            message: 'Table deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting table',
            error: error.message,
        });
    }
};

// @desc    Verify QR code token
// @route   GET /api/tables/verify-qr/:token
// @access  Public
export const verifyQRCode = async (req, res) => {
    try {
        const { token } = req.params;

        const table = await Table.findOne({ 'qrCode.token': token })
            .populate('restaurantId', 'name logo');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Invalid QR code',
            });
        }

        if (!table.isActive || table.status === 'inactive') {
            return res.status(400).json({
                success: false,
                message: 'This table is currently inactive',
            });
        }

        res.json({
            success: true,
            data: {
                tableId: table._id,
                tableNumber: table.tableNumber,
                capacity: table.capacity,
                restaurant: table.restaurantId,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying QR code',
            error: error.message,
        });
    }
};
