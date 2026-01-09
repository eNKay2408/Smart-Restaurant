import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Restaurant, Category, MenuItem, Table, Modifier, Order } from '../models/index.js';
import { generateQRToken } from '../config/jwt.js';
import QRCode from 'qrcode';

dotenv.config();

const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Category.deleteMany({});
        await MenuItem.deleteMany({});
        await Table.deleteMany({});
        await Modifier.deleteMany({});
        await Order.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // 1. Create Super Admin
        const superAdmin = await User.create({
            fullName: 'Super Admin',
            email: 'superadmin@smartrestaurant.com',
            password: 'Admin123',
            role: 'super_admin',
            isEmailVerified: true,
        });
        console.log('✅ Created Super Admin');

        // 2. Create Restaurant Admin
        const admin = await User.create({
            fullName: 'Restaurant Owner',
            email: 'admin@restaurant.com',
            password: 'Admin123',
            role: 'admin',
            isEmailVerified: true,
        });
        console.log('✅ Created Admin');

        // 3. Create Restaurant
        const restaurant = await Restaurant.create({
            name: 'The Smart Bistro',
            description: 'A modern dining experience with QR ordering',
            address: {
                street: '123 Main Street',
                city: 'Ho Chi Minh City',
                state: 'Vietnam',
                zipCode: '700000',
                country: 'Vietnam',
            },
            contact: {
                phone: '+84 123 456 789',
                email: 'info@smartbistro.com',
                website: 'https://smartbistro.com',
            },
            taxRate: 10,
            currency: 'USD',
            ownerId: admin._id,
        });
        console.log('✅ Created Restaurant');

        // Update admin's restaurantId
        admin.restaurantId = restaurant._id;
        await admin.save();

        // 4. Create Waiter
        const waiter = await User.create({
            fullName: 'John Waiter',
            email: 'waiter@restaurant.com',
            password: 'Waiter123',
            role: 'waiter',
            restaurantId: restaurant._id,
            isEmailVerified: true,
        });
        console.log('✅ Created Waiter');

        // 5. Create Kitchen Staff
        const kitchen = await User.create({
            fullName: 'Chef Mike',
            email: 'kitchen@restaurant.com',
            password: 'Kitchen123',
            role: 'kitchen',
            restaurantId: restaurant._id,
            isEmailVerified: true,
        });
        console.log('✅ Created Kitchen Staff');

        // 6. Create Customer
        const customer = await User.create({
            fullName: 'Jane Customer',
            email: 'customer@example.com',
            password: 'Customer123',
            role: 'customer',
            isEmailVerified: true,
        });
        console.log('✅ Created Customer');

        // 7. Create Guest (Walk-in customer)
        const guest = await User.create({
            fullName: 'Guest User',
            email: 'guest@example.com',
            password: 'Guest12345',
            role: 'guest',
            isEmailVerified: false,
        });
        console.log('✅ Created Guest User');

        // 7. Create Categories (5 categories)
        const categories = await Category.insertMany([
            {
                name: 'Appetizers',
                description: 'Start your meal right',
                image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400',
                displayOrder: 1,
                restaurantId: restaurant._id,
            },
            {
                name: 'Main Dishes',
                description: 'Our signature dishes',
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                displayOrder: 2,
                restaurantId: restaurant._id,
            },
            {
                name: 'Salads',
                description: 'Fresh and healthy options',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
                displayOrder: 3,
                restaurantId: restaurant._id,
            },
            {
                name: 'Drinks',
                description: 'Refreshing beverages',
                image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
                displayOrder: 4,
                restaurantId: restaurant._id,
            },
            {
                name: 'Desserts',
                description: 'Sweet endings',
                image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
                displayOrder: 5,
                restaurantId: restaurant._id,
            },
        ]);
        console.log('✅ Created 5 Categories');

        // 8. Create Modifiers (8 modifiers for customization)
        const modifiers = await Modifier.insertMany([
            {
                name: 'Size',
                type: 'single',
                required: false,
                displayOrder: 1,
                options: [
                    { name: 'Regular', priceAdjustment: 0, isDefault: true, isActive: true },
                    { name: 'Large', priceAdjustment: 5, isDefault: false, isActive: true },
                    { name: 'Extra Large', priceAdjustment: 8, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Extras',
                type: 'multiple',
                required: false,
                displayOrder: 2,
                options: [
                    { name: 'Extra Cheese', priceAdjustment: 3, isDefault: false, isActive: true },
                    { name: 'Extra Sauce', priceAdjustment: 2, isDefault: false, isActive: true },
                    { name: 'Side Salad', priceAdjustment: 4, isDefault: false, isActive: true },
                    { name: 'Garlic Bread', priceAdjustment: 3.5, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Cooking Level',
                type: 'single',
                required: true,
                displayOrder: 3,
                options: [
                    { name: 'Rare', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Medium Rare', priceAdjustment: 0, isDefault: true, isActive: true },
                    { name: 'Medium', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Medium Well', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Well Done', priceAdjustment: 0, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Spice Level',
                type: 'single',
                required: false,
                displayOrder: 4,
                options: [
                    { name: 'Mild', priceAdjustment: 0, isDefault: true, isActive: true },
                    { name: 'Medium', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Hot', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Extra Hot', priceAdjustment: 1, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Toppings',
                type: 'multiple',
                required: false,
                displayOrder: 5,
                options: [
                    { name: 'Mushrooms', priceAdjustment: 2.5, isDefault: false, isActive: true },
                    { name: 'Onions', priceAdjustment: 1.5, isDefault: false, isActive: true },
                    { name: 'Peppers', priceAdjustment: 2, isDefault: false, isActive: true },
                    { name: 'Olives', priceAdjustment: 2, isDefault: false, isActive: true },
                    { name: 'Bacon', priceAdjustment: 3.5, isDefault: false, isActive: true },
                    { name: 'Jalapeños', priceAdjustment: 2, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Drink Size',
                type: 'single',
                required: false,
                displayOrder: 6,
                options: [
                    { name: 'Small', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Medium', priceAdjustment: 1, isDefault: true, isActive: true },
                    { name: 'Large', priceAdjustment: 2, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Side Options',
                type: 'single',
                required: false,
                displayOrder: 7,
                options: [
                    { name: 'French Fries', priceAdjustment: 0, isDefault: true, isActive: true },
                    { name: 'Sweet Potato Fries', priceAdjustment: 2, isDefault: false, isActive: true },
                    { name: 'Onion Rings', priceAdjustment: 2.5, isDefault: false, isActive: true },
                    { name: 'Coleslaw', priceAdjustment: 1.5, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            },
            {
                name: 'Dressing',
                type: 'single',
                required: false,
                displayOrder: 8,
                options: [
                    { name: 'Ranch', priceAdjustment: 0, isDefault: true, isActive: true },
                    { name: 'Caesar', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Italian', priceAdjustment: 0, isDefault: false, isActive: true },
                    { name: 'Balsamic', priceAdjustment: 0.5, isDefault: false, isActive: true },
                    { name: 'Honey Mustard', priceAdjustment: 0, isDefault: false, isActive: true }
                ],
                isActive: true,
                restaurantId: restaurant._id,
            }
        ]);
        console.log('✅ Created 8 Modifiers');

        // 9. Create Menu Items (20 items with images)
        const menuItems = await MenuItem.insertMany([
            // Appetizers (4 items)
            {
                name: 'Caesar Salad',
                description: 'Fresh romaine lettuce with parmesan and croutons',
                price: 12,
                images: ['https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500'],
                categoryId: categories[0]._id,
                restaurantId: restaurant._id,
                prepTime: 10,
                status: 'available',
                isRecommended: true,
                modifiers: [
                    {
                        name: 'Add-ons',
                        type: 'multiple',
                        required: false,
                        options: [
                            { name: 'Grilled Chicken', priceAdjustment: 5 },
                            { name: 'Shrimp', priceAdjustment: 7 },
                            { name: 'Extra Parmesan', priceAdjustment: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Mushroom Soup',
                description: 'Creamy mushroom soup with herbs',
                price: 8,
                images: ['https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500'],
                categoryId: categories[0]._id,
                restaurantId: restaurant._id,
                prepTime: 8,
                status: 'available',
            },
            {
                name: 'Spring Rolls',
                description: 'Crispy Vietnamese spring rolls with sweet chili sauce',
                price: 9,
                images: ['https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500'],
                categoryId: categories[0]._id,
                restaurantId: restaurant._id,
                prepTime: 12,
                status: 'available',
                allergens: ['Gluten', 'Shellfish'],
            },
            {
                name: 'Bruschetta',
                description: 'Toasted bread with fresh tomatoes, basil, and garlic',
                price: 10,
                images: ['https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=500'],
                categoryId: categories[0]._id,
                restaurantId: restaurant._id,
                prepTime: 8,
                status: 'available',
                isRecommended: true,
            },

            // Main Dishes (6 items)
            {
                name: 'Grilled Salmon',
                description: 'Fresh Atlantic salmon with seasonal vegetables',
                price: 28,
                images: ['https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500'],
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 15,
                status: 'available',
                isRecommended: true,
                allergens: ['Fish', 'Dairy'],
                modifiers: [
                    {
                        name: 'Size',
                        type: 'single',
                        required: true,
                        options: [
                            { name: 'Regular', priceAdjustment: 0 },
                            { name: 'Large', priceAdjustment: 5 },
                        ],
                    },
                    {
                        name: 'Extras',
                        type: 'multiple',
                        required: false,
                        options: [
                            { name: 'Side Salad', priceAdjustment: 4 },
                            { name: 'Extra Sauce', priceAdjustment: 2 },
                        ],
                    },
                ],
            },
            {
                name: 'Beef Steak',
                description: 'Premium beef steak cooked to perfection',
                price: 35,
                images: ['https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500'],
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 20,
                status: 'available',
                isRecommended: true,
                modifiers: [
                    {
                        name: 'Cooking Level',
                        type: 'single',
                        required: true,
                        options: [
                            { name: 'Rare', priceAdjustment: 0 },
                            { name: 'Medium Rare', priceAdjustment: 0 },
                            { name: 'Medium', priceAdjustment: 0 },
                            { name: 'Well Done', priceAdjustment: 0 },
                        ],
                    },
                ],
            },
            {
                name: 'Pasta Carbonara',
                description: 'Classic Italian pasta with bacon and cream',
                price: 18,
                images: ['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500'],
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 12,
                status: 'available',
                allergens: ['Gluten', 'Dairy', 'Eggs'],
            },
            {
                name: 'Chicken Teriyaki',
                description: 'Grilled chicken with teriyaki sauce and rice',
                price: 22,
                images: ['https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=500'],
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 18,
                status: 'available',
            },
            {
                name: 'Seafood Paella',
                description: 'Spanish rice dish with mixed seafood',
                price: 32,
                images: ['https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=500'],
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 25,
                status: 'available',
                allergens: ['Shellfish', 'Fish'],
                isRecommended: true,
            },
            {
                name: 'Lamb Chops',
                description: 'Grilled lamb chops with rosemary and garlic',
                price: 38,
                images: ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=500'],
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 22,
                status: 'available',
            },

            // Salads (3 items)
            {
                name: 'Greek Salad',
                description: 'Fresh vegetables with feta cheese and olives',
                price: 14,
                images: ['https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500'],
                categoryId: categories[2]._id,
                restaurantId: restaurant._id,
                prepTime: 8,
                status: 'available',
                allergens: ['Dairy'],
            },
            {
                name: 'Quinoa Bowl',
                description: 'Healthy quinoa with roasted vegetables and tahini',
                price: 16,
                images: ['https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=500'],
                categoryId: categories[2]._id,
                restaurantId: restaurant._id,
                prepTime: 10,
                status: 'available',
                isRecommended: true,
            },
            {
                name: 'Caprese Salad',
                description: 'Fresh mozzarella, tomatoes, and basil with balsamic',
                price: 13,
                images: ['https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=500'],
                categoryId: categories[2]._id,
                restaurantId: restaurant._id,
                prepTime: 7,
                status: 'available',
                allergens: ['Dairy'],
            },

            // Drinks (4 items)
            {
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed orange juice',
                price: 6,
                images: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500'],
                categoryId: categories[3]._id,
                restaurantId: restaurant._id,
                prepTime: 3,
                status: 'available',
            },
            {
                name: 'Iced Coffee',
                description: 'Vietnamese style iced coffee',
                price: 5,
                images: ['https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500'],
                categoryId: categories[3]._id,
                restaurantId: restaurant._id,
                prepTime: 5,
                status: 'available',
                modifiers: [
                    {
                        name: 'Sugar Level',
                        type: 'single',
                        required: true,
                        options: [
                            { name: 'No Sugar', priceAdjustment: 0 },
                            { name: 'Less Sugar', priceAdjustment: 0 },
                            { name: 'Normal', priceAdjustment: 0 },
                            { name: 'Extra Sweet', priceAdjustment: 0 },
                        ],
                    },
                ],
            },
            {
                name: 'Mango Smoothie',
                description: 'Fresh mango blended with yogurt and honey',
                price: 7,
                images: ['https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=500'],
                categoryId: categories[3]._id,
                restaurantId: restaurant._id,
                prepTime: 5,
                status: 'available',
                allergens: ['Dairy'],
            },
            {
                name: 'Green Tea Latte',
                description: 'Matcha green tea with steamed milk',
                price: 6,
                images: ['https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500'],
                categoryId: categories[3]._id,
                restaurantId: restaurant._id,
                prepTime: 5,
                status: 'available',
                allergens: ['Dairy'],
            },

            // Desserts (3 items)
            {
                name: 'Chocolate Lava Cake',
                description: 'Warm chocolate cake with molten center',
                price: 10,
                images: ['https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500'],
                categoryId: categories[4]._id,
                restaurantId: restaurant._id,
                prepTime: 10,
                status: 'available',
                isRecommended: true,
                allergens: ['Gluten', 'Dairy', 'Eggs'],
            },
            {
                name: 'Tiramisu',
                description: 'Classic Italian coffee-flavored dessert',
                price: 9,
                images: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500'],
                categoryId: categories[4]._id,
                restaurantId: restaurant._id,
                prepTime: 5,
                status: 'available',
                allergens: ['Gluten', 'Dairy', 'Eggs'],
            },
            {
                name: 'Crème Brûlée',
                description: 'Classic French vanilla custard with caramelized sugar',
                price: 11,
                images: ['https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=500'],
                categoryId: categories[4]._id,
                restaurantId: restaurant._id,
                prepTime: 8,
                status: 'available',
                allergens: ['Dairy', 'Eggs'],
                isRecommended: true,
            },
        ]);
        console.log('✅ Created 20 Menu Items with Images');

        // 10. Create Tables with QR Codes (10 tables)
        const tableNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const locations = ['Window', 'Corner', 'Center', 'Patio', 'Window', 'Center', 'Corner', 'Private', 'VIP', 'Terrace'];

        for (let i = 0; i < tableNumbers.length; i++) {
            const table = new Table({
                tableNumber: tableNumbers[i],
                capacity: i < 4 ? 4 : 6,
                location: locations[i],
                restaurantId: restaurant._id,
                status: 'active',
            });

            // Generate QR token
            const qrToken = generateQRToken(table._id, restaurant._id);
            const qrUrl = `${process.env.QR_CODE_BASE_URL || 'http://localhost:5173/table'}?token=${qrToken}`;

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
        console.log('✅ Created 10 Tables with QR Codes');
        // 11. Create Sample Orders (10 orders with different statuses)
        const tables = await Table.find({ restaurantId: restaurant._id });
        
        // Helper function to generate order number
        let orderCounter = 1;
        const generateOrderNumber = () => {
            return `ORD${String(orderCounter++).padStart(5, '0')}`;
        };

        const sampleOrders = [];

        // Order 1: Pending (waiting for waiter)
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[0]._id,
            customerId: customer._id,
            guestName: customer.fullName,
            items: [
                {
                    menuItemId: menuItems[4]._id, // Grilled Salmon
                    name: menuItems[4].name,
                    price: menuItems[4].price,
                    quantity: 1,
                    modifiers: [
                        {
                            name: 'Size',
                            options: [{ name: 'Regular', priceAdjustment: 0 }]
                        }
                    ],
                    specialInstructions: 'No garlic please',
                    status: 'pending',
                    subtotal: 28
                },
                {
                    menuItemId: menuItems[10]._id, // Fresh Orange Juice
                    name: menuItems[10].name,
                    price: menuItems[10].price,
                    quantity: 2,
                    modifiers: [],
                    specialInstructions: '',
                    status: 'pending',
                    subtotal: 12
                }
            ],
            orderNotes: 'Please serve quickly',
            status: 'pending',
            subtotal: 40,
            tax: 4,
            discount: 0,
            total: 44,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 5 * 60000) // 5 minutes ago
        });

        // Order 2: Pending
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[1]._id,
            guestName: 'Walk-in Guest',
            items: [
                {
                    menuItemId: menuItems[0]._id, // Caesar Salad
                    name: menuItems[0].name,
                    price: menuItems[0].price,
                    quantity: 1,
                    modifiers: [],
                    specialInstructions: '',
                    status: 'pending',
                    subtotal: 12
                }
            ],
            orderNotes: '',
            status: 'pending',
            subtotal: 12,
            tax: 1.2,
            discount: 0,
            total: 13.2,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 3 * 60000) // 3 minutes ago
        });

        // Order 3: Accepted (waiter accepted, waiting for kitchen)
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[2]._id,
            customerId: customer._id,
            guestName: customer.fullName,
            waiterId: waiter._id,
            items: [
                {
                    menuItemId: menuItems[5]._id, // Beef Steak
                    name: menuItems[5].name,
                    price: menuItems[5].price,
                    quantity: 1,
                    modifiers: [
                        {
                            name: 'Cooking Level',
                            options: [{ name: 'Medium Rare', priceAdjustment: 0 }]
                        }
                    ],
                    specialInstructions: '',
                    status: 'pending',
                    subtotal: 35
                }
            ],
            orderNotes: '',
            status: 'accepted',
            acceptedAt: new Date(Date.now() - 8 * 60000),
            subtotal: 35,
            tax: 3.5,
            discount: 0,
            total: 38.5,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 10 * 60000) // 10 minutes ago
        });

        // Order 4: Accepted
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[3]._id,
            guestName: 'Birthday Party',
            waiterId: waiter._id,
            items: [
                {
                    menuItemId: menuItems[16]._id, // Chocolate Lava Cake
                    name: menuItems[16].name,
                    price: menuItems[16].price,
                    quantity: 3,
                    modifiers: [],
                    specialInstructions: 'Add candles',
                    status: 'pending',
                    subtotal: 30
                }
            ],
            orderNotes: 'Birthday celebration',
            status: 'accepted',
            acceptedAt: new Date(Date.now() - 6 * 60000),
            subtotal: 30,
            tax: 3,
            discount: 0,
            total: 33,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 7 * 60000) // 7 minutes ago
        });

        // Order 5: Preparing (kitchen is cooking)
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[4]._id,
            customerId: customer._id,
            guestName: customer.fullName,
            waiterId: waiter._id,
            items: [
                {
                    menuItemId: menuItems[6]._id, // Pasta Carbonara
                    name: menuItems[6].name,
                    price: menuItems[6].price,
                    quantity: 2,
                    modifiers: [],
                    specialInstructions: 'Extra cheese',
                    status: 'preparing',
                    prepStartTime: new Date(Date.now() - 10 * 60000),
                    subtotal: 36
                }
            ],
            orderNotes: '',
            status: 'preparing',
            acceptedAt: new Date(Date.now() - 15 * 60000),
            subtotal: 36,
            tax: 3.6,
            discount: 0,
            total: 39.6,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 20 * 60000) // 20 minutes ago
        });

        // Order 6: Preparing
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[5]._id,
            guestName: 'Corporate Lunch',
            waiterId: waiter._id,
            items: [
                {
                    menuItemId: menuItems[8]._id, // Seafood Paella
                    name: menuItems[8].name,
                    price: menuItems[8].price,
                    quantity: 1,
                    modifiers: [],
                    specialInstructions: '',
                    status: 'preparing',
                    prepStartTime: new Date(Date.now() - 12 * 60000),
                    subtotal: 32
                }
            ],
            orderNotes: 'Business meeting',
            status: 'preparing',
            acceptedAt: new Date(Date.now() - 18 * 60000),
            subtotal: 32,
            tax: 3.2,
            discount: 0,
            total: 35.2,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 25 * 60000) // 25 minutes ago
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
                    specialInstructions: '',
                    status: 'ready',
                    prepStartTime: new Date(Date.now() - 18 * 60000),
                    prepEndTime: new Date(Date.now() - 2 * 60000),
                    subtotal: 18
                }
            ],
            orderNotes: '',
            status: 'ready',
            acceptedAt: new Date(Date.now() - 22 * 60000),
            subtotal: 18,
            tax: 1.8,
            discount: 0,
            total: 19.8,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 30 * 60000) // 30 minutes ago
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
                    specialInstructions: '',
                    status: 'served',
                    prepStartTime: new Date(Date.now() - 35 * 60000),
                    prepEndTime: new Date(Date.now() - 15 * 60000),
                    subtotal: 22
                },
                {
                    menuItemId: menuItems[11]._id, // Iced Coffee
                    name: menuItems[11].name,
                    price: menuItems[11].price,
                    quantity: 1,
                    modifiers: [],
                    specialInstructions: '',
                    status: 'served',
                    subtotal: 5
                }
            ],
            orderNotes: '',
            status: 'served',
            acceptedAt: new Date(Date.now() - 40 * 60000),
            servedAt: new Date(Date.now() - 10 * 60000),
            subtotal: 27,
            tax: 2.7,
            discount: 0,
            total: 29.7,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 45 * 60000) // 45 minutes ago
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
                    specialInstructions: '',
                    status: 'served',
                    prepStartTime: new Date(Date.now() - 65 * 60000),
                    prepEndTime: new Date(Date.now() - 45 * 60000),
                    subtotal: 38
                }
            ],
            orderNotes: '',
            status: 'completed',
            acceptedAt: new Date(Date.now() - 70 * 60000),
            servedAt: new Date(Date.now() - 40 * 60000),
            subtotal: 38,
            tax: 3.8,
            discount: 5,
            total: 36.8,
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            paidAt: new Date(Date.now() - 35 * 60000),
            createdAt: new Date(Date.now() - 75 * 60000) // 75 minutes ago
        });

        // Order 10: Rejected
        sampleOrders.push({
            orderNumber: generateOrderNumber(),
            restaurantId: restaurant._id,
            tableId: tables[9]._id,
            guestName: 'Guest Customer',
            items: [
                {
                    menuItemId: menuItems[17]._id, // Tiramisu
                    name: menuItems[17].name,
                    price: menuItems[17].price,
                    quantity: 1,
                    modifiers: [],
                    specialInstructions: '',
                    status: 'pending',
                    subtotal: 9
                }
            ],
            orderNotes: '',
            status: 'rejected',
            rejectionReason: 'Item out of stock',
            rejectedAt: new Date(Date.now() - 2 * 60000),
            subtotal: 9,
            tax: 0.9,
            discount: 0,
            total: 9.9,
            paymentStatus: 'pending',
            createdAt: new Date(Date.now() - 4 * 60000) // 4 minutes ago
        });

        await Order.insertMany(sampleOrders);
        console.log('✅ Created 10 Sample Orders with different statuses');

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SEED DATA SUMMARY');
        console.log('='.repeat(60));
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
        console.log(`🍽️  Menu Items: ${menuItems.length} (20 items with images)`);
        console.log(`🪑 Tables: ${tableNumbers.length} (10 tables with QR codes)`);
        console.log(`📦 Orders: ${sampleOrders.length} (10 orders with various statuses)`);
        console.log(`\n📋 Order Status Breakdown:`);
        console.log(`   - Pending: 2 orders`);
        console.log(`   - Accepted: 2 orders`);
        console.log(`   - Preparing: 2 orders`);
        console.log(`   - Ready: 1 order`);
        console.log(`   - Served: 1 order`);
        console.log(`   - Completed: 1 order`);
        console.log(`   - Rejected: 1 order`);
        console.log('='.repeat(60));
        console.log('\n✅ Database seeded successfully!');
        console.log('🎉 All requirements met:');
        console.log('   ✅ 5 Categories');
        console.log('   ✅ 8 Modifiers');
        console.log('   ✅ 20 Menu Items with Images');
        console.log('   ✅ 10 Tables with QR Codes');
        console.log('   ✅ 10 Orders with Various Statusages');
        console.log('   ✅ 10 Tables with QR Codes');
        console.log('🚀 You can now start the server with: npm run dev\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
