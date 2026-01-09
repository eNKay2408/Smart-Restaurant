import axiosInstance from './axiosConfig';

// Request interceptor - Add token to all requests
axiosInstance.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If token exists, add it to request headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
    (response) => {
        // Return response data directly
        return response;
    },
    (error) => {
        // Handle different error scenarios
        if (error.response) {
            const { status } = error.response;

            // Unauthorized - Token expired or invalid
            if (status === 401) {
                // Check if this is a guest request (cart or order)
                const isGuestRequest =
                    error.config?.url?.includes('/cart/session_') ||
                    error.config?.url?.includes('/cart/') ||
                    error.config?.url?.includes('/orders') ||
                    error.config?.url?.includes('/tables/');

                // Don't redirect for guest requests
                if (isGuestRequest && !localStorage.getItem('token')) {
                    // Just return the error, let the component handle it
                    return Promise.reject(error);
                }

                // Clear stored authentication data
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Redirect to login page
                // Only redirect if not already on login page or customer pages
                const customerPages = ['/menu', '/cart', '/order-status', '/item/', '/payment'];
                const isCustomerPage = customerPages.some(page => window.location.pathname.includes(page));

                if (window.location.pathname !== '/login' && !isCustomerPage) {
                    window.location.href = '/login';
                }
            }

            // Forbidden - User doesn't have permission
            if (status === 403) {
                console.error('Access forbidden');
                // You can add custom handling here
            }

            // Server error
            if (status >= 500) {
                console.error('Server error occurred');
                // You can add custom error handling/notification here
            }
        } else if (error.request) {
            // Request was made but no response received
            console.error('Network error - No response from server');
        } else {
            // Something happened in setting up the request
            console.error('Error setting up request:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
