import React, { createContext, useContext, useState, useEffect } from 'react';

interface RestaurantContextType {
    restaurantId: string | null;
    setRestaurantId: (id: string | null) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [restaurantId, setRestaurantIdState] = useState<string | null>(null);

    useEffect(() => {
        // Try to get restaurantId from logged-in user
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.restaurantId) {
                    setRestaurantIdState(user.restaurantId);
                    return;
                }
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
            }
        }

        // Fallback: Get from localStorage if previously set
        const storedRestaurantId = localStorage.getItem('restaurantId');
        if (storedRestaurantId) {
            setRestaurantIdState(storedRestaurantId);
        }
    }, []);

    const setRestaurantId = (id: string | null) => {
        setRestaurantIdState(id);
        if (id) {
            localStorage.setItem('restaurantId', id);
        } else {
            localStorage.removeItem('restaurantId');
        }
    };

    return (
        <RestaurantContext.Provider value={{ restaurantId, setRestaurantId }}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
};
