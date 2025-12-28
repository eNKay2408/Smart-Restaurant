import express from 'express';
import {
    getTables,
    getTable,
    createTable,
    updateTable,
    regenerateQRCode,
    deleteTable,
    verifyQRCode,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes

/**
 * @swagger
 * /api/tables/verify-qr/{token}:
 *   get:
 *     tags: [Tables]
 *     summary: Verify QR code
 *     description: Verify table QR code token and get table information
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: QR code token
 *     responses:
 *       200:
 *         description: QR code verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Table'
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-qr/:token', verifyQRCode);

// Protected routes

/**
 * @swagger
 * /api/tables:
 *   get:
 *     tags: [Tables]
 *     summary: Get all tables
 *     description: Retrieve all tables (Admin/Waiter only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Table'
 */
router.get('/', protect, authorize('admin', 'waiter', 'super_admin'), getTables);

/**
 * @swagger
 * /api/tables/{id}:
 *   get:
 *     tags: [Tables]
 *     summary: Get single table
 *     description: Retrieve a specific table by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table details
 *       404:
 *         description: Table not found
 */
router.get('/:id', protect, authorize('admin', 'waiter', 'super_admin'), getTable);

// Admin only routes

/**
 * @swagger
 * /api/tables:
 *   post:
 *     tags: [Tables]
 *     summary: Create table
 *     description: Create a new table with QR code (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *               - restaurantId
 *             properties:
 *               tableNumber:
 *                 type: string
 *                 example: T01
 *               area:
 *                 type: string
 *                 example: Main Hall
 *               capacity:
 *                 type: number
 *                 example: 4
 *               restaurantId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Table created successfully with QR code
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, authorize('admin', 'super_admin'), createTable);

/**
 * @swagger
 * /api/tables/{id}:
 *   put:
 *     tags: [Tables]
 *     summary: Update table
 *     description: Update table information (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tableNumber:
 *                 type: string
 *               area:
 *                 type: string
 *               capacity:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [available, occupied, reserved]
 *     responses:
 *       200:
 *         description: Table updated successfully
 *       404:
 *         description: Table not found
 */
router.put('/:id', protect, authorize('admin', 'super_admin'), updateTable);

/**
 * @swagger
 * /api/tables/{id}/regenerate-qr:
 *   post:
 *     tags: [Tables]
 *     summary: Regenerate QR code
 *     description: Generate a new QR code for the table (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: QR code regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *       404:
 *         description: Table not found
 */
router.post('/:id/regenerate-qr', protect, authorize('admin', 'super_admin'), regenerateQRCode);

/**
 * @swagger
 * /api/tables/{id}:
 *   delete:
 *     tags: [Tables]
 *     summary: Delete table
 *     description: Delete a table (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Table ID
 *     responses:
 *       200:
 *         description: Table deleted successfully
 *       404:
 *         description: Table not found
 */
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteTable);

export default router;
