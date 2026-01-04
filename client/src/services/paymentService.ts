import axiosInstance from '../config/axiosInterceptors';

interface PaymentIntentResponse {
    success: boolean;
    data: {
        clientSecret: string;
        paymentIntentId: string;
    };
    message?: string;
}

interface PaymentStatusResponse {
    success: boolean;
    data: {
        status: 'succeeded' | 'failed' | 'pending' | 'canceled';
        paymentIntentId: string;
        orderId: string;
        amount: number;
        currency: string;
    };
    message?: string;
}

interface PaymentConfirmResponse {
    success: boolean;
    data: {
        paymentIntentId: string;
        status: string;
        orderId: string;
    };
    message?: string;
}

class PaymentService {
    /**
     * Create payment intent for Stripe
     */
    async createPaymentIntent(orderId: string, paymentMethod: string = 'card'): Promise<PaymentIntentResponse> {
        try {
            const response = await axiosInstance.post<PaymentIntentResponse>('/payments/create-intent', {
                orderId,
                paymentMethod
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to create payment intent',
                error: error.message,
            };
        }
    }

    /**
     * Confirm payment after successful client-side payment
     */
    async confirmPayment(paymentIntentId: string): Promise<PaymentConfirmResponse> {
        try {
            const response = await axiosInstance.post<PaymentConfirmResponse>('/payments/confirm', {
                paymentIntentId
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to confirm payment',
                error: error.message,
            };
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResponse> {
        try {
            const response = await axiosInstance.get<PaymentStatusResponse>(`/payments/status/${paymentIntentId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to get payment status',
                error: error.message,
            };
        }
    }

    /**
     * Process cash payment (Staff only)
     */
    async processCashPayment(orderId: string, amountReceived: number): Promise<PaymentConfirmResponse> {
        try {
            const response = await axiosInstance.post<PaymentConfirmResponse>('/payments/cash', {
                orderId,
                amountReceived
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to process cash payment',
                error: error.message,
            };
        }
    }

    /**
     * Request refund (Staff only)
     */
    async refundPayment(orderId: string, reason?: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await axiosInstance.post('/payments/refund', {
                orderId,
                reason
            });
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw {
                success: false,
                message: 'Failed to process refund',
                error: error.message,
            };
        }
    }

    /**
     * Mock payment for demo purposes
     */
    async mockPayment(orderId: string, paymentMethod: string, amount: number): Promise<PaymentConfirmResponse> {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock successful payment response
        return {
            success: true,
            data: {
                paymentIntentId: `mock_pi_${Date.now()}`,
                status: 'succeeded',
                orderId: orderId
            },
            message: 'Payment processed successfully'
        };
    }
}

export const paymentService = new PaymentService();
export default PaymentService;