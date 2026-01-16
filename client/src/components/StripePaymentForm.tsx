import React, { useState, useEffect } from "react";
import { paymentService } from "../services/paymentService";
import { toast } from "react-toastify";

interface StripePaymentFormProps {
	orderId: string;
	amount: number;
	onSuccess: () => void;
	onCancel: () => void;
}

/**
 * Stripe Payment Form Component
 *
 * This component handles Stripe test card payments.
 * In test mode, use these card numbers:
 * - Success: 4242 4242 4242 4242
 * - Decline: 4000 0000 0000 0002
 * - 3D Secure: 4000 0027 6000 3184
 *
 * Any future expiry date and any 3-digit CVC works.
 */
const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
	orderId,
	amount,
	onSuccess,
	onCancel,
}) => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [cardNumber, setCardNumber] = useState("");
	const [expiry, setExpiry] = useState("");
	const [cvc, setCvc] = useState("");
	const [cardholderName, setCardholderName] = useState("");
	const [error, setError] = useState<string | null>(null);

	// Format card number with spaces
	const formatCardNumber = (value: string) => {
		const cleaned = value.replace(/\s/g, "");
		const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
		return formatted.substring(0, 19); // Max 16 digits + 3 spaces
	};

	// Format expiry as MM/YY
	const formatExpiry = (value: string) => {
		const cleaned = value.replace(/\D/g, "");
		if (cleaned.length >= 2) {
			return (
				cleaned.substring(0, 2) +
				(cleaned.length > 2 ? "/" + cleaned.substring(2, 4) : "")
			);
		}
		return cleaned;
	};

	const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatCardNumber(e.target.value);
		setCardNumber(formatted);
		setError(null);
	};

	const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatExpiry(e.target.value);
		setExpiry(formatted);
		setError(null);
	};

	const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").substring(0, 4);
		setCvc(value);
		setError(null);
	};

	const validateCard = (): boolean => {
		const cleanCardNumber = cardNumber.replace(/\s/g, "");

		if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
			setError("Invalid card number");
			return false;
		}

		if (!expiry || expiry.length < 5) {
			setError("Invalid expiry date");
			return false;
		}

		const [month, year] = expiry.split("/");
		const monthNum = parseInt(month);
		if (monthNum < 1 || monthNum > 12) {
			setError("Invalid month");
			return false;
		}

		if (cvc.length < 3) {
			setError("Invalid CVC");
			return false;
		}

		if (!cardholderName.trim()) {
			setError("Cardholder name is required");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!validateCard()) {
			return;
		}

		setIsProcessing(true);

		try {
			// Step 1: Create payment intent
			console.log("💳 Creating payment intent for order:", orderId);
			const intentResponse = await paymentService.createPaymentIntent(
				orderId,
				"card"
			);

			if (!intentResponse.success || !intentResponse.data.clientSecret) {
				throw new Error("Failed to create payment intent");
			}

			const { clientSecret, paymentIntentId } = intentResponse.data;
			console.log("✅ Payment intent created:", paymentIntentId);

			// Step 2: Simulate Stripe card processing
			// In production, you would use @stripe/stripe-js and Stripe Elements here
			// For testing, we'll send card details to backend which will confirm with Stripe

			// For test mode, certain card numbers trigger different behaviors:
			const cleanCardNumber = cardNumber.replace(/\s/g, "");

			// Wait a bit to simulate processing
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Step 3: Confirm payment (send card number to backend for test mode)
			console.log("🔄 Confirming payment...");
			const confirmResponse = await paymentService.confirmPayment(
				paymentIntentId,
				cleanCardNumber
			);

			if (!confirmResponse.success) {
				throw new Error(
					confirmResponse.message || "Payment confirmation failed"
				);
			}

			console.log("✅ Payment confirmed successfully!");
			toast.success("Payment successful!");
			onSuccess();
		} catch (error: any) {
			console.error("❌ Payment error:", error);
			const errorMessage = error.message || "Payment failed. Please try again.";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
			<div className="mb-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">Card Payment</h2>
				<p className="text-gray-600">Amount: ${amount.toFixed(2)}</p>

				{/* Test Card Information */}
				<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<p className="text-sm font-semibold text-blue-900 mb-1">
						🧪 Test Mode
					</p>
					<p className="text-xs text-blue-700">
						Use card:{" "}
						<span className="font-mono font-bold">4242 4242 4242 4242</span>
						<br />
						Any future date, any CVC
					</p>
				</div>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Cardholder Name */}
				<div>
					<label
						htmlFor="cardholderName"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Cardholder Name
					</label>
					<input
						id="cardholderName"
						type="text"
						value={cardholderName}
						onChange={(e) => setCardholderName(e.target.value)}
						placeholder="John Doe"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						disabled={isProcessing}
					/>
				</div>

				{/* Card Number */}
				<div>
					<label
						htmlFor="cardNumber"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Card Number
					</label>
					<input
						id="cardNumber"
						type="text"
						value={cardNumber}
						onChange={handleCardNumberChange}
						placeholder="4242 4242 4242 4242"
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
						disabled={isProcessing}
					/>
				</div>

				{/* Expiry and CVC */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="expiry"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Expiry Date
						</label>
						<input
							id="expiry"
							type="text"
							value={expiry}
							onChange={handleExpiryChange}
							placeholder="MM/YY"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
							disabled={isProcessing}
						/>
					</div>
					<div>
						<label
							htmlFor="cvc"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							CVC
						</label>
						<input
							id="cvc"
							type="text"
							value={cvc}
							onChange={handleCvcChange}
							placeholder="123"
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
							disabled={isProcessing}
						/>
					</div>
				</div>

				{/* Buttons */}
				<div className="flex space-x-3 mt-6">
					<button
						type="button"
						onClick={onCancel}
						disabled={isProcessing}
						className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isProcessing}
						className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isProcessing ? (
							<div className="flex items-center justify-center">
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
								Processing...
							</div>
						) : (
							`Pay $${amount.toFixed(2)}`
						)}
					</button>
				</div>
			</form>

			{/* Security Notice */}
			<div className="mt-4 flex items-center justify-center text-xs text-gray-500">
				<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
					<path
						fillRule="evenodd"
						d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
						clipRule="evenodd"
					/>
				</svg>
				Secured by Stripe
			</div>
		</div>
	);
};

export default StripePaymentForm;
