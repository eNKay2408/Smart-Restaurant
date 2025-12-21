export interface LoginRequest {
    email: string;
    password: string;
    role: 'admin' | 'staff';
}

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'staff';
    name?: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    user: User;
}

export interface ApiError {
    success: false;
    message: string;
    error?: string;
}
