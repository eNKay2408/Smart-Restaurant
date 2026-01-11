import axiosInstance from '../config/axiosInterceptors';

export interface Promotion {
    _id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    usedCount: number;
    isActive: boolean;
    restaurantId: string;
    applicableCategories?: string[];
    applicableMenuItems?: string[];
    createdAt: string;
    updatedAt: string;
    isValid?: boolean;
    remainingUses?: number;
}

export interface PromotionValidationResult {
    promotionId: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
    originalAmount: number;
    finalAmount: number;
}

interface PromotionsResponse {
    success: boolean;
    count: number;
    data: Promotion[];
}

interface PromotionResponse {
    success: boolean;
    data: Promotion;
    message?: string;
}

interface ValidationResponse {
    success: boolean;
    data: PromotionValidationResult;
    message?: string;
}

class PromotionService {
    /**
     * Get all promotions (Admin only)
     */
    async getPromotions(restaurantId?: string, isActive?: boolean): Promise<PromotionsResponse> {
        try {
            const params: any = {};
            if (restaurantId) params.restaurantId = restaurantId;
            if (isActive !== undefined) params.isActive = isActive;

            const response = await axiosInstance.get<PromotionsResponse>('/promotions', { params });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch promotions',
                error: error.message,
            };
        }
    }

    /**
     * Get single promotion (Admin only)
     */
    async getPromotion(promotionId: string): Promise<PromotionResponse> {
        try {
            const response = await axiosInstance.get<PromotionResponse>(`/promotions/${promotionId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch promotion',
                error: error.message,
            };
        }
    }

    /**
     * Create new promotion (Admin only)
     */
    async createPromotion(promotionData: {
        code: string;
        description: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
        minOrderAmount?: number;
        maxDiscountAmount?: number;
        startDate: string;
        endDate: string;
        usageLimit?: number;
        restaurantId: string;
        applicableCategories?: string[];
        applicableMenuItems?: string[];
    }): Promise<PromotionResponse> {
        try {
            const response = await axiosInstance.post<PromotionResponse>('/promotions', promotionData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to create promotion',
                error: error.message,
            };
        }
    }

    /**
     * Update promotion (Admin only)
     */
    async updatePromotion(promotionId: string, promotionData: Partial<Promotion>): Promise<PromotionResponse> {
        try {
            const response = await axiosInstance.put<PromotionResponse>(`/promotions/${promotionId}`, promotionData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to update promotion',
                error: error.message,
            };
        }
    }

    /**
     * Delete promotion (Admin only)
     */
    async deletePromotion(promotionId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axiosInstance.delete(`/promotions/${promotionId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to delete promotion',
                error: error.message,
            };
        }
    }

    /**
     * Toggle promotion status (Admin only)
     */
    async togglePromotionStatus(promotionId: string): Promise<PromotionResponse> {
        try {
            const response = await axiosInstance.patch<PromotionResponse>(`/promotions/${promotionId}/toggle`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to toggle promotion status',
                error: error.message,
            };
        }
    }

    /**
     * Validate promotion code (Public)
     * This is the key method for customers to check promo codes
     */
    async validatePromotionCode(
        code: string,
        orderAmount: number,
        restaurantId: string
    ): Promise<ValidationResponse> {
        try {
            const response = await axiosInstance.post<ValidationResponse>('/promotions/validate', {
                code: code.toUpperCase(),
                orderAmount,
                restaurantId,
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to validate promotion code',
                error: error.message,
            };
        }
    }

    /**
     * Apply promotion (increment usage count)
     */
    async applyPromotion(promotionId: string): Promise<{ success: boolean; data: any; message?: string }> {
        try {
            const response = await axiosInstance.post(`/promotions/${promotionId}/apply`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to apply promotion',
                error: error.message,
            };
        }
    }
}

export const promotionService = new PromotionService();
export default PromotionService;
