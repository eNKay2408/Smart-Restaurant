import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Please provide your full name'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId; // Password required if not Google OAuth
            },
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: ['guest', 'customer', 'waiter', 'kitchen_staff', 'admin', 'super_admin'],
            default: 'customer',
        },
        avatar: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            default: null,
        },
        // Google OAuth
        googleId: {
            type: String,
            default: null,
        },
        // Email verification
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            default: null,
        },
        emailVerificationExpires: {
            type: Date,
            default: null,
        },
        // Password reset
        passwordResetToken: {
            type: String,
            default: null,
        },
        passwordResetExpires: {
            type: Date,
            default: null,
        },
        // Account status
        isActive: {
            type: Boolean,
            default: true,
        },
        // For staff: which restaurant they belong to
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            default: null,
        },
        // Customer preferences
        preferences: {
            language: {
                type: String,
                enum: ['en', 'vi'],
                default: 'en',
            },
            notifications: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
            },
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ restaurantId: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
    const token = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    this.emailVerificationToken = token;
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
    const token = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    this.passwordResetToken = token;
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return token;
};

// Don't return password in JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
