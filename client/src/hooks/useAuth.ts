import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/auth.types';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
        
        // Listen for storage changes (login/logout in other tabs)
        const handleStorageChange = () => {
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            if (response.success) {
                setUser(response.data.user);
                return response;
            }
            throw new Error(response.message);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isWaiter: user?.role === 'waiter',
        isKitchen: user?.role === 'kitchen',
        isCustomer: user?.role === 'customer',
    };
};