import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
    {
        // Session ID for guest users (generated on frontend)
        sessionId: {
            type: String,
            default: null,
            index: true,
        },
        // Customer ID for logged-in users
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        // Table ID (from QR scan)
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Table',
            default: null,
        },
        // Restaurant ID
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        // Cart items
        items: [
            {
                menuItemId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'MenuItem',
                    required: true,
                },
                name: {
                    type: String,
                    required: true, // Snapshot of item name
                },
                price: {
                    type: Number,
                    required: true, // Snapshot of price at add time
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
                // Selected modifiers
                modifiers: [
                    {
                        name: String,
                        options: [
                            {
                                name: String,
                                priceAdjustment: Number,
                            },
                        ],
                    },
                ],
                specialInstructions: {
                    type: String,
                    default: '',
                    maxlength: 500,
                },
                // Calculated subtotal for this item
                subtotal: {
                    type: Number,
                    required: true,
                },
            },
        ],
        // Cart expiration (auto-delete after 2 hours of inactivity)
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            index: true,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Indexes for performance
cartSchema.index({ sessionId: 1, restaurantId: 1 });
cartSchema.index({ customerId: 1, restaurantId: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Ensure either sessionId or customerId is present
cartSchema.pre('save', function (next) {
    if (!this.sessionId && !this.customerId) {
        return next(new Error('Cart must have either sessionId or customerId'));
    }
    next();
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function () {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for cart total
cartSchema.virtual('total').get(function () {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
});

// Include virtuals in JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

// Method to update expiration time (extend cart lifetime)
cartSchema.methods.extendExpiration = function () {
    this.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return this.save();
};

// Method to calculate item subtotal
cartSchema.methods.calculateItemSubtotal = function (item) {
    let subtotal = item.price * item.quantity;

    // Add modifier prices
    if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
            if (modifier.options && modifier.options.length > 0) {
                modifier.options.forEach(option => {
                    subtotal += (option.priceAdjustment || 0) * item.quantity;
                });
            }
        });
    }

    return subtotal;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
