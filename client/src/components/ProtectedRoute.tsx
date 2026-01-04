import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'waiter' | 'kitchen' | 'customer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'admin' }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== requiredRole) {
        // Redirect to appropriate page based on user role
        switch (user.role) {
            case 'admin':
                return <Navigate to="/admin/dashboard" replace />;
            case 'waiter':
                return <Navigate to="/waiter/orders" replace />;
            case 'kitchen':
                return <Navigate to="/kitchen/kds" replace />;
            default:
                return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;