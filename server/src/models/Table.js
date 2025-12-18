import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
    {
        tableNumber: {
            type: String,
            required: [true, 'Table number is required'],
            trim: true,
        },
        capacity: {
            type: Number,
            required: [true, 'Capacity is required'],
            min: [1, 'Capacity must be at least 1'],
        },
        location: {
            type: String,
            default: '',
            trim: true,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        // QR Code
        qrCode: {
            token: {
                type: String,
                required: true,
                unique: true,
            },
            imageUrl: {
                type: String,
                default: null,
            },
            generatedAt: {
                type: Date,
                default: Date.now,
            },
        },
        // Table status
        status: {
            type: String,
            enum: ['active', 'inactive', 'occupied', 'reserved'],
            default: 'active',
        },
        // Current session
        currentSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null,
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

// Compound index for unique table number per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ qrCode: 1 });

const Table = mongoose.model('Table', tableSchema);

export default Table;
