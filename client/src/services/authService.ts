import axiosInstance from '../config/axiosInterceptors';
import type { LoginRequest, LoginResponse, User } from '../types/auth.types';

class AuthService {
    /**
     * Login user with email, password, and role
     */
    async login(loginData: LoginRequest): Promise<LoginResponse> {
        try {
            const response = await axiosInstance.post<LoginResponse>('/auth/login', loginData);

            // Store token and user info in localStorage
            if (response.data.success && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error: any) {
            // Handle error response
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'An error occurred during login. Please try again.',
            };
        }
    }

    /**
     * Logout user - clear local storage and redirect
     */
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    /**
     * Get current logged-in user from localStorage
     */
    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr) as User;
            } catch (error) {
                console.error('Error parsing user data:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Get authentication token
     */
    getToken(): string | null {
        return localStorage.getItem('token');
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
    hasRole(role: 'admin' | 'staff'): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    }
}

// Export a singleton instance
export default new AuthService();
