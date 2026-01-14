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
		return !!this.getToken();
	}

	/**
	 * Check if user has specific role
	 */
	hasRole(role: "admin" | "staff"): boolean {
		const user = this.getCurrentUser();
		return user?.role === role;
	}
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
