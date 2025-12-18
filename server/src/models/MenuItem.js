import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        images: [
            {
                type: String,
            },
        ],
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Category is required'],
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        // Modifiers (e.g., Size, Extras)
        modifiers: [
            {
                name: {
                    type: String,
                    required: true,
                },
                type: {
                    type: String,
                    enum: ['single', 'multiple'], // single choice or multiple choice
                    default: 'single',
                },
                required: {
                    type: Boolean,
                    default: false,
                },
                options: [
                    {
                        name: {
                            type: String,
                            required: true,
                        },
                        priceAdjustment: {
                            type: Number,
                            default: 0,
                        },
                    },
                ],
            },
        ],
        // Allergen information
        allergens: [
            {
                type: String,
            },
        ],
        // Preparation time in minutes
        prepTime: {
            type: Number,
            default: 15,
            min: [0, 'Prep time cannot be negative'],
        },
        // Status
        status: {
            type: String,
            enum: ['available', 'unavailable', 'sold_out'],
            default: 'available',
        },
        // Chef recommendation
        isRecommended: {
            type: Boolean,
            default: false,
        },
        // Statistics
        totalOrders: {
            type: Number,
            default: 0,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
menuItemSchema.index({ restaurantId: 1, categoryId: 1 });
menuItemSchema.index({ restaurantId: 1, status: 1 });
menuItemSchema.index({ restaurantId: 1, totalOrders: -1 }); // For popularity sorting
menuItemSchema.index({ name: 'text', description: 'text' }); // For text search

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;
