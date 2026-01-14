import axiosInstance from '../config/axiosInterceptors';

export interface ModifierOption {
    id: string;
    name: string;
    priceAdjustment: number;
    isDefault: boolean;
    isActive: boolean;
}

export interface Modifier {
    id: string;
    name: string;
    type: 'single' | 'multiple';
    required: boolean;
    displayOrder: number;
    options: ModifierOption[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    restaurantId?: string;
}

interface ModifiersResponse {
    success: boolean;
    count: number;
    data: Modifier[];
}

interface ModifierResponse {
    success: boolean;
    data: Modifier;
}

class ModifierService {
    /**
     * Get all modifiers
     */
    async getModifiers(restaurantId?: string): Promise<ModifiersResponse> {
        try {
            const params = restaurantId ? { restaurantId } : {};
            const response = await axiosInstance.get<ModifiersResponse>('/modifiers', {
                params,
            });
            return response.data;
        } catch (error: any) {
            // Let error propagate to caller
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch modifiers',
                error: error.message,
            };
        }
    }

    /**
     * Get modifier by ID
     */
    async getModifier(modifierId: string): Promise<ModifierResponse> {
        try {
            const response = await axiosInstance.get<ModifierResponse>(`/modifiers/${modifierId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch modifier',
                error: error.message,
            };
        }
    }

    /**
     * Create new modifier (Admin only)
     */
    async createModifier(modifierData: {
        name: string;
        type: 'single' | 'multiple';
        required: boolean;
        displayOrder?: number;
        options: Array<{
            name: string;
            priceAdjustment: number;
            isDefault: boolean;
            isActive: boolean;
        }>;
        restaurantId?: string; // Optional - backend will use req.user.restaurantId
    }): Promise<ModifierResponse> {
        try {
            const response = await axiosInstance.post<ModifierResponse>('/modifiers', modifierData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to create modifier',
                error: error.message,
            };
        }
    }

    /**
     * Update modifier (Admin only)
     */
    async updateModifier(modifierId: string, modifierData: Partial<{
        name: string;
        type: 'single' | 'multiple';
        required: boolean;
        displayOrder: number;
        options: Array<{
            name: string;
            priceAdjustment: number;
            isDefault: boolean;
            isActive: boolean;
        }>;
        isActive: boolean;
    }>): Promise<ModifierResponse> {
        try {
            const response = await axiosInstance.put<ModifierResponse>(`/modifiers/${modifierId}`, modifierData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to update modifier',
                error: error.message,
            };
        }
    }

    /**
     * Delete modifier (Admin only)
     */
    async deleteModifier(modifierId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axiosInstance.delete(`/modifiers/${modifierId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to delete modifier',
                error: error.message,
            };
        }
    }
}

export const modifierService = new ModifierService();
export default ModifierService;