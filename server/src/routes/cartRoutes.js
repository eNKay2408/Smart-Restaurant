import express from 'express';
import {
    getCart,
    addItemToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    mergeCart,
    getCartSummary,
} from '../controllers/cartController.js';
import { protect, optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         menuItemId:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: number
 *         modifiers:
 *           type: array
 *         specialInstructions:
 *           type: string
 *         subtotal:
 *           type: number
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         sessionId:
 *           type: string
 *         customerId:
 *           type: string
 *         tableId:
 *           type: string
 *         restaurantId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalItems:
 *           type: number
 *         total:
 *           type: number
 *         expiresAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart (after login)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carts merged successfully
 */
router.post('/merge', protect, mergeCart);

/**
 * @swagger
 * /api/cart/summary:
 *   get:
 *     summary: Get cart summary (logged-in user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart summary
 */
router.get('/summary', optionalAuth, getCartSummary);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart (logged-in user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', optionalAuth, getCart);

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart (logged-in user)
 *     tags: [Cart]
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
 *               - quantity
 *               - restaurantId
 *             properties:
 *               menuItemId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               modifiers:
 *                 type: array
 *               specialInstructions:
 *                 type: string
 *               tableId:
 *                 type: string
 *               restaurantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/items', optionalAuth, addItemToCart);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear cart (logged-in user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/', optionalAuth, clearCart);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   put:
 *     summary: Update cart item (logged-in user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *               modifiers:
 *                 type: array
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/items/:itemId', optionalAuth, updateCartItem);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart (logged-in user)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/items/:itemId', optionalAuth, removeCartItem);

// ============================================
// Guest Cart Routes (Session-based)
// ============================================

/**
 * @swagger
 * /api/cart/{sessionId}/summary:
 *   get:
 *     summary: Get cart summary (guest)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart summary
 */
router.get('/:sessionId/summary', getCartSummary);

/**
 * @swagger
 * /api/cart/{sessionId}:
 *   get:
 *     summary: Get cart (guest)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/:sessionId', getCart);

/**
 * @swagger
 * /api/cart/{sessionId}/items:
 *   post:
 *     summary: Add item to cart (guest)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - menuItemId
 *               - quantity
 *               - restaurantId
 *             properties:
 *               menuItemId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               modifiers:
 *                 type: array
 *               specialInstructions:
 *                 type: string
 *               tableId:
 *                 type: string
 *               restaurantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/:sessionId/items', addItemToCart);

/**
 * @swagger
 * /api/cart/{sessionId}:
 *   delete:
 *     summary: Clear cart (guest)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/:sessionId', clearCart);

/**
 * @swagger
 * /api/cart/{sessionId}/items/{itemId}:
 *   put:
 *     summary: Update cart item (guest)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *               modifiers:
 *                 type: array
 *               specialInstructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/:sessionId/items/:itemId', updateCartItem);

/**
 * @swagger
 * /api/cart/{sessionId}/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart (guest)
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/:sessionId/items/:itemId', removeCartItem);

export default router;
