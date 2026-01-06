import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Restaurant API',
            version: '1.0.0',
            description: 'API documentation for Smart Restaurant management system',
            contact: {
                name: 'Smart Restaurant Team',
                email: 'admin@smartrestaurant.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
            {
                url: 'https://api.smartrestaurant.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                        error: {
                            type: 'string',
                            example: 'Detailed error information',
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                        },
                        fullName: {
                            type: 'string',
                            example: 'John Doe',
                        },
                        email: {
                            type: 'string',
                            example: 'john@example.com',
                        },
                        role: {
                            type: 'string',
                            enum: ['guest', 'customer', 'waiter', 'kitchen', 'admin', 'super_admin'],
                            example: 'customer',
                        },
                        phoneNumber: {
                            type: 'string',
                            example: '+84123456789',
                        },
                    },
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd7799439011',
                        },
                        name: {
                            type: 'string',
                            example: 'Main Course',
                        },
                        description: {
                            type: 'string',
                            example: 'Delicious main dishes',
                        },
                        icon: {
                            type: 'string',
                            example: '🍽️',
                        },
                        displayOrder: {
                            type: 'number',
                            example: 1,
                        },
                        isActive: {
                            type: 'boolean',
                            example: true,
                        },
                    },
                },
                MenuItem: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                        },
                        name: {
                            type: 'string',
                            example: 'Grilled Salmon',
                        },
                        description: {
                            type: 'string',
                            example: 'Fresh salmon with herbs',
                        },
                        price: {
                            type: 'number',
                            example: 25.99,
                        },
                        categoryId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                        },
                        imageUrl: {
                            type: 'string',
                            example: 'https://example.com/salmon.jpg',
                        },
                        isAvailable: {
                            type: 'boolean',
                            example: true,
                        },
                        modifiers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: 'Size',
                                    },
                                    options: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: {
                                                    type: 'string',
                                                    example: 'Large',
                                                },
                                                priceAdjustment: {
                                                    type: 'number',
                                                    example: 5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                Table: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                        },
                        tableNumber: {
                            type: 'string',
                            example: 'T01',
                        },
                        capacity: {
                            type: 'number',
                            example: 4,
                        },
                        status: {
                            type: 'string',
                            enum: ['available', 'occupied', 'reserved'],
                            example: 'available',
                        },
                        qrCode: {
                            type: 'string',
                            example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
                        },
                    },
                },
                ModifierOption: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                        },
                        name: {
                            type: 'string',
                            example: 'Large',
                        },
                        priceAdjustment: {
                            type: 'number',
                            example: 5,
                            description: 'Additional price for this option',
                        },
                        isDefault: {
                            type: 'boolean',
                            example: false,
                            description: 'Whether this option is selected by default',
                        },
                        isActive: {
                            type: 'boolean',
                            example: true,
                            description: 'Whether this option is currently available',
                        },
                    },
                },
                Modifier: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                        },
                        name: {
                            type: 'string',
                            example: 'Size',
                            description: 'Name of the modifier group',
                        },
                        type: {
                            type: 'string',
                            enum: ['single', 'multiple'],
                            example: 'single',
                            description: 'single: customer can select only one option, multiple: customer can select multiple options',
                        },
                        required: {
                            type: 'boolean',
                            example: false,
                            description: 'Whether customer must select an option from this modifier',
                        },
                        displayOrder: {
                            type: 'number',
                            example: 1,
                            description: 'Order in which modifiers are displayed',
                        },
                        options: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ModifierOption',
                            },
                            description: 'Available options for this modifier',
                        },
                        isActive: {
                            type: 'boolean',
                            example: true,
                            description: 'Whether this modifier is currently available',
                        },
                        restaurantId: {
                            type: 'string',
                            example: '507f1f77bcf86cd799439011',
                            description: 'ID of the restaurant this modifier belongs to',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-01-05T12:00:00.000Z',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-01-05T12:00:00.000Z',
                        },
                        optionCount: {
                            type: 'number',
                            example: 3,
                            description: 'Virtual field: number of options in this modifier',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication and authorization',
            },
            {
                name: 'Categories',
                description: 'Menu category management',
            },
            {
                name: 'Menu Items',
                description: 'Menu item management',
            },
            {
                name: 'Modifiers',
                description: 'Menu item customization and modifier management',
            },
            {
                name: 'Tables',
                description: 'Table and QR code management',
            },
            {
                name: 'Orders',
                description: 'Order management and tracking',
            },
            {
                name: 'Payments',
                description: 'Payment processing and transactions',
            },
        ],
    },
    apis: [path.join(__dirname, '../routes/*.js')], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
