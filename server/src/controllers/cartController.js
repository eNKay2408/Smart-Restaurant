import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';

/**
 * @desc    Get cart (session-based or user-based)
 * @route   GET /api/cart/:sessionId (guest)
 * @route   GET /api/cart (logged-in user)
 * @access  Public
 */
export const getCart = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?._id;

        let cart;

        if (userId) {
            // Logged-in user: find by customerId
            cart = await Cart.findOne({ customerId: userId })
                .populate('items.menuItemId', 'name price imageUrl status')
                .populate('tableId', 'tableNumber');
        } else if (sessionId) {
            // Guest: find by sessionId
            cart = await Cart.findOne({ sessionId })
                .populate('items.menuItemId', 'name price imageUrl status')
                .populate('tableId', 'tableNumber');
        } else {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required for guest users',
            });
        }

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    totalItems: 0,
                    total: 0,
                },
            });
        }

        // Extend cart expiration on access
        await cart.extendExpiration();

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/:sessionId/items (guest)
 * @route   POST /api/cart/items (logged-in user)
 * @access  Public
 */
export const addItemToCart = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?._id;
        const { menuItemId, quantity, modifiers, specialInstructions, tableId, restaurantId } = req.body;

        // Validate required fields
        if (!menuItemId || !quantity || !restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Menu item ID, quantity, and restaurant ID are required',
            });
        }

        // Get menu item details
        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }

        if (menuItem.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Menu item is not available',
            });
        }

        // Find or create cart
        let cart;
        const query = userId ? { customerId: userId } : { sessionId };

        cart = await Cart.findOne(query);

        if (!cart) {
            // Create new cart
            cart = new Cart({
                sessionId: userId ? null : sessionId,
                customerId: userId || null,
                tableId: tableId || null,
                restaurantId,
                items: [],
            });
        }

        // Calculate item subtotal
        const itemData = {
            menuItemId,
            name: menuItem.name,
            price: menuItem.price,
            quantity: parseInt(quantity),
            modifiers: modifiers || [],
            specialInstructions: specialInstructions || '',
            subtotal: 0,
        };

        itemData.subtotal = cart.calculateItemSubtotal(itemData);

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
            item =>
                item.menuItemId.toString() === menuItemId &&
                JSON.stringify(item.modifiers) === JSON.stringify(modifiers || [])
        );

        if (existingItemIndex > -1) {
            // Update existing item quantity
            cart.items[existingItemIndex].quantity += parseInt(quantity);
            cart.items[existingItemIndex].subtotal = cart.calculateItemSubtotal(cart.items[existingItemIndex]);
        } else {
            // Add new item
            cart.items.push(itemData);
        }

        // Update table if provided
        if (tableId) {
            cart.tableId = tableId;
        }

        await cart.save();
        await cart.populate('items.menuItemId', 'name price imageUrl status');

        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:sessionId/items/:itemId (guest)
 * @route   PUT /api/cart/items/:itemId (logged-in user)
 * @access  Public
 */
export const updateCartItem = async (req, res, next) => {
    try {
        const { sessionId, itemId } = req.params;
        const userId = req.user?._id;
        const { quantity, modifiers, specialInstructions } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1',
            });
        }

        // Find cart
        const query = userId ? { customerId: userId } : { sessionId };
        const cart = await Cart.findOne(query);

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        // Find item in cart
        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart',
            });
        }

        // Update item
        item.quantity = parseInt(quantity);
        if (modifiers !== undefined) item.modifiers = modifiers;
        if (specialInstructions !== undefined) item.specialInstructions = specialInstructions;

        // Recalculate subtotal
        item.subtotal = cart.calculateItemSubtotal(item);

        await cart.save();
        await cart.populate('items.menuItemId', 'name price imageUrl status');

        res.status(200).json({
            success: true,
            message: 'Cart item updated',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:sessionId/items/:itemId (guest)
 * @route   DELETE /api/cart/items/:itemId (logged-in user)
 * @access  Public
 */
export const removeCartItem = async (req, res, next) => {
    try {
        const { sessionId, itemId } = req.params;
        const userId = req.user?._id;

        // Find cart
        const query = userId ? { customerId: userId } : { sessionId };
        const cart = await Cart.findOne(query);

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        // Remove item
        cart.items.pull(itemId);
        await cart.save();
        await cart.populate('items.menuItemId', 'name price imageUrl status');

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: cart,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart/:sessionId (guest)
 * @route   DELETE /api/cart (logged-in user)
 * @access  Public
 */
export const clearCart = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?._id;

        // Find and delete cart
        const query = userId ? { customerId: userId } : { sessionId };
        const cart = await Cart.findOneAndDelete(query);

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Merge guest cart with user cart (after login)
 * @route   POST /api/cart/merge
 * @access  Private
 */
export const mergeCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required',
            });
        }

        // Find guest cart
        const guestCart = await Cart.findOne({ sessionId });
        if (!guestCart || guestCart.items.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No guest cart to merge',
            });
        }

        // Find or create user cart
        let userCart = await Cart.findOne({ customerId: userId });

        if (!userCart) {
            // Convert guest cart to user cart
            guestCart.customerId = userId;
            guestCart.sessionId = null;
            await guestCart.save();
            await guestCart.populate('items.menuItemId', 'name price imageUrl status');

            return res.status(200).json({
                success: true,
                message: 'Guest cart converted to user cart',
                data: guestCart,
            });
        }

        // Merge items from guest cart to user cart
        guestCart.items.forEach(guestItem => {
            const existingItemIndex = userCart.items.findIndex(
                item =>
                    item.menuItemId.toString() === guestItem.menuItemId.toString() &&
                    JSON.stringify(item.modifiers) === JSON.stringify(guestItem.modifiers)
            );

            if (existingItemIndex > -1) {
                // Update quantity
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
                userCart.items[existingItemIndex].subtotal = userCart.calculateItemSubtotal(userCart.items[existingItemIndex]);
            } else {
                // Add new item
                userCart.items.push(guestItem);
            }
        });

        // Delete guest cart
        await Cart.findByIdAndDelete(guestCart._id);

        // Save merged cart
        await userCart.save();
        await userCart.populate('items.menuItemId', 'name price imageUrl status');

        res.status(200).json({
            success: true,
            message: 'Carts merged successfully',
            data: userCart,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get cart summary (items count and total)
 * @route   GET /api/cart/:sessionId/summary (guest)
 * @route   GET /api/cart/summary (logged-in user)
 * @access  Public
 */
export const getCartSummary = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?._id;

        const query = userId ? { customerId: userId } : { sessionId };
        const cart = await Cart.findOne(query);

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    itemsCount: 0,
                    total: 0,
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                itemsCount: cart.totalItems,
                total: cart.total,
            },
        });
    } catch (error) {
        next(error);
    }
};
