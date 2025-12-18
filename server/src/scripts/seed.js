import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Restaurant, Category, MenuItem, Table } from '../models/index.js';
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
            role: 'kitchen_staff',
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

        // 7. Create Categories
        const categories = await Category.insertMany([
            {
                name: 'Appetizers',
                description: 'Start your meal right',
                displayOrder: 1,
                restaurantId: restaurant._id,
            },
            {
                name: 'Main Dishes',
                description: 'Our signature dishes',
                displayOrder: 2,
                restaurantId: restaurant._id,
            },
            {
                name: 'Drinks',
                description: 'Refreshing beverages',
                displayOrder: 3,
                restaurantId: restaurant._id,
            },
            {
                name: 'Desserts',
                description: 'Sweet endings',
                displayOrder: 4,
                restaurantId: restaurant._id,
            },
        ]);
        console.log('✅ Created Categories');

        // 8. Create Menu Items
        const menuItems = await MenuItem.insertMany([
            // Appetizers
            {
                name: 'Caesar Salad',
                description: 'Fresh romaine lettuce with parmesan and croutons',
                price: 12,
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
                categoryId: categories[0]._id,
                restaurantId: restaurant._id,
                prepTime: 8,
                status: 'available',
            },
            // Main Dishes
            {
                name: 'Grilled Salmon',
                description: 'Fresh Atlantic salmon with seasonal vegetables',
                price: 18,
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
                price: 25,
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
                price: 15,
                categoryId: categories[1]._id,
                restaurantId: restaurant._id,
                prepTime: 12,
                status: 'available',
            },
            // Drinks
            {
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed orange juice',
                price: 5,
                categoryId: categories[2]._id,
                restaurantId: restaurant._id,
                prepTime: 3,
                status: 'available',
            },
            {
                name: 'Iced Coffee',
                description: 'Vietnamese style iced coffee',
                price: 4,
                categoryId: categories[2]._id,
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
            // Desserts
            {
                name: 'Chocolate Lava Cake',
                description: 'Warm chocolate cake with molten center',
                price: 8,
                categoryId: categories[3]._id,
                restaurantId: restaurant._id,
                prepTime: 10,
                status: 'available',
                isRecommended: true,
            },
            {
                name: 'Tiramisu',
                description: 'Classic Italian coffee-flavored dessert',
                price: 7,
                categoryId: categories[3]._id,
                restaurantId: restaurant._id,
                prepTime: 5,
                status: 'available',
            },
        ]);
        console.log('✅ Created Menu Items');

        // 9. Create Tables with QR Codes
        const tableNumbers = ['1', '2', '3', '4', '5', '6', '7', '8'];
        const locations = ['Window', 'Corner', 'Center', 'Patio', 'Window', 'Center', 'Corner', 'Private'];

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
        console.log('✅ Created Tables with QR Codes');

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SEED DATA SUMMARY');
        console.log('='.repeat(60));
        console.log(`Restaurant: ${restaurant.name}`);
        console.log(`\n👥 Users Created:`);
        console.log(`   Super Admin: superadmin@smartrestaurant.com / Admin123`);
        console.log(`   Admin: admin@restaurant.com / Admin123`);
        console.log(`   Waiter: waiter@restaurant.com / Waiter123`);
        console.log(`   Kitchen: kitchen@restaurant.com / Kitchen123`);
        console.log(`   Customer: customer@example.com / Customer123`);
        console.log(`\n📁 Categories: ${categories.length}`);
        console.log(`🍽️  Menu Items: ${menuItems.length}`);
        console.log(`🪑 Tables: ${tableNumbers.length}`);
        console.log('='.repeat(60));
        console.log('\n✅ Database seeded successfully!');
        console.log('🚀 You can now start the server with: npm run dev\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
