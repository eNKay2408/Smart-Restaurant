import axiosInstance from "../config/axiosConfig";
import "../config/axiosInterceptors"; // Import interceptors để đăng ký chúng
import type { LoginRequest, LoginResponse, User } from "../types/auth.types";

class AuthService {
	/**
	 * Login user with email, password, and role
	 */
	async login(loginData: LoginRequest): Promise<LoginResponse> {
		try {
			// For customer demo/testing - bypass API call
			if (
				loginData.role === "customer" &&
				loginData.email === "customer@example.com"
			) {
				const mockResponse: LoginResponse = {
					success: true,
					message: "Customer login successful",
					data: {
						user: {
							id: "customer-1",
							fullName: "Demo Customer",
							email: "customer@example.com",
							role: "customer",
							avatar: "👤",
						},
						accessToken: "mock-customer-token",
						refreshToken: "mock-refresh-token",
					},
				};

				// Store mock data
				localStorage.setItem("token", mockResponse.data.accessToken);
				localStorage.setItem("refreshToken", mockResponse.data.refreshToken);
				localStorage.setItem("user", JSON.stringify(mockResponse.data.user));

				// Dispatch custom event to notify components
				window.dispatchEvent(new Event("auth-change"));

				return mockResponse;
			}

			// Regular API call for staff/admin
			const response = await axiosInstance.post<LoginResponse>("/auth/login", {
				email: loginData.email,
				password: loginData.password,
				// Note: role is not sent to backend, only used for UI
			});

			// Store token and user info in localStorage
			if (response.data.success && response.data.data) {
				localStorage.setItem("token", response.data.data.accessToken);
				localStorage.setItem("refreshToken", response.data.data.refreshToken);
				localStorage.setItem("user", JSON.stringify(response.data.data.user));

				// Dispatch custom event to notify components
				window.dispatchEvent(new Event("auth-change"));
			}

			return response.data;
		} catch (error: any) {
			// Handle error response
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "An error occurred during login. Please try again.",
			};
		}
	}

	/**
	 * Logout user - clear local storage and redirect
	 */
	logout(): void {
		localStorage.removeItem("token");
		localStorage.removeItem("refreshToken");
		localStorage.removeItem("user");

		// Dispatch custom event to notify components
		window.dispatchEvent(new Event("auth-change"));

		window.location.href = "/";
	}

	/**
	 * Get current logged-in user from localStorage
	 */
	getCurrentUser(): User | null {
		// Check for guest user first
		const guestUserStr = localStorage.getItem("guest_user");
		if (guestUserStr) {
			try {
				return JSON.parse(guestUserStr) as User;
			} catch (error) {
				console.error("Error parsing guest user data:", error);
			}
		}

		// Check for authenticated user
		const userStr = localStorage.getItem("user");
		if (userStr) {
			try {
				return JSON.parse(userStr) as User;
			} catch (error) {
				console.error("Error parsing user data:", error);
				return null;
			}
		}
		return null;
	}

	/**
	 * Get authentication token
	 */
	getToken(): string | null {
		return localStorage.getItem("token");
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return !!this.getToken() || !!localStorage.getItem("guest_user");
	}

	/**
	 * Check if current user is a guest
	 */
	isGuest(): boolean {
		return !!localStorage.getItem("guest_user");
	}

	/**
	 * Check if user has specific role
	 */
	hasRole(role: "admin" | "staff"): boolean {
		const user = this.getCurrentUser();
		return user?.role === role;
	}

	/**
	 * Register new customer account
	 */
	async register(registerData: {
		fullName: string;
		email: string;
		password: string;
	}): Promise<LoginResponse> {
		try {
			const response = await axiosInstance.post<LoginResponse>(
				"/auth/register",
				{
					fullName: registerData.fullName,
					email: registerData.email,
					password: registerData.password,
					role: "customer",
				}
			);

			// Store token and user info if registration includes auto-login
			if (response.data.success && response.data.data) {
				localStorage.setItem("token", response.data.data.accessToken);
				localStorage.setItem("refreshToken", response.data.data.refreshToken);
				localStorage.setItem("user", JSON.stringify(response.data.data.user));

				// Dispatch custom event to notify components
				window.dispatchEvent(new Event("auth-change"));
			}

			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "An error occurred during registration. Please try again.",
			};
		}
	}

	/**
	 * Request password reset email
	 */
	async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
		try {
			const response = await axiosInstance.post<{ success: boolean; message: string }>(
				"/auth/forgot-password",
				{ email }
			);

			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Failed to send password reset email. Please try again.",
			};
		}
	}

	/**
	 * Reset password using token
	 */
	async resetPassword(
		token: string,
		password: string
	): Promise<{ success: boolean; message: string }> {
		try {
			const response = await axiosInstance.post<{ success: boolean; message: string }>(
				`/auth/reset-password/${token}`,
				{ password }
			);

			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Failed to reset password. The token may have expired.",
			};
		}
	}

	/**
	 * Verify email using token
	 */
	async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
		try {
			const response = await axiosInstance.get<{ success: boolean; message: string }>(
				`/auth/verify-email/${token}`
			);

			return response.data;
		} catch (error: any) {
			if (error.response && error.response.data) {
				throw error.response.data;
			}
			throw {
				success: false,
				message: "Email verification failed. The link may have expired.",
			};
		}
	}

	/**
	 * Get current user profile
	 */
	async getProfile(): Promise<{ success: boolean; data?: any; message?: string }> {
		try {
			const response = await axiosInstance.get('/auth/me');
			return {
				success: true,
				data: response.data.data
			};
		} catch (error: any) {
			console.error('Error fetching profile:', error);
			return {
				success: false,
				message: error.response?.data?.message || 'Failed to fetch profile'
			};
		}
	}

	/**
	 * Update user profile
	 */
	async updateProfile(profileData: {
		fullName?: string;
		phone?: string;
		preferences?: any;
	}): Promise<{ success: boolean; data?: any; message?: string }> {
		try {
			const response = await axiosInstance.put('/auth/profile', profileData);

			// Update stored user data
			if (response.data.data) {
				localStorage.setItem('user', JSON.stringify(response.data.data));
				window.dispatchEvent(new Event('auth-change'));
			}

			return {
				success: true,
				data: response.data.data,
				message: response.data.message
			};
		} catch (error: any) {
			console.error('Error updating profile:', error);
			return {
				success: false,
				message: error.response?.data?.message || 'Failed to update profile'
			};
		}
	}

	/**
	 * Update password
	 */
	async updatePassword(passwordData: {
		currentPassword: string;
		newPassword: string;
	}): Promise<{ success: boolean; message?: string }> {
		try {
			const response = await axiosInstance.put('/auth/password', passwordData);
			return {
				success: true,
				message: response.data.message
			};
		} catch (error: any) {
			console.error('Error updating password:', error);
			throw error; // Re-throw to let component handle error
		}
	}

	/**
	 * Check if email is available for registration
	 */
	async checkEmailAvailability(email: string): Promise<boolean> {
		try {
			const response = await axiosInstance.get<{
				success: boolean;
				available: boolean;
			}>(`/auth/check-email/${email}`);

			return response.data.available;
		} catch (error: any) {
			console.error("Error checking email availability:", error);
			return false;
		}
	}
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
