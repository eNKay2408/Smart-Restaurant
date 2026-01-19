import mongoose from "mongoose";
import dotenv from "dotenv";
import {
	User,
	Restaurant,
	Category,
	MenuItem,
	Table,
	Modifier,
	Order,
	Promotion,
	Review,
} from "../models/index.js";
import { generateQRToken } from "../config/jwt.js";
import QRCode from "qrcode";

dotenv.config();

const seedDatabase = async () => {
	try {
		// Connect to database
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("✅ Connected to MongoDB");

		// Clear existing data
		await User.deleteMany({});
		await Restaurant.deleteMany({});
		await Category.deleteMany({});
		await MenuItem.deleteMany({});
		await Table.deleteMany({});
		await Modifier.deleteMany({});
		await Order.deleteMany({});
		await Promotion.deleteMany({});
		await Review.deleteMany({});
		console.log("🗑️  Cleared existing data");

		// 1. Create Super Admin
		const superAdmin = await User.create({
			fullName: "Super Admin",
			email: "superadmin@smartrestaurant.com",
			password: "Admin123",
			role: "super_admin",
			isEmailVerified: true,
		});
		console.log("✅ Created Super Admin");

		// 2. Create Restaurant Admin
		const admin = await User.create({
			fullName: "Restaurant Owner",
			email: "admin@restaurant.com",
			password: "Admin123",
			role: "admin",
			isEmailVerified: true,
		});
		console.log("✅ Created Admin");

		// 3. Create Restaurant
		const restaurant = await Restaurant.create({
			name: "The Smart Bistro",
			description: "A modern dining experience with QR ordering",
			address: {
				street: "123 Main Street",
				city: "Ho Chi Minh City",
				state: "Vietnam",
				zipCode: "700000",
				country: "Vietnam",
			},
			contact: {
				phone: "+84 123 456 789",
				email: "info@smartbistro.com",
				website: "https://smartbistro.com",
			},
			taxRate: 10,
			currency: "USD",
			ownerId: admin._id,
		});
		console.log("✅ Created Restaurant");

		// Update admin's restaurantId
		admin.restaurantId = restaurant._id;
		await admin.save();

		// 4. Create Waiter
		const waiter = await User.create({
			fullName: "John Waiter",
			email: "waiter@restaurant.com",
			password: "Waiter123",
			role: "waiter",
			restaurantId: restaurant._id,
			isEmailVerified: true,
		});
		console.log("✅ Created Waiter");

		// 5. Create Kitchen Staff
		const kitchen = await User.create({
			fullName: "Chef Mike",
			email: "kitchen@restaurant.com",
			password: "Kitchen123",
			role: "kitchen",
			restaurantId: restaurant._id,
			isEmailVerified: true,
		});
		console.log("✅ Created Kitchen Staff");

		// 6. Create Customer
		const customer = await User.create({
			fullName: "Jane Customer",
			email: "customer@example.com",
			password: "Customer123",
			role: "customer",
			restaurantId: restaurant._id, // Add restaurantId
			isEmailVerified: true,
		});
		console.log("✅ Created Customer");

		// 7. Create Guest (Walk-in customer)
		const guest = await User.create({
			fullName: "Guest User",
			email: "guest@example.com",
			password: "Guest12345",
			role: "guest",
			isEmailVerified: false,
		});
		console.log("✅ Created Guest User");

		// 7. Create Categories (5 categories)
		const categories = await Category.insertMany([
			{
				name: "Appetizers",
				description: "Start your meal right",
				image: "/uploads/categories/appetizers.jpg",
				displayOrder: 1,
				restaurantId: restaurant._id,
			},
			{
				name: "Main Dishes",
				description: "Our signature dishes",
				image: "/uploads/categories/main-dishes.jpg",
				displayOrder: 2,
				restaurantId: restaurant._id,
			},
			{
				name: "Salads",
				description: "Fresh and healthy options",
				image: "/uploads/categories/salads.jpg",
				displayOrder: 3,
				restaurantId: restaurant._id,
			},
			{
				name: "Drinks",
				description: "Refreshing beverages",
				image: "/uploads/categories/drinks.jpg",
				displayOrder: 4,
				restaurantId: restaurant._id,
			},
			{
				name: "Desserts",
				description: "Sweet endings",
				image: "/uploads/categories/desserts.jpg",
				displayOrder: 5,
				restaurantId: restaurant._id,
			},
		]);
		console.log("✅ Created 5 Categories");

		// 8. Create Modifiers (8 modifiers for customization)
		const modifiers = await Modifier.insertMany([
			{
				name: "Size",
				type: "single",
				required: false,
				displayOrder: 1,
				options: [
					{
						name: "Regular",
						priceAdjustment: 0,
						isDefault: true,
						isActive: true,
					},
					{
						name: "Large",
						priceAdjustment: 5,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Extra Large",
						priceAdjustment: 8,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Extras",
				type: "multiple",
				required: false,
				displayOrder: 2,
				options: [
					{
						name: "Extra Cheese",
						priceAdjustment: 3,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Extra Sauce",
						priceAdjustment: 2,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Side Salad",
						priceAdjustment: 4,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Garlic Bread",
						priceAdjustment: 3.5,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Cooking Level",
				type: "single",
				required: true,
				displayOrder: 3,
				options: [
					{
						name: "Rare",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Medium Rare",
						priceAdjustment: 0,
						isDefault: true,
						isActive: true,
					},
					{
						name: "Medium",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Medium Well",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Well Done",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Spice Level",
				type: "single",
				required: false,
				displayOrder: 4,
				options: [
					{ name: "Mild", priceAdjustment: 0, isDefault: true, isActive: true },
					{
						name: "Medium",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{ name: "Hot", priceAdjustment: 0, isDefault: false, isActive: true },
					{
						name: "Extra Hot",
						priceAdjustment: 1,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Toppings",
				type: "multiple",
				required: false,
				displayOrder: 5,
				options: [
					{
						name: "Mushrooms",
						priceAdjustment: 2.5,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Onions",
						priceAdjustment: 1.5,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Peppers",
						priceAdjustment: 2,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Olives",
						priceAdjustment: 2,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Bacon",
						priceAdjustment: 3.5,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Jalapeños",
						priceAdjustment: 2,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Drink Size",
				type: "single",
				required: false,
				displayOrder: 6,
				options: [
					{
						name: "Small",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Medium",
						priceAdjustment: 1,
						isDefault: true,
						isActive: true,
					},
					{
						name: "Large",
						priceAdjustment: 2,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Side Options",
				type: "single",
				required: false,
				displayOrder: 7,
				options: [
					{
						name: "French Fries",
						priceAdjustment: 0,
						isDefault: true,
						isActive: true,
					},
					{
						name: "Sweet Potato Fries",
						priceAdjustment: 2,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Onion Rings",
						priceAdjustment: 2.5,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Coleslaw",
						priceAdjustment: 1.5,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				name: "Dressing",
				type: "single",
				required: false,
				displayOrder: 8,
				options: [
					{
						name: "Ranch",
						priceAdjustment: 0,
						isDefault: true,
						isActive: true,
					},
					{
						name: "Caesar",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Italian",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Balsamic",
						priceAdjustment: 0.5,
						isDefault: false,
						isActive: true,
					},
					{
						name: "Honey Mustard",
						priceAdjustment: 0,
						isDefault: false,
						isActive: true,
					},
				],
				isActive: true,
				restaurantId: restaurant._id,
			},
		]);
		console.log("✅ Created 8 Modifiers");

		// 9. Create Promotions (5 promotions for testing)
		const now = new Date();
		const promotions = await Promotion.insertMany([
			{
				code: "SAVE10",
				description: "Save 10% on your entire order",
				discountType: "percentage",
				discountValue: 10,
				minOrderAmount: 50,
				maxDiscountAmount: 20,
				startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
				endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
				usageLimit: 100,
				usedCount: 15,
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				code: "FIRST5",
				description: "Get $5 off your first order",
				discountType: "fixed",
				discountValue: 5,
				minOrderAmount: 20,
				startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
				endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
				usageLimit: 500,
				usedCount: 87,
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				code: "WEEKEND20",
				description: "Weekend Special - 20% off on orders above $100",
				discountType: "percentage",
				discountValue: 20,
				minOrderAmount: 100,
				maxDiscountAmount: 50,
				startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
				endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
				usageLimit: 200,
				usedCount: 42,
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				code: "LUNCH15",
				description: "Lunch time special - $15 off",
				discountType: "fixed",
				discountValue: 15,
				minOrderAmount: 75,
				startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
				endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
				usageLimit: null, // Unlimited
				usedCount: 128,
				isActive: true,
				restaurantId: restaurant._id,
			},
			{
				code: "EXPIRED",
				description: "This promotion has expired (for testing)",
				discountType: "percentage",
				discountValue: 25,
				minOrderAmount: 30,
				startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
				endDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (expired)
				usageLimit: 50,
				usedCount: 50,
				isActive: false,
				restaurantId: restaurant._id,
			},
		]);
		console.log("✅ Created 5 Promotions");

		// 10. Create Menu Items (20 items with images)
		const menuItems = await MenuItem.insertMany([
			// Appetizers (4 items)
			{
				name: "Caesar Salad",
				description: "Fresh romaine lettuce with parmesan and croutons",
				price: 12,
				images: ["/uploads/menu-items/caesar-salad.jpg"],
				categoryId: categories[0]._id,
				restaurantId: restaurant._id,
				prepTime: 10,
				status: "available",
				isRecommended: true,
				totalOrders: 156,
			},
			{
				name: "Mushroom Soup",
				description: "Creamy mushroom soup with herbs",
				price: 8,
				images: ["/uploads/menu-items/mushroom-soup.jpg"],
				categoryId: categories[0]._id,
				restaurantId: restaurant._id,
				prepTime: 8,
				status: "available",
				totalOrders: 89,
			},
			{
				name: "Spring Rolls",
				description: "Crispy Vietnamese spring rolls with sweet chili sauce",
				price: 9,
				images: ["/uploads/menu-items/spring-rolls.jpg"],
				categoryId: categories[0]._id,
				restaurantId: restaurant._id,
				prepTime: 12,
				status: "available",
				allergens: ["Gluten", "Shellfish"],
				totalOrders: 132,
			},
			{
				name: "Bruschetta",
				description: "Toasted bread with fresh tomatoes, basil, and garlic",
				price: 10,
				images: ["/uploads/menu-items/bruschetta.jpg"],
				categoryId: categories[0]._id,
				restaurantId: restaurant._id,
				prepTime: 8,
				status: "available",
				isRecommended: true,
				totalOrders: 178,
			},

			// Main Dishes (6 items)
			{
				name: "Grilled Salmon",
				description: "Fresh Atlantic salmon with seasonal vegetables",
				price: 28,
				images: [
					"/uploads/menu-items/grilled-salmon-1.jpg",
					"/uploads/menu-items/grilled-salmon-2.jpg",
					"/uploads/menu-items/grilled-salmon-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[1]._id,
				restaurantId: restaurant._id,
				prepTime: 15,
				status: "available",
				isRecommended: true,
				allergens: ["Fish", "Dairy"],
				modifiers: [
					{
						name: "Size",
						type: "single",
						required: true,
						options: [
							{ name: "Regular", priceAdjustment: 0 },
							{ name: "Large", priceAdjustment: 5 },
						],
					},
					{
						name: "Extras",
						type: "multiple",
						required: false,
						options: [
							{ name: "Side Salad", priceAdjustment: 4 },
							{ name: "Extra Sauce", priceAdjustment: 2 },
						],
					},
				],
				totalOrders: 243,
			},
			{
				name: "Beef Steak",
				description: "Premium beef steak cooked to perfection",
				price: 35,
				images: [
					"/uploads/menu-items/beef-steak-1.jpg",
					"/uploads/menu-items/beef-steak-2.jpg",
					"/uploads/menu-items/beef-steak-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[1]._id,
				restaurantId: restaurant._id,
				prepTime: 20,
				status: "available",
				isRecommended: true,
				modifiers: [
					{
						name: "Cooking Level",
						type: "single",
						required: true,
						options: [
							{ name: "Rare", priceAdjustment: 0 },
							{ name: "Medium Rare", priceAdjustment: 0 },
							{ name: "Medium", priceAdjustment: 0 },
							{ name: "Well Done", priceAdjustment: 0 },
						],
					},
				],
				totalOrders: 298,
			},
			{
				name: "Pasta Carbonara",
				description: "Classic Italian pasta with bacon and cream",
				price: 18,
				images: [
					"/uploads/menu-items/pasta-carbonara-1.jpg",
					"/uploads/menu-items/pasta-carbonara-2.jpg",
					"/uploads/menu-items/pasta-carbonara-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[1]._id,
				restaurantId: restaurant._id,
				prepTime: 12,
				status: "available",
				allergens: ["Gluten", "Dairy", "Eggs"],
				totalOrders: 167,
			},
			{
				name: "Chicken Teriyaki",
				description: "Grilled chicken with teriyaki sauce and rice",
				price: 22,
				images: [
					"/uploads/menu-items/chicken-teriyaki-1.jpg",
					"/uploads/menu-items/chicken-teriyaki-2.jpg",
					"/uploads/menu-items/chicken-teriyaki-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[1]._id,
				restaurantId: restaurant._id,
				prepTime: 18,
				status: "available",
				totalOrders: 201,
			},
			{
				name: "Seafood Paella",
				description: "Spanish rice dish with mixed seafood",
				price: 32,
				images: ["/uploads/menu-items/seafood-paella.jpg"],
				categoryId: categories[1]._id,
				restaurantId: restaurant._id,
				prepTime: 25,
				status: "available",
				allergens: ["Shellfish", "Fish"],
				isRecommended: true,
				totalOrders: 145,
			},
			{
				name: "Lamb Chops",
				description: "Grilled lamb chops with rosemary and garlic",
				price: 38,
				images: ["/uploads/menu-items/lamb-chops.jpg"],
				categoryId: categories[1]._id,
				restaurantId: restaurant._id,
				prepTime: 22,
				status: "available",
				totalOrders: 94,
			},

			// Salads (3 items)
			{
				name: "Greek Salad",
				description: "Fresh vegetables with feta cheese and olives",
				price: 14,
				images: [
					"/uploads/menu-items/greek-salad-1.jpg",
					"/uploads/menu-items/greek-salad-2.jpg",
					"/uploads/menu-items/greek-salad-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[2]._id,
				restaurantId: restaurant._id,
				prepTime: 8,
				status: "available",
				allergens: ["Dairy"],
				totalOrders: 189,
			},
			{
				name: "Quinoa Bowl",
				description: "Healthy quinoa with roasted vegetables and tahini",
				price: 16,
				images: ["/uploads/menu-items/quinoa-bowl.jpg"],
				categoryId: categories[2]._id,
				restaurantId: restaurant._id,
				prepTime: 10,
				status: "available",
				isRecommended: true,
				totalOrders: 176,
			},
			{
				name: "Caprese Salad",
				description: "Fresh mozzarella, tomatoes, and basil with balsamic",
				price: 13,
				images: ["/uploads/menu-items/caprese-salad.jpg"],
				categoryId: categories[2]._id,
				restaurantId: restaurant._id,
				prepTime: 7,
				status: "available",
				allergens: ["Dairy"],
				totalOrders: 112,
			},

			// Drinks (4 items)
			{
				name: "Fresh Orange Juice",
				description: "Freshly squeezed orange juice",
				price: 6,
				images: [
					"/uploads/menu-items/fresh-orange-juice-1.jpg",
					"/uploads/menu-items/fresh-orange-juice-2.jpg",
					"/uploads/menu-items/fresh-orange-juice-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[3]._id,
				restaurantId: restaurant._id,
				prepTime: 3,
				status: "available",
				totalOrders: 234,
			},
			{
				name: "Iced Coffee",
				description: "Vietnamese style iced coffee",
				price: 5,
				images: [
					"/uploads/menu-items/iced-coffee-1.jpg",
					"/uploads/menu-items/iced-coffee-2.jpg",
					"/uploads/menu-items/iced-coffee-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[3]._id,
				restaurantId: restaurant._id,
				prepTime: 5,
				status: "available",
				totalOrders: 267,
			},
			{
				name: "Mango Smoothie",
				description: "Fresh mango blended with yogurt and honey",
				price: 7,
				images: ["/uploads/menu-items/mango-smoothie.jpg"],
				categoryId: categories[3]._id,
				restaurantId: restaurant._id,
				prepTime: 5,
				status: "available",
				allergens: ["Dairy"],
				totalOrders: 198,
			},
			{
				name: "Green Tea Latte",
				description: "Matcha green tea with steamed milk",
				price: 6,
				images: ["/uploads/menu-items/green-tea-latte.jpg"],
				categoryId: categories[3]._id,
				restaurantId: restaurant._id,
				prepTime: 5,
				status: "available",
				allergens: ["Dairy"],
				totalOrders: 156,
			},

			// Desserts (3 items)
			{
				name: "Chocolate Lava Cake",
				description: "Warm chocolate cake with molten center",
				price: 10,
				images: [
					"/uploads/menu-items/chocolate-lava-cake-1.jpg",
					"/uploads/menu-items/chocolate-lava-cake-2.jpg",
					"/uploads/menu-items/chocolate-lava-cake-3.jpg",
				],
				primaryImageIndex: 0,
				categoryId: categories[4]._id,
				restaurantId: restaurant._id,
				prepTime: 10,
				status: "available",
				isRecommended: true,
				allergens: ["Gluten", "Dairy", "Eggs"],
				totalOrders: 312,
			},
			{
				name: "Tiramisu",
				description: "Classic Italian coffee-flavored dessert",
				price: 9,
				images: ["/uploads/menu-items/tiramisu.jpg"],
				categoryId: categories[4]._id,
				restaurantId: restaurant._id,
				prepTime: 5,
				status: "available",
				allergens: ["Gluten", "Dairy", "Eggs"],
				totalOrders: 187,
			},
			{
				name: "Crème Brûlée",
				description: "Classic French vanilla custard with caramelized sugar",
				price: 11,
				images: ["/uploads/menu-items/creme-brulee.jpg"],
				categoryId: categories[4]._id,
				restaurantId: restaurant._id,
				prepTime: 8,
				status: "available",
				allergens: ["Dairy", "Eggs"],
				isRecommended: true,
				totalOrders: 221,
			},
		]);
		console.log("✅ Created 20 Menu Items with Local Images");

		// NOTE: The following section is commented out because we now use local images
		// All images are already set to local paths (e.g., '/uploads/menu-items/beef-steak-1.jpg')
		/*
        // 10.5. Update Menu Items with Multiple Images (3 images per item)
        const foodImages = {
            ... (commented out - no longer needed)
        };

        // Update each menu item with 3 images
        for (const item of menuItems) {
            const images = getImagesForItem(item.name);
            item.images = images;
            await item.save();
        }
        console.log('✅ Updated all Menu Items with 3 images each');
        */

		// 10. Create Tables with QR Codes (10 tables)
		const tableNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
		const locations = [
			"Window",
			"Corner",
			"Center",
			"Patio",
			"Window",
			"Center",
			"Corner",
			"Private",
			"VIP",
			"Terrace",
		];

		for (let i = 0; i < tableNumbers.length; i++) {
			const table = new Table({
				tableNumber: tableNumbers[i],
				capacity: i < 4 ? 4 : 6,
				location: locations[i],
				restaurantId: restaurant._id,
				status: "active",
			});

			// Generate QR token
			const qrToken = generateQRToken(table._id, restaurant._id);
			const qrUrl = `${process.env.QR_CODE_BASE_URL || "http://localhost:5173/table"}?token=${qrToken}`;

			// Generate QR code image
			const qrCodeImage = await QRCode.toDataURL(qrUrl, {
				width: 300,
				margin: 2,
			});

			table.qrCode = {
				token: qrToken,
				imageUrl: qrCodeImage,
				generatedAt: new Date(),
			};

			await table.save();
		}
		console.log("✅ Created 10 Tables with QR Codes");
		// 11. Create Sample Orders (10 orders with different statuses)
		const tables = await Table.find({ restaurantId: restaurant._id });

		// Helper function to generate order number
		let orderCounter = 1;
		const generateOrderNumber = () => {
			return `ORD${String(orderCounter++).padStart(5, "0")}`;
		};

		const sampleOrders = [];

		// Order 2: Pending
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[1]._id,
			guestName: "Walk-in Guest",
			items: [
				{
					menuItemId: menuItems[0]._id, // Caesar Salad
					name: menuItems[0].name,
					price: menuItems[0].price,
					quantity: 1,
					modifiers: [],
					specialInstructions: "",
					status: "pending",
					subtotal: 12,
				},
			],
			orderNotes: "",
			status: "pending",
			subtotal: 12,
			tax: 1.2,
			discount: 0,
			total: 13.2,
			paymentStatus: "pending",
			createdAt: new Date(Date.now() - 3 * 60000), // 3 minutes ago
		});

		// Order 4: Accepted
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[3]._id,
			guestName: "Birthday Party",
			waiterId: waiter._id,
			items: [
				{
					menuItemId: menuItems[16]._id, // Chocolate Lava Cake
					name: menuItems[16].name,
					price: menuItems[16].price,
					quantity: 3,
					modifiers: [],
					specialInstructions: "Add candles",
					status: "pending",
					subtotal: 30,
				},
			],
			orderNotes: "Birthday celebration",
			status: "accepted",
			acceptedAt: new Date(Date.now() - 6 * 60000),
			subtotal: 30,
			tax: 3,
			discount: 0,
			total: 33,
			paymentStatus: "pending",
			createdAt: new Date(Date.now() - 7 * 60000), // 7 minutes ago
		});

		// Order 6: Preparing
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[5]._id,
			guestName: "Corporate Lunch",
			waiterId: waiter._id,
			items: [
				{
					menuItemId: menuItems[8]._id, // Seafood Paella
					name: menuItems[8].name,
					price: menuItems[8].price,
					quantity: 1,
					modifiers: [],
					specialInstructions: "",
					status: "preparing",
					prepStartTime: new Date(Date.now() - 12 * 60000),
					subtotal: 32,
				},
			],
			orderNotes: "Business meeting",
			status: "preparing",
			acceptedAt: new Date(Date.now() - 18 * 60000),
			subtotal: 32,
			tax: 3.2,
			discount: 0,
			total: 35.2,
			paymentStatus: "pending",
			createdAt: new Date(Date.now() - 25 * 60000), // 25 minutes ago
		});

		// Order 7: Ready (food is ready for pickup)
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[6]._id,
			customerId: customer._id,
			guestName: customer.fullName,
			waiterId: waiter._id,
			items: [
				{
					menuItemId: menuItems[2]._id, // Spring Rolls
					name: menuItems[2].name,
					price: menuItems[2].price,
					quantity: 2,
					modifiers: [],
					specialInstructions: "",
					status: "ready",
					prepStartTime: new Date(Date.now() - 18 * 60000),
					prepEndTime: new Date(Date.now() - 2 * 60000),
					subtotal: 18,
				},
			],
			orderNotes: "",
			status: "ready",
			acceptedAt: new Date(Date.now() - 22 * 60000),
			subtotal: 18,
			tax: 1.8,
			discount: 0,
			total: 19.8,
			paymentStatus: "pending",
			createdAt: new Date(Date.now() - 30 * 60000), // 30 minutes ago
		});

		// Order 8: Served (delivered to table)
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[7]._id,
			customerId: customer._id,
			guestName: customer.fullName,
			waiterId: waiter._id,
			items: [
				{
					menuItemId: menuItems[7]._id, // Chicken Teriyaki
					name: menuItems[7].name,
					price: menuItems[7].price,
					quantity: 1,
					modifiers: [],
					specialInstructions: "",
					status: "served",
					prepStartTime: new Date(Date.now() - 35 * 60000),
					prepEndTime: new Date(Date.now() - 15 * 60000),
					subtotal: 22,
				},
				{
					menuItemId: menuItems[11]._id, // Iced Coffee
					name: menuItems[11].name,
					price: menuItems[11].price,
					quantity: 1,
					modifiers: [],
					specialInstructions: "",
					status: "served",
					subtotal: 5,
				},
			],
			orderNotes: "",
			status: "served",
			acceptedAt: new Date(Date.now() - 40 * 60000),
			servedAt: new Date(Date.now() - 10 * 60000),
			subtotal: 27,
			tax: 2.7,
			discount: 0,
			total: 29.7,
			paymentStatus: "pending",
			createdAt: new Date(Date.now() - 45 * 60000), // 45 minutes ago
		});

		// Order 9: Completed (paid)
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[8]._id,
			customerId: customer._id,
			guestName: customer.fullName,
			waiterId: waiter._id,
			items: [
				{
					menuItemId: menuItems[9]._id, // Lamb Chops
					name: menuItems[9].name,
					price: menuItems[9].price,
					quantity: 1,
					modifiers: [],
					specialInstructions: "",
					status: "served",
					prepStartTime: new Date(Date.now() - 65 * 60000),
					prepEndTime: new Date(Date.now() - 45 * 60000),
					subtotal: 38,
				},
			],
			orderNotes: "",
			status: "completed",
			acceptedAt: new Date(Date.now() - 70 * 60000),
			servedAt: new Date(Date.now() - 40 * 60000),
			subtotal: 38,
			tax: 3.8,
			discount: 5,
			total: 36.8,
			paymentStatus: "paid",
			paymentMethod: "stripe",
			paidAt: new Date(Date.now() - 35 * 60000),
			createdAt: new Date(Date.now() - 75 * 60000), // 75 minutes ago
		});

		// Order 10: Rejected
		sampleOrders.push({
			orderNumber: generateOrderNumber(),
			restaurantId: restaurant._id,
			tableId: tables[9]._id,
			guestName: "Guest Customer",
			items: [
				{
					menuItemId: menuItems[17]._id, // Tiramisu
					name: menuItems[17].name,
					price: menuItems[17].price,
					quantity: 1,
					modifiers: [],
					specialInstructions: "",
					status: "pending",
					subtotal: 9,
				},
			],
			orderNotes: "",
			status: "rejected",
			rejectionReason: "Item out of stock",
			rejectedAt: new Date(Date.now() - 2 * 60000),
			subtotal: 9,
			tax: 0.9,
			discount: 0,
			total: 9.9,
			paymentStatus: "pending",
			createdAt: new Date(Date.now() - 4 * 60000), // 4 minutes ago
		});

		await Order.insertMany(sampleOrders);
		console.log("✅ Created 10 Sample Orders with different statuses");

		// Get the created orders to have their _id values
		const createdOrders = await Order.find().sort({ createdAt: 1 });
		const completedOrder = createdOrders.find(
			(order) => order.status === "completed",
		);

		// 13. Create Reviews for completed orders
		const reviews = [];

		// Only create reviews if we have a completed order
		if (completedOrder) {
			// Review 1: Caesar Salad (5 stars)
			reviews.push({
				menuItemId: menuItems[0]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 5,
				comment:
					"Absolutely delicious! The best Caesar salad I've ever had. Fresh ingredients and perfect dressing.",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});

			// Review 2: Grilled Salmon (4 stars)
			reviews.push({
				menuItemId: menuItems[4]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 4,
				comment:
					"Great salmon, cooked perfectly. Vegetables were fresh. Only minor issue was a bit salty for my taste.",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});

			// Review 3: Margherita Pizza (5 stars)
			reviews.push({
				menuItemId: menuItems[5]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 5,
				comment:
					"Authentic Italian pizza! Crispy crust, fresh mozzarella, and amazing sauce. Highly recommend!",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});

			// Review 4: Beef Burger (3 stars)
			reviews.push({
				menuItemId: menuItems[6]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 3,
				comment:
					"Good burger but nothing exceptional. Patty was a bit dry. Fries were crispy though.",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});

			// Review 5: Chicken Curry (5 stars)
			reviews.push({
				menuItemId: menuItems[7]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 5,
				comment:
					"Incredible curry! Perfect spice level and the chicken was so tender. Will order again!",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});

			// Review 6: Lamb Chops (4 stars)
			reviews.push({
				menuItemId: menuItems[9]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 4,
				comment:
					"Tender lamb chops with great flavor. Cooked to perfection. Portion size was generous.",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});

			// Review 7: Bruschetta (5 stars)
			reviews.push({
				menuItemId: menuItems[3]._id,
				customerId: customer._id,
				orderId: completedOrder._id,
				rating: 5,
				comment:
					"Fresh tomatoes, crispy bread, and perfect seasoning. A must-try appetizer!",
				isVerifiedPurchase: true,
				restaurantId: restaurant._id,
			});
		}

		if (reviews.length > 0) {
			await Review.insertMany(reviews);
			console.log("✅ Created 7 Sample Reviews");

			// Update menu items with review counts and averages
			const updateMenuItemRating = async (menuItemId) => {
				const itemReviews = reviews.filter(
					(r) => r.menuItemId.toString() === menuItemId.toString(),
				);
				if (itemReviews.length > 0) {
					const avgRating =
						itemReviews.reduce((sum, r) => sum + r.rating, 0) /
						itemReviews.length;
					await MenuItem.findByIdAndUpdate(menuItemId, {
						averageRating: avgRating,
						totalReviews: itemReviews.length,
					});
				}
			};

			for (const item of menuItems) {
				await updateMenuItemRating(item._id);
			}
			console.log("✅ Updated menu items with review stats");
		}

		// Print summary
		console.log("\n" + "=".repeat(60));
		console.log("📊 SEED DATA SUMMARY");
		console.log("=".repeat(60));
		console.log(`Restaurant: ${restaurant.name}`);
		console.log(`\n👥 Users Created:`);
		console.log(`   Super Admin: superadmin@smartrestaurant.com / Admin123`);
		console.log(`   Admin: admin@restaurant.com / Admin123456`);
		console.log(`   Waiter: waiter@restaurant.com / Waiter123`);
		console.log(`   Kitchen: kitchen@restaurant.com / Kitchen123`);
		console.log(`   Customer: customer@example.com / Customer123`);
		console.log(`   Guest: guest@example.com / Guest12345`);
		console.log(`\n📁 Categories: ${categories.length} (5 categories)`);
		console.log(`🔧 Modifiers: ${modifiers.length} (8 customization options)`);
		console.log(`�️  Promotions: ${promotions.length} (5 promo codes)`);
		console.log(`�🍽️  Menu Items: ${menuItems.length} (20 items with images)`);
		console.log(`🪑 Tables: ${tableNumbers.length} (10 tables with QR codes)`);
		console.log(
			`📦 Orders: ${sampleOrders.length} (10 orders with various statuses)`,
		);
		console.log(`\n📋 Order Status Breakdown:`);
		console.log(`   - Pending: 2 orders`);
		console.log(`   - Accepted: 2 orders`);
		console.log(`   - Preparing: 2 orders`);
		console.log(`   - Ready: 1 order`);
		console.log(`   - Served: 1 order`);
		console.log(`   - Completed: 1 order`);
		console.log(`   - Rejected: 1 order`);
		console.log("=".repeat(60));
		console.log("\n✅ Database seeded successfully!");
		console.log("🎉 All requirements met:");
		console.log("   ✅ 5 Categories");
		console.log("   ✅ 8 Modifiers");
		console.log("   ✅ 5 Promotions");
		console.log("   ✅ 20 Menu Items with Images");
		console.log("   ✅ 10 Tables with QR Codes");
		console.log("   ✅ 10 Orders with Various Statuses");
		console.log("🚀 You can now start the server with: npm run dev\n");

		process.exit(0);
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		process.exit(1);
	}
};

seedDatabase();
