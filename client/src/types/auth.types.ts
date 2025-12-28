export interface LoginRequest {
    email: string;
    password: string;
    role?: 'admin' | 'staff'; // Optional for UI, backend doesn't use this
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'admin' | 'customer' | 'waiter' | 'kitchen';
    avatar?: string;
    isEmailVerified?: boolean;
    restaurantId?: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
}

export interface ApiError {
    success: false;
    message: string;
    error?: string;
}
