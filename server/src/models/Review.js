import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            default: '',
            maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: one review per customer per menu item per order
reviewSchema.index({ customerId: 1, menuItemId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ menuItemId: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
