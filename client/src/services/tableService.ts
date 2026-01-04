import axiosInstance from '../config/axiosInterceptors';

interface Table {
    _id: string;
    number: number;
    capacity: number;
    restaurantId: string;
    qrCodeToken: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TableResponse {
    success: boolean;
    data: Table;
}

interface TablesResponse {
    success: boolean;
    count: number;
    data: Table[];
}

class TableService {
    /**
     * Verify QR code token
     */
    async verifyQRCode(token: string): Promise<TableResponse> {
        try {
            const response = await axiosInstance.get<TableResponse>(`/tables/verify-qr/${token}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to verify QR code',
                error: error.message,
            };
        }
    }

    /**
     * Get all tables (Admin/Staff only)
     */
    async getTables(restaurantId?: string): Promise<TablesResponse> {
        try {
            const params = restaurantId ? { restaurantId } : {};
            const response = await axiosInstance.get<TablesResponse>('/tables', {
                params,
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch tables',
                error: error.message,
            };
        }
    }

    /**
     * Get single table (Admin/Staff only)
     */
    async getTable(tableId: string): Promise<TableResponse> {
        try {
            const response = await axiosInstance.get<TableResponse>(`/tables/${tableId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to fetch table',
                error: error.message,
            };
        }
    }

    /**
     * Create new table (Admin only)
     */
    async createTable(tableData: {
        number: number;
        capacity: number;
        restaurantId: string;
    }): Promise<TableResponse> {
        try {
            const response = await axiosInstance.post<TableResponse>('/tables', tableData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to create table',
                error: error.message,
            };
        }
    }

    /**
     * Update table (Admin only)
     */
    async updateTable(tableId: string, tableData: Partial<{
        number: number;
        capacity: number;
        isActive: boolean;
    }>): Promise<TableResponse> {
        try {
            const response = await axiosInstance.put<TableResponse>(`/tables/${tableId}`, tableData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to update table',
                error: error.message,
            };
        }
    }

    /**
     * Regenerate QR code for table (Admin only)
     */
    async regenerateQRCode(tableId: string): Promise<TableResponse> {
        try {
            const response = await axiosInstance.post<TableResponse>(`/tables/${tableId}/regenerate-qr`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to regenerate QR code',
                error: error.message,
            };
        }
    }

    /**
     * Delete table (Admin only)
     */
    async deleteTable(tableId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axiosInstance.delete(`/tables/${tableId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to delete table',
                error: error.message,
            };
        }
    }
}

export const tableService = new TableService();
export default TableService;