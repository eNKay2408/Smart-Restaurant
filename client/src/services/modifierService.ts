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
            // Return mock data for demo since backend might not have modifiers endpoint yet
            return this.getMockModifiers();
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
        restaurantId: string;
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

    /**
     * Mock data for demo purposes (until backend implements modifiers)
     */
    private getMockModifiers(): ModifiersResponse {
        const mockModifiers: Modifier[] = [
            {
                id: '1',
                name: 'Size',
                type: 'single',
                required: false,
                displayOrder: 1,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                options: [
                    { id: '1-1', name: 'Regular', priceAdjustment: 0, isDefault: true, isActive: true },
                    { id: '1-2', name: 'Large', priceAdjustment: 5, isDefault: false, isActive: true }
                ]
            },
            {
                id: '2',
                name: 'Extras',
                type: 'multiple',
                required: false,
                displayOrder: 2,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                options: [
                    { id: '2-1', name: 'Extra Cheese', priceAdjustment: 3, isDefault: false, isActive: true },
                    { id: '2-2', name: 'Extra Sauce', priceAdjustment: 2, isDefault: false, isActive: true },
                    { id: '2-3', name: 'Side Salad', priceAdjustment: 4, isDefault: false, isActive: true }
                ]
            },
            {
                id: '3',
                name: 'Cooking Level',
                type: 'single',
                required: true,
                displayOrder: 3,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                options: [
                    { id: '3-1', name: 'Rare', priceAdjustment: 0, isDefault: false, isActive: true },
                    { id: '3-2', name: 'Medium Rare', priceAdjustment: 0, isDefault: true, isActive: true },
                    { id: '3-3', name: 'Medium', priceAdjustment: 0, isDefault: false, isActive: true },
                    { id: '3-4', name: 'Well Done', priceAdjustment: 0, isDefault: false, isActive: true }
                ]
            },
            {
                id: '4',
                name: 'Spice Level',
                type: 'single',
                required: false,
                displayOrder: 4,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                options: [
                    { id: '4-1', name: 'Mild', priceAdjustment: 0, isDefault: true, isActive: true },
                    { id: '4-2', name: 'Medium', priceAdjustment: 0, isDefault: false, isActive: true },
                    { id: '4-3', name: 'Hot', priceAdjustment: 0, isDefault: false, isActive: true },
                    { id: '4-4', name: 'Extra Hot', priceAdjustment: 1, isDefault: false, isActive: true }
                ]
            }
        ];

        return {
            success: true,
            count: mockModifiers.length,
            data: mockModifiers
        };
    }
}

export const modifierService = new ModifierService();
export default ModifierService;