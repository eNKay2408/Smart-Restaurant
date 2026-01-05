import mongoose from 'mongoose';

const modifierOptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Option name is required'],
        trim: true,
    },
    priceAdjustment: {
        type: Number,
        default: 0,
        min: [0, 'Price adjustment cannot be negative'],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { _id: true });

const modifierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Modifier name is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['single', 'multiple'],
            required: [true, 'Modifier type is required'],
            default: 'single',
        },
        required: {
            type: Boolean,
            default: false,
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        options: {
            type: [modifierOptionSchema],
            validate: {
                validator: function (options) {
                    return options && options.length > 0;
                },
                message: 'At least one option is required',
            },
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
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
modifierSchema.index({ restaurantId: 1, isActive: 1 });
modifierSchema.index({ displayOrder: 1 });

// Virtual for option count
modifierSchema.virtual('optionCount').get(function () {
    return this.options ? this.options.length : 0;
});

// Method to validate single selection has only one default
modifierSchema.methods.validateDefaults = function () {
    if (this.type === 'single') {
        const defaultOptions = this.options.filter(opt => opt.isDefault);
        if (defaultOptions.length > 1) {
            throw new Error('Single selection modifier can only have one default option');
        }
    }
    return true;
};

// Pre-save middleware
modifierSchema.pre('save', function (next) {
    try {
        this.validateDefaults();
        next();
    } catch (error) {
        next(error);
    }
});

const Modifier = mongoose.model('Modifier', modifierSchema);

export default Modifier;
