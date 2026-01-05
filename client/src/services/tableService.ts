import axiosInstance from '../config/axiosInterceptors';

interface Table {
    _id: string;
    tableNumber: string;
    capacity: number;
    location?: string;
    restaurantId: string;
    qrCode: {
        token: string;
        imageUrl?: string;
        generatedAt: Date;
    };
    status: 'active' | 'inactive' | 'occupied' | 'reserved';
    currentSessionId?: string;
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
        tableNumber: string;
        capacity: number;
        location?: string;
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
        tableNumber: string;
        capacity: number;
        location: string;
        status: 'active' | 'inactive' | 'occupied' | 'reserved';
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

    /**
     * Generate QR code image from table data (Client-side)
     * This creates a QR code for preview without calling the backend
     */
    async generateQRCode(table: any): Promise<string> {
        try {
            // Import QRCode library dynamically
            const QRCode = await import('qrcode');

            // Get QR token from table data
            const qrToken = table.qrCode?.token || table.qrCodeToken || '';

            if (!qrToken) {
                throw new Error('No QR token found for this table');
            }

            // Generate QR code URL
            const qrUrl = `${window.location.origin}/table?token=${qrToken}`;

            // Generate QR code image as data URL
            const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            return qrCodeDataUrl;
        } catch (error: any) {
            console.error('Failed to generate QR code:', error);
            throw {
                success: false,
                message: 'Failed to generate QR code',
                error: error.message,
            };
        }
    }
}

export const tableService = new TableService();
export default TableService;