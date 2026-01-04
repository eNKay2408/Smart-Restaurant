import axiosInstance from '../config/axiosInterceptors';
import type { MenuCategory } from '../types/menu.types';

interface CategoriesResponse {
    success: boolean;
    count: number;
    data: MenuCategory[];
}

interface CategoryResponse {
    success: boolean;
    data: MenuCategory;
}

class CategoryService {
    /**
     * Get all categories
     */
    async getCategories(restaurantId?: string): Promise<CategoriesResponse> {
        try {
            const params = restaurantId ? { restaurantId } : {};
            const response = await axiosInstance.get<CategoriesResponse>('/categories', {
                params,
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch categories',
                error: error.message,
            };
        }
    }

    /**
     * Get category by ID
     */
    async getCategory(categoryId: string): Promise<CategoryResponse> {
        try {
            const response = await axiosInstance.get<CategoryResponse>(`/categories/${categoryId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch category',
                error: error.message,
            };
        }
    }

    /**
     * Create new category (Admin only)
     */
    async createCategory(categoryData: {
        name: string;
        description: string;
        image?: string;
        displayOrder?: number;
        restaurantId: string;
    }): Promise<CategoryResponse> {
        try {
            const response = await axiosInstance.post<CategoryResponse>('/categories', categoryData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to create category',
                error: error.message,
            };
        }
    }

    /**
     * Update category (Admin only)
     */
    async updateCategory(categoryId: string, categoryData: Partial<{
        name: string;
        description: string;
        image: string;
        displayOrder: number;
        isActive: boolean;
    }>): Promise<CategoryResponse> {
        try {
            const response = await axiosInstance.put<CategoryResponse>(`/categories/${categoryId}`, categoryData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to update category',
                error: error.message,
            };
        }
    }

    /**
     * Delete category (Admin only)
     */
    async deleteCategory(categoryId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axiosInstance.delete(`/categories/${categoryId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to delete category',
                error: error.message,
            };
        }
    }
}

export const categoryService = new CategoryService();
export default CategoryService;