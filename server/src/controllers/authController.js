import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../config/jwt.js";
import emailService from "../services/emailService.js";

// @desc    Register new user (Customer)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
	try {
		const { fullName, email, password, role } = req.body;

		console.log('📝 Registration request received:', { fullName, email, role });

		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			console.log('⚠️ Email already registered:', email);
			return res.status(400).json({
				success: false,
				message: "Email already registered",
			});
		}

		// Create user with role (default to 'customer' if not provided)
		const user = await User.create({
			fullName,
			email,
			password,
			role: role || "customer",
		});

		// Generate email verification token
		const verificationToken = user.generateEmailVerificationToken();
		await user.save();

		console.log(
			"🔑 Generated verification token for",
			user.email,
			":",
			verificationToken,
		);

		// Send verification email
		try {
			await emailService.sendVerificationEmail(user.email, verificationToken);
			console.log("✅ Verification email sent to:", user.email);
		} catch (emailError) {
			console.error(
				"❌ Failed to send verification email:",
				emailError.message,
			);
			// Don't fail registration if email fails
		}

		// Generate tokens
		const accessToken = generateAccessToken(user._id);
		const refreshToken = generateRefreshToken(user._id);

		res.status(201).json({
			success: true,
			message: "Registration successful. Please verify your email.",
			data: {
				user: {
					id: user._id,
					fullName: user.fullName,
					email: user.email,
					role: user.role,
					isEmailVerified: user.isEmailVerified,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({
			success: false,
			message: "Error creating user",
			error: error.message,
		});
	}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find user and include password
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		// Check if account is active
		if (!user.isActive) {
			return res.status(401).json({
				success: false,
				message: "Your account has been deactivated",
			});
		}

		// Check password
		const isPasswordMatch = await user.comparePassword(password);

		if (!isPasswordMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		// Generate tokens
		const accessToken = generateAccessToken(user._id);
		const refreshToken = generateRefreshToken(user._id);

		res.json({
			success: true,
			message: "Login successful",
			data: {
				user: {
					id: user._id,
					fullName: user.fullName,
					email: user.email,
					role: user.role,
					avatar: user.avatar,
					isEmailVerified: user.isEmailVerified,
					restaurantId: user.restaurantId,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Error logging in",
			error: error.message,
		});
	}
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		res.json({
			success: true,
			data: user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error fetching user profile",
		});
	}
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
	try {
		const { fullName, phone, avatar, preferences } = req.body;

		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Update fields
		if (fullName) user.fullName = fullName;
		if (phone) user.phone = phone;
		if (avatar !== undefined) user.avatar = avatar;
		if (preferences) user.preferences = { ...user.preferences, ...preferences };

		await user.save();

		res.json({
			success: true,
			message: "Profile updated successfully",
			data: user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error updating profile",
			error: error.message,
		});
	}
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		const user = await User.findById(req.user.id).select("+password");

		// Check current password
		const isMatch = await user.comparePassword(currentPassword);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Current password is incorrect",
			});
		}

		// Update password
		user.password = newPassword;
		await user.save();

		res.json({
			success: true,
			message: "Password updated successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error updating password",
			error: error.message,
		});
	}
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "No user found with that email",
			});
		}

		// Generate reset token
		const resetToken = user.generatePasswordResetToken();
		await user.save();

		// Send reset email
		try {
			await emailService.sendPasswordResetEmail(user.email, resetToken);
			console.log("✅ Password reset email sent to:", user.email);
		} catch (emailError) {
			console.error("❌ Failed to send reset email:", emailError.message);
			// Still return success to prevent email enumeration attacks
		}

		res.json({
			success: true,
			message: "Password reset email sent",
			// For development only - show token in console/response
			...(process.env.NODE_ENV === "development" && { resetToken }),
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error sending password reset email",
			error: error.message,
		});
	}
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			passwordResetToken: token,
			passwordResetExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid or expired reset token",
			});
		}

		// Update password
		user.password = password;
		user.passwordResetToken = null;
		user.passwordResetExpires = null;
		await user.save();

		res.json({
			success: true,
			message: "Password reset successful",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error resetting password",
			error: error.message,
		});
	}
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.params;

		console.log("🔍 Verifying email with token:", token);

		const user = await User.findOne({
			emailVerificationToken: token,
			emailVerificationExpires: { $gt: Date.now() },
		});

		console.log(
			"🔍 User found with token:",
			user ? `Yes (${user.email})` : "No",
		);

		if (!user) {
			console.log("❌ Token not found in database");
			return res.status(400).json({
				success: false,
				message:
					"Invalid or expired verification token. If you just verified, you can login now.",
			});
		}

		// Check if already verified
		if (user.isEmailVerified) {
			console.log("✅ Email already verified:", user.email);
			return res.json({
				success: true,
				message: "Email already verified. You can login now.",
			});
		}

		user.isEmailVerified = true;
		user.emailVerificationToken = null;
		user.emailVerificationExpires = null;
		await user.save();

		console.log("✅ Email verified successfully for:", user.email);

		res.json({
			success: true,
			message: "Email verified successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error verifying email",
			error: error.message,
		});
	}
};

// @desc    Check email availability
// @route   GET /api/auth/check-email/:email
// @access  Public
export const checkEmailAvailability = async (req, res) => {
	try {
		const { email } = req.params;

		const user = await User.findOne({ email });

		res.json({
			success: true,
			available: !user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error checking email availability",
		});
	}
};
