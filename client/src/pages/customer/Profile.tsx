import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import axiosInstance from "../../config/axiosConfig";
import { toast } from "react-toastify";
import { getFullUrl } from "../../config/constants";

interface UserProfile {
	id: string;
	fullName: string;
	email: string;
	phone?: string;
	role: string;
	avatar?: string;
	isEmailVerified: boolean;
	preferences?: any;
}

interface PasswordForm {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

const CustomerProfile: React.FC = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"profile" | "password" | "orders">(
		"profile",
	);

	// Profile form state
	const [profileForm, setProfileForm] = useState({
		fullName: "",
		phone: "",
	});
	const [profileErrors, setProfileErrors] = useState<any>({});
	const [savingProfile, setSavingProfile] = useState(false);

	// Password form state
	const [passwordForm, setPasswordForm] = useState<PasswordForm>({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [passwordErrors, setPasswordErrors] = useState<any>({});
	const [savingPassword, setSavingPassword] = useState(false);
	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false,
	});

	// Avatar upload state
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchUserProfile();
	}, []);

	const handleAvatarUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (2MB)
		if (file.size > 2 * 1024 * 1024) {
			toast.error("Image size must be less than 2MB");
			return;
		}

		try {
			setUploadingAvatar(true);

			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setAvatarPreview(reader.result as string);
			};
			reader.readAsDataURL(file);

			// Upload to server
			const formData = new FormData();
			formData.append("avatar", file);

			const response = await axiosInstance.post("/upload/avatar", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.data.success) {
				const avatarUrl = response.data.data.url;

				// Update user profile with new avatar URL
				const updateResponse = await authService.updateProfile({
					avatar: avatarUrl,
				});

				if (updateResponse.success) {
					// Update local user state
					setUser((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));
					toast.success("Avatar updated successfully!");
				} else {
					throw new Error("Failed to update profile");
				}
			}
		} catch (error: any) {
			console.error("Avatar upload error:", error);
			toast.error(error.response?.data?.message || "Failed to upload avatar");
			setAvatarPreview(null);
		} finally {
			setUploadingAvatar(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const fetchUserProfile = async () => {
		try {
			setLoading(true);
			const currentUser = authService.getCurrentUser();

			if (!currentUser) {
				toast.error("Please login to view profile");
				navigate("/login");
				return;
			}

			// Use current user as initial data
			const userProfile: UserProfile = {
				...currentUser,
				isEmailVerified: currentUser.isEmailVerified || false,
				phone: (currentUser as any).phone || "",
			};
			setUser(userProfile);
			setProfileForm({
				fullName: currentUser.fullName || "",
				phone: (currentUser as any).phone || "",
			});

			// Try to fetch full profile from API
			try {
				const response = await authService.getProfile();
				if (response.success && response.data) {
					setUser(response.data);
					setProfileForm({
						fullName: response.data.fullName || "",
						phone: response.data.phone || "",
					});
				}
			} catch (apiError) {
				console.error("Error fetching fresh profile from API:", apiError);
				// Continue with localStorage data - don't fail completely
				toast.warning("Using cached profile data");
			}
		} catch (error: any) {
			console.error("Error loading profile:", error);
			// If completely failed, redirect to login
			toast.error("Please login to view profile");
			navigate("/login");
		} finally {
			setLoading(false);
		}
	};

	// Validate profile form
	const validateProfileForm = (): boolean => {
		const errors: any = {};

		if (!profileForm.fullName.trim()) {
			errors.fullName = "Full name is required";
		} else if (profileForm.fullName.trim().length < 2) {
			errors.fullName = "Full name must be at least 2 characters";
		}

		if (profileForm.phone && !profileForm.phone.match(/^[\d\s\-\+\(\)]+$/)) {
			errors.phone = "Please enter a valid phone number";
		}

		setProfileErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// Validate password form
	const validatePasswordForm = (): boolean => {
		const errors: any = {};

		if (!passwordForm.currentPassword) {
			errors.currentPassword = "Current password is required";
		}

		if (!passwordForm.newPassword) {
			errors.newPassword = "New password is required";
		} else if (passwordForm.newPassword.length < 8) {
			errors.newPassword = "Password must be at least 8 characters";
		} else if (
			!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)
		) {
			errors.newPassword =
				"Password must contain uppercase, lowercase, and number";
		}

		if (!passwordForm.confirmPassword) {
			errors.confirmPassword = "Please confirm your password";
		} else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			errors.confirmPassword = "Passwords do not match";
		}

		setPasswordErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleProfileSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateProfileForm()) {
			toast.error("Please fix the errors in the form");
			return;
		}

		try {
			setSavingProfile(true);
			const response = await authService.updateProfile(profileForm);

			if (response.success) {
				toast.success("✅ Profile updated successfully!");
				await fetchUserProfile(); // Reload profile
			} else {
				toast.error(response.message || "Failed to update profile");
			}
		} catch (error: any) {
			console.error("Update profile error:", error);
			toast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validatePasswordForm()) {
			toast.error("Please fix the errors in the form");
			return;
		}

		try {
			setSavingPassword(true);
			const response = await authService.updatePassword({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
			});

			if (response.success) {
				toast.success("✅ Password updated successfully!");
				// Clear form
				setPasswordForm({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
				setPasswordErrors({});
			} else {
				toast.error(response.message || "Failed to update password");
			}
		} catch (error: any) {
			console.error("Update password error:", error);
			const errorMsg =
				error.response?.data?.message || "Failed to update password";
			toast.error(errorMsg);
			if (errorMsg.includes("incorrect")) {
				setPasswordErrors({ currentPassword: "Current password is incorrect" });
			}
		} finally {
			setSavingPassword(false);
		}
	};

	const handleLogout = () => {
		authService.logout();
		toast.info("Logged out successfully");
		navigate("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
					<p className="text-gray-600">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600 mb-4">Please login to view profile</p>
					<button
						onClick={() => navigate("/login")}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
					>
						Login
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
				<div className="flex items-center px-4 py-3">
					<button
						onClick={() => navigate(-1)}
						className="mr-3 p-2 hover:bg-gray-100 rounded-full"
					>
						<svg
							className="w-6 h-6 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
					</button>
					<div className="flex-1">
						<h1 className="text-lg font-semibold text-gray-900">My Profile</h1>
						<p className="text-sm text-gray-600">{user.email}</p>
					</div>
					<button
						onClick={handleLogout}
						className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
					>
						Logout
					</button>
				</div>
			</div>

			{/* Profile Card */}
			<div className="bg-white border-b border-gray-200 px-4 py-6">
				<div className="flex items-center space-x-4">
					{/* Avatar */}
					<div className="relative">
						{avatarPreview || user.avatar ? (
							<img
								src={avatarPreview || getFullUrl(user.avatar || "")}
								alt="Avatar"
								className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
							/>
						) : (
							<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
								{user.fullName.charAt(0).toUpperCase()}
							</div>
						)}
						{user.isEmailVerified && (
							<div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
								<svg
									className="w-4 h-4 text-white"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
						)}
						{/* Upload Avatar Button */}
						<button
							onClick={() => fileInputRef.current?.click()}
							disabled={uploadingAvatar}
							className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50"
							title="Change avatar"
						>
							{uploadingAvatar ? (
								<svg
									className="animate-spin h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							) : (
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							)}
						</button>
						{/* Hidden File Input */}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleAvatarUpload}
							className="hidden"
						/>
					</div>

					{/* User Info */}
					<div className="flex-1">
						<h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
						<p className="text-sm text-gray-600">{user.email}</p>
						{user.phone && (
							<p className="text-sm text-gray-600 mt-1">{user.phone}</p>
						)}
						<div className="flex items-center mt-2 space-x-2">
							<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
								{user.role}
							</span>
							{user.isEmailVerified ? (
								<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
									✓ Verified
								</span>
							) : (
								<span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
									Not Verified
								</span>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className="bg-white border-b border-gray-200 px-4">
				<div className="flex space-x-1">
					<button
						onClick={() => setActiveTab("profile")}
						className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
							activeTab === "profile"
								? "border-blue-600 text-blue-600"
								: "border-transparent text-gray-600 hover:text-gray-900"
						}`}
					>
						Profile Info
					</button>
					<button
						onClick={() => setActiveTab("password")}
						className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
							activeTab === "password"
								? "border-blue-600 text-blue-600"
								: "border-transparent text-gray-600 hover:text-gray-900"
						}`}
					>
						Security
					</button>
					<button
						onClick={() => setActiveTab("orders")}
						className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
							activeTab === "orders"
								? "border-blue-600 text-blue-600"
								: "border-transparent text-gray-600 hover:text-gray-900"
						}`}
					>
						Orders
					</button>
				</div>
			</div>

			{/* Tab Content */}
			<div className="p-4 pb-24">
				{/* Profile Info Tab */}
				{activeTab === "profile" && (
					<div className="bg-white rounded-xl shadow-sm p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Edit Profile
						</h3>
						<form onSubmit={handleProfileSubmit} className="space-y-4">
							{/* Full Name */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Full Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={profileForm.fullName}
									onChange={(e) => {
										setProfileForm({
											...profileForm,
											fullName: e.target.value,
										});
										if (profileErrors.fullName) {
											setProfileErrors({ ...profileErrors, fullName: "" });
										}
									}}
									className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										profileErrors.fullName
											? "border-red-500"
											: "border-gray-300"
									}`}
									placeholder="Enter your full name"
								/>
								{profileErrors.fullName && (
									<p className="mt-1 text-sm text-red-600">
										{profileErrors.fullName}
									</p>
								)}
							</div>

							{/* Email (Read-only) */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email Address
								</label>
								<input
									type="email"
									value={user.email}
									disabled
									className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
								/>
								<p className="mt-1 text-xs text-gray-500">
									Email cannot be changed
								</p>
							</div>

							{/* Phone */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Phone Number
								</label>
								<input
									type="tel"
									value={profileForm.phone}
									onChange={(e) => {
										setProfileForm({ ...profileForm, phone: e.target.value });
										if (profileErrors.phone) {
											setProfileErrors({ ...profileErrors, phone: "" });
										}
									}}
									className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										profileErrors.phone ? "border-red-500" : "border-gray-300"
									}`}
									placeholder="Enter your phone number"
								/>
								{profileErrors.phone && (
									<p className="mt-1 text-sm text-red-600">
										{profileErrors.phone}
									</p>
								)}
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={savingProfile}
								className={`w-full py-3 rounded-lg font-semibold transition-colors ${
									savingProfile
										? "bg-gray-400 text-gray-600 cursor-not-allowed"
										: "bg-blue-600 text-white hover:bg-blue-700"
								}`}
							>
								{savingProfile ? "Saving..." : "Save Changes"}
							</button>
						</form>
					</div>
				)}

				{/* Password Tab */}
				{activeTab === "password" && (
					<div className="bg-white rounded-xl shadow-sm p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Change Password
						</h3>
						<form onSubmit={handlePasswordSubmit} className="space-y-4">
							{/* Current Password */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Current Password <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<input
										type={showPasswords.current ? "text" : "password"}
										value={passwordForm.currentPassword}
										onChange={(e) => {
											setPasswordForm({
												...passwordForm,
												currentPassword: e.target.value,
											});
											if (passwordErrors.currentPassword) {
												setPasswordErrors({
													...passwordErrors,
													currentPassword: "",
												});
											}
										}}
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
											passwordErrors.currentPassword
												? "border-red-500"
												: "border-gray-300"
										}`}
										placeholder="Enter current password"
									/>
									<button
										type="button"
										onClick={() =>
											setShowPasswords({
												...showPasswords,
												current: !showPasswords.current,
											})
										}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showPasswords.current ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
								{passwordErrors.currentPassword && (
									<p className="mt-1 text-sm text-red-600">
										{passwordErrors.currentPassword}
									</p>
								)}
							</div>

							{/* New Password */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									New Password <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<input
										type={showPasswords.new ? "text" : "password"}
										value={passwordForm.newPassword}
										onChange={(e) => {
											setPasswordForm({
												...passwordForm,
												newPassword: e.target.value,
											});
											if (passwordErrors.newPassword) {
												setPasswordErrors({
													...passwordErrors,
													newPassword: "",
												});
											}
										}}
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
											passwordErrors.newPassword
												? "border-red-500"
												: "border-gray-300"
										}`}
										placeholder="Enter new password"
									/>
									<button
										type="button"
										onClick={() =>
											setShowPasswords({
												...showPasswords,
												new: !showPasswords.new,
											})
										}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showPasswords.new ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
								{passwordErrors.newPassword && (
									<p className="mt-1 text-sm text-red-600">
										{passwordErrors.newPassword}
									</p>
								)}
								<p className="mt-1 text-xs text-gray-500">
									At least 8 characters with uppercase, lowercase, and number
								</p>
							</div>

							{/* Confirm Password */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Confirm New Password <span className="text-red-500">*</span>
								</label>
								<div className="relative">
									<input
										type={showPasswords.confirm ? "text" : "password"}
										value={passwordForm.confirmPassword}
										onChange={(e) => {
											setPasswordForm({
												...passwordForm,
												confirmPassword: e.target.value,
											});
											if (passwordErrors.confirmPassword) {
												setPasswordErrors({
													...passwordErrors,
													confirmPassword: "",
												});
											}
										}}
										className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
											passwordErrors.confirmPassword
												? "border-red-500"
												: "border-gray-300"
										}`}
										placeholder="Confirm new password"
									/>
									<button
										type="button"
										onClick={() =>
											setShowPasswords({
												...showPasswords,
												confirm: !showPasswords.confirm,
											})
										}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									>
										{showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
									</button>
								</div>
								{passwordErrors.confirmPassword && (
									<p className="mt-1 text-sm text-red-600">
										{passwordErrors.confirmPassword}
									</p>
								)}
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={savingPassword}
								className={`w-full py-3 rounded-lg font-semibold transition-colors ${
									savingPassword
										? "bg-gray-400 text-gray-600 cursor-not-allowed"
										: "bg-blue-600 text-white hover:bg-blue-700"
								}`}
							>
								{savingPassword ? "Updating..." : "Update Password"}
							</button>
						</form>
					</div>
				)}

				{/* Orders Tab */}
				{activeTab === "orders" && (
					<div className="bg-white rounded-xl shadow-sm p-6 text-center">
						<div className="text-6xl mb-4">📋</div>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Order History
						</h3>
						<p className="text-gray-600 mb-6">
							View your complete order history and track your orders
						</p>
						<button
							onClick={() => navigate("/order-history")}
							className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
						>
							View Order History
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default CustomerProfile;
