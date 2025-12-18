import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Restaurant name is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        logo: {
            type: String,
            default: null,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
        },
        contact: {
            phone: String,
            email: String,
            website: String,
        },
        // Business hours
        hours: {
            monday: { open: String, close: String, isClosed: Boolean },
            tuesday: { open: String, close: String, isClosed: Boolean },
            wednesday: { open: String, close: String, isClosed: Boolean },
            thursday: { open: String, close: String, isClosed: Boolean },
            friday: { open: String, close: String, isClosed: Boolean },
            saturday: { open: String, close: String, isClosed: Boolean },
            sunday: { open: String, close: String, isClosed: Boolean },
        },
        // Tax rate (percentage)
        taxRate: {
            type: Number,
            default: 10,
            min: 0,
            max: 100,
        },
        // Currency
        currency: {
            type: String,
            default: 'USD',
        },
        // Settings
        settings: {
            allowGuestOrders: {
                type: Boolean,
                default: true,
            },
            requireWaiterApproval: {
                type: Boolean,
                default: true,
            },
            autoAcceptOrders: {
                type: Boolean,
                default: false,
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;
