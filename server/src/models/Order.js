import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		orderNumber: {
			type: String,
			unique: true,
		},
		restaurantId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Restaurant",
			required: true,
		},
		tableId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Table",
			required: true, // Required for dine-in orders
		},
		customerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null, // Can be null for guest orders
		},
		guestName: {
			type: String,
			default: "Guest",
		},
		// Order items
		items: [
			{
				menuItemId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "MenuItem",
					required: true,
				},
				name: String, // Snapshot of item name
				price: Number, // Snapshot of price at order time
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				// Selected modifiers
				modifiers: [
					{
						name: String,
						options: [
							{
								name: String,
								priceAdjustment: Number,
							},
						],
					},
				],
				specialInstructions: {
					type: String,
					default: "",
				},
				// Item status in kitchen
				status: {
					type: String,
					enum: ["pending", "preparing", "ready", "served", "rejected"],
					default: "pending",
				},
				rejectionReason: {
					type: String,
					default: null,
				},
				rejectedAt: {
					type: Date,
					default: null,
				},
				prepStartTime: {
					type: Date,
					default: null,
				},
				prepEndTime: {
					type: Date,
					default: null,
				},
				subtotal: Number, // Calculated: (price + modifier adjustments) * quantity
			},
		],
		// Order-level notes
		orderNotes: {
			type: String,
			default: "",
		},
		// Order status flow: pending -> accepted -> preparing -> ready -> served -> completed
		status: {
			type: String,
			enum: [
				"pending",
				"accepted",
				"rejected",
				"preparing",
				"ready",
				"served",
				"completed",
				"cancelled",
			],
			default: "pending",
		},
		// Waiter who accepted the order
		waiterId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		rejectionReason: {
			type: String,
			default: null,
		},
		rejectedAt: {
			type: Date,
			default: null,
		},
		// Pricing
		subtotal: {
			type: Number,
			required: true,
		},
		tax: {
			type: Number,
			default: 0,
		},
		discount: {
			type: Number,
			default: 0,
		},
		total: {
			type: Number,
			required: true,
		},
		// Payment
		paymentStatus: {
			type: String,
			enum: ["pending", "pending_cash", "paid", "failed", "refunded"],
			default: "pending",
		},
		paymentMethod: {
			type: String,
			enum: ["cash", "card", "stripe", "zalopay", "momo", "vnpay"],
			default: null,
		},
		paymentIntentId: {
			type: String, // Stripe payment intent ID
			default: null,
		},
		paidAt: {
			type: Date,
			default: null,
		},
		amountReceived: {
			type: Number,
			default: 0,
		},
		tipAmount: {
			type: Number,
			default: 0,
		},
		// Timestamps for order flow
		acceptedAt: {
			type: Date,
			default: null,
		},
		preparingAt: {
			type: Date,
			default: null,
		},
		readyAt: {
			type: Date,
			default: null,
		},
		servedAt: {
			type: Date,
			default: null,
		},
		completedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

// Indexes
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ tableId: 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerId: 1 });

// Auto-generate order number
orderSchema.pre("save", async function (next) {
	console.log("Generating order number...");
	if (this.isNew && !this.orderNumber) {
		const count = await mongoose.model("Order").countDocuments();
		this.orderNumber = `ORD${String(count + 1).padStart(5, "0")}`;
	}
	next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
