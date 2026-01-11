import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Promotion code is required'],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: [3, 'Code must be at least 3 characters'],
            maxlength: [20, 'Code cannot exceed 20 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: [true, 'Discount type is required'],
        },
        discountValue: {
            type: Number,
            required: [true, 'Discount value is required'],
            min: [0, 'Discount value cannot be negative'],
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: [0, 'Minimum order amount cannot be negative'],
        },
        maxDiscountAmount: {
            type: Number,
            default: null,
            min: [0, 'Maximum discount amount cannot be negative'],
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required'],
        },
        usageLimit: {
            type: Number,
            default: null, // null means unlimited
            min: [1, 'Usage limit must be at least 1'],
        },
        usedCount: {
            type: Number,
            default: 0,
            min: [0, 'Used count cannot be negative'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: [true, 'Restaurant ID is required'],
        },
        // Optional: Restrict to specific categories
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        // Optional: Restrict to specific menu items
        applicableMenuItems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MenuItem',
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
promotionSchema.index({ code: 1 });
promotionSchema.index({ restaurantId: 1, isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

// Virtual for checking if promotion is currently valid
promotionSchema.virtual('isValid').get(function () {
    const now = new Date();
    return (
        this.isActive &&
        this.startDate <= now &&
        this.endDate >= now &&
        (this.usageLimit === null || this.usedCount < this.usageLimit)
    );
});

// Virtual for remaining uses
promotionSchema.virtual('remainingUses').get(function () {
    if (this.usageLimit === null) return null; // Unlimited
    return Math.max(0, this.usageLimit - this.usedCount);
});

// Method to validate promotion for an order
promotionSchema.methods.validateForOrder = function (orderAmount) {
    const now = new Date();

    // Check if active
    if (!this.isActive) {
        return { valid: false, message: 'This promotion is no longer active' };
    }

    // Check date range
    if (now < this.startDate) {
        return { valid: false, message: 'This promotion has not started yet' };
    }
    if (now > this.endDate) {
        return { valid: false, message: 'This promotion has expired' };
    }

    // Check usage limit
    if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
        return { valid: false, message: 'This promotion has reached its usage limit' };
    }

    // Check minimum order amount
    if (orderAmount < this.minOrderAmount) {
        return {
            valid: false,
            message: `Minimum order amount is $${this.minOrderAmount.toFixed(2)}`,
        };
    }

    return { valid: true };
};

// Method to calculate discount amount
promotionSchema.methods.calculateDiscount = function (orderAmount) {
    if (this.discountType === 'percentage') {
        let discount = (orderAmount * this.discountValue) / 100;

        // Apply max discount cap if set
        if (this.maxDiscountAmount !== null && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }

        return parseFloat(discount.toFixed(2));
    } else {
        // Fixed discount
        return Math.min(this.discountValue, orderAmount);
    }
};

// Pre-save validation
promotionSchema.pre('save', function (next) {
    // Ensure end date is after start date
    if (this.endDate <= this.startDate) {
        next(new Error('End date must be after start date'));
        return;
    }

    // Validate percentage discount
    if (this.discountType === 'percentage' && this.discountValue > 100) {
        next(new Error('Percentage discount cannot exceed 100%'));
        return;
    }

    next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;
