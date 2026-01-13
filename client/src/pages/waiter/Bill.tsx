import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import orderService from "../../services/orderService";
import type { Order } from "../../types/order.types";

function Bill() {
	const { orderId } = useParams<{ orderId: string }>();
	const navigate = useNavigate();
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (orderId) {
			fetchOrder();
		}
	}, [orderId]);

	const fetchOrder = async () => {
		try {
			setLoading(true);
			const response = await orderService.getOrder(orderId!);
			if (response.success && response.data) {
				setOrder(response.data);
			}
		} catch (err: any) {
			setError(err.message || "Failed to fetch order");
		} finally {
			setLoading(false);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const handleExportPDF = () => {
		// Use browser's print to PDF functionality
		window.print();
	};

	const handleExportJSON = () => {
		if (!order) return;

		const billData = {
			orderNumber: order.orderNumber,
			date: new Date(order.createdAt).toLocaleDateString(),
			time: new Date(order.createdAt).toLocaleTimeString(),
			table: order.tableId.tableNumber,
			customer: order.customerId ? order.customerId.fullName : order.guestName,
			items: order.items
				.filter((item) => item.status !== 'rejected')
				.map((item) => ({
					name: item.name,
					quantity: item.quantity,
					price: item.price,
					modifiers: item.modifiers,
					specialInstructions: item.specialInstructions,
					subtotal: item.subtotal,
				})),
			subtotal: order.subtotal,
			tax: order.tax,
			discount: order.discount,
			total: order.total,
			paymentStatus: order.paymentStatus,
			orderNotes: order.orderNotes,
		};

		const dataStr = JSON.stringify(billData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `bill-${order.orderNumber}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleExportCSV = () => {
		if (!order) return;

		let csv = "Item,Quantity,Price,Modifiers,Subtotal\n";
		order.items
			.filter((item) => item.status !== 'rejected')
			.forEach((item) => {
				const modifiers = item.modifiers
					?.map((m) => `${m.name}: ${m.options.map((o) => o.name).join(", ")}`)
					.join("; ");
				csv += `"${item.name}",${item.quantity},$${item.price},"${modifiers || ""
					}",$${item.subtotal}\n`;
			});

		csv += `\n`;
		csv += `Subtotal,,,,,$${order.subtotal}\n`;
		csv += `Tax,,,,,$${order.tax}\n`;
		csv += `Discount,,,,,$${order.discount}\n`;
		csv += `Total,,,,,$${order.total}\n`;

		const dataBlob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `bill-${order.orderNumber}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-2xl font-semibold text-gray-600">
					Loading bill...
				</div>
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<p className="text-2xl font-semibold text-red-600 mb-4">
						{error || "Order not found"}
					</p>
					<button
						onClick={() => navigate(-1)}
						className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="container mx-auto px-4 max-w-4xl">
				{/* Action Buttons (Hidden when printing) */}
				<div className="mb-6 flex flex-wrap gap-3 print:hidden">
					<button
						onClick={() => navigate(-1)}
						className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all"
					>
						← Back
					</button>
					<button
						onClick={handlePrint}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
					>
						🖨️ Print
					</button>
					<button
						onClick={handleExportPDF}
						className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-all"
					>
						📄 Export PDF
					</button>
					<button
						onClick={handleExportJSON}
						className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all"
					>
						📊 Export JSON
					</button>
					<button
						onClick={handleExportCSV}
						className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all"
					>
						📊 Export CSV
					</button>
				</div>

				{/* Bill Content */}
				<div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
					{/* Restaurant Header */}
					<div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
						<h1 className="text-3xl font-bold text-gray-800 mb-2">
							The Smart Bistro
						</h1>
						<p className="text-gray-600">123 Main Street, Ho Chi Minh City</p>
						<p className="text-gray-600">Phone: +84 123 456 789</p>
					</div>

					{/* Bill Header */}
					<div className="mb-6">
						<h2 className="text-2xl font-bold text-center mb-4">
							TAX INVOICE / BILL
						</h2>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p className="font-semibold">Order Number:</p>
								<p className="text-lg font-bold text-purple-600">
									{order.orderNumber}
								</p>
							</div>
							<div>
								<p className="font-semibold">Date & Time:</p>
								<p>
									{new Date(order.createdAt).toLocaleDateString()}{" "}
									{new Date(order.createdAt).toLocaleTimeString()}
								</p>
							</div>
							<div>
								<p className="font-semibold">Table:</p>
								<p className="text-lg font-bold">{order.tableId.tableNumber}</p>
							</div>
							<div>
								<p className="font-semibold">Customer:</p>
								<p>
									{order.customerId
										? order.customerId.fullName
										: order.guestName}
								</p>
							</div>
							{order.waiterId && (
								<div>
									<p className="font-semibold">Served by:</p>
									<p>{order.waiterId.fullName}</p>
								</div>
							)}
							<div>
								<p className="font-semibold">Payment Status:</p>
								<p
									className={`font-bold ${order.paymentStatus === "paid"
											? "text-green-600"
											: "text-yellow-600"
										}`}
								>
									{order.paymentStatus.toUpperCase()}
								</p>
							</div>
						</div>
					</div>

					{/* Items Table */}
					<div className="mb-6">
						<table className="w-full border-collapse">
							<thead>
								<tr className="bg-gray-100 border-b-2 border-gray-300">
									<th className="text-left py-3 px-4">Item</th>
									<th className="text-center py-3 px-4">Qty</th>
									<th className="text-right py-3 px-4">Price</th>
									<th className="text-right py-3 px-4">Subtotal</th>
								</tr>
							</thead>
							<tbody>
								{order.items
									.filter((item) => item.status !== 'rejected')
									.map((item, idx) => (
										<tr key={idx} className="border-b border-gray-200">
											<td className="py-3 px-4">
												<p className="font-semibold">{item.name}</p>
												{item.modifiers && item.modifiers.length > 0 && (
													<div className="ml-4 mt-1 text-sm text-gray-600">
														{item.modifiers.map((modifier, mIdx) => (
															<p key={mIdx}>
																+ {modifier.name}:{" "}
																{modifier.options
																	.map((opt) => opt.name)
																	.join(", ")}
															</p>
														))}
													</div>
												)}
												{item.specialInstructions && (
													<p className="ml-4 text-sm text-gray-500 italic">
														Note: {item.specialInstructions}
													</p>
												)}
											</td>
											<td className="text-center py-3 px-4">{item.quantity}</td>
											<td className="text-right py-3 px-4">
												${item.price.toFixed(2)}
											</td>
											<td className="text-right py-3 px-4 font-semibold">
												${item.subtotal.toFixed(2)}
											</td>
										</tr>
									))}
							</tbody>
						</table>
					</div>

					{/* Order Notes */}
					{order.orderNotes && (
						<div className="mb-6 bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
							<p className="font-semibold text-gray-700 mb-1">Order Notes:</p>
							<p className="text-gray-600">{order.orderNotes}</p>
						</div>
					)}

					{/* Totals */}
					<div className="border-t-2 border-gray-300 pt-4">
						<div className="flex justify-end mb-2">
							<div className="w-64">
								<div className="flex justify-between mb-2">
									<span className="text-gray-600">Subtotal:</span>
									<span className="font-semibold">
										${order.subtotal.toFixed(2)}
									</span>
								</div>
								<div className="flex justify-between mb-2">
									<span className="text-gray-600">Tax:</span>
									<span className="font-semibold">${order.tax.toFixed(2)}</span>
								</div>
								{order.discount > 0 && (
									<div className="flex justify-between mb-2 text-green-600">
										<span>Discount:</span>
										<span className="font-semibold">
											-${order.discount.toFixed(2)}
										</span>
									</div>
								)}
								<div className="flex justify-between border-t-2 border-gray-300 pt-2 mt-2">
									<span className="text-xl font-bold">TOTAL:</span>
									<span className="text-xl font-bold text-purple-600">
										${order.total.toFixed(2)}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
						<p className="mb-2">Thank you for dining with us!</p>
						<p>Please visit us again soon</p>
						<p className="mt-4 text-xs text-gray-500">
							This is a computer-generated bill
						</p>
					</div>
				</div>
			</div>

			{/* Print Styles */}
			<style>{`
				@media print {
					body {
						background: white;
					}
					.print\\:hidden {
						display: none !important;
					}
					.print\\:shadow-none {
						box-shadow: none !important;
					}
				}
			`}</style>
		</div>
	);
}

export default Bill;
