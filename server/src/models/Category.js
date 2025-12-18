import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: null,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
categorySchema.index({ restaurantId: 1, displayOrder: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
