// Load environment variables FIRST - before any other imports!
import dotenv from "dotenv";
dotenv.config();

// Now import everything else
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const swaggerUi = require("swagger-ui-express");
import swaggerSpec from "./config/swagger.js";
import connectDB from "./config/database.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { initializeSocket } from "./socket/index.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import menuItemRoutes from "./routes/menuItemRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import modifierRoutes from "./routes/modifierRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Security middleware - Configure helmet to allow CORS for static files
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: "cross-origin" },
		crossOriginEmbedderPolicy: false,
	})
);

// CORS configuration
const allowedOrigins = [
	"http://localhost:5173",
	"http://localhost:5174",
	process.env.CLIENT_URL,
].filter(Boolean);

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	})
);

// Rate limiting - more lenient in development
const limiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
	max:
		parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
		(process.env.NODE_ENV === "development" ? 10000 : 100), // Much higher for development
	message: "Too many requests from this IP, please try again later",
	skip: (req) => {
		// Skip rate limiting in development for localhost
		if (process.env.NODE_ENV === "development") {
			const isLocalhost =
				req.ip === "::1" ||
				req.ip === "127.0.0.1" ||
				req.ip === "::ffff:127.0.0.1";
			return isLocalhost; // Always skip for localhost in development
		}
		return false;
	},
});
app.use("/api/", limiter);

// Body parser middleware
// IMPORTANT: Stripe webhook endpoint needs raw body for signature verification
// This must come BEFORE the JSON parser
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Regular JSON parser for all other routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Serve static files (images, etc.)
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../public/images")));
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// Logging middleware
if (process.env.NODE_ENV === "development") {
	app.use(morgan("dev"));
} else {
	app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({
		success: true,
		message: "Smart Restaurant API is running",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV,
	});
});

// API test endpoint
app.get("/api/test", (req, res) => {
	res.json({
		success: true,
		message:
			"API connection successful! Frontend and Backend are connected properly.",
		timestamp: new Date().toISOString(),
		server: "Smart Restaurant API",
		version: "1.0.0",
	});
});

// Swagger API Documentation
app.use(
	"/api/docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, {
		customCss: ".swagger-ui .topbar { display: none }",
		customSiteTitle: "Smart Restaurant API Docs",
	})
);

// Swagger JSON spec
app.get("/api/docs.json", (req, res) => {
	res.setHeader("Content-Type", "application/json");
	res.send(swaggerSpec);
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/tables", tableRoutes);

// Direct promotion route - MUST be before /api/orders to avoid 404
app.post('/api/orders/:id/apply-promotion', async (req, res) => {
	try {
		const { id: orderId } = req.params;
		const { promotionId, promotionCode, discount, tip, tax, total } = req.body;

		const Order = (await import('./models/Order.js')).default;

		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		order.discount = discount || 0;
		order.tipAmount = tip || 0;
		order.tax = tax || 0;
		order.total = total;

		await order.save();

		if (promotionId) {
			try {
				const Promotion = (await import('./models/Promotion.js')).default;
				await Promotion.findByIdAndUpdate(promotionId, {
					$inc: { usedCount: 1 }
				});
				console.log(`✅ Incremented usage for promotion: ${promotionCode}`);
			} catch (err) {
				console.error('Promotion update failed:', err);
			}
		}

		console.log(`✅ Applied promotion to order ${order.orderNumber}:`, {
			discount, tip, tax, total
		});

		res.status(200).json({
			success: true,
			message: 'Promotion applied successfully',
			data: order
		});

	} catch (error) {
		console.error('Apply promotion error:', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to apply promotion'
		});
	}
});

app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/modifiers", modifierRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);

// Root endpoint
app.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Welcome to Smart Restaurant API",
		version: "1.0.0",
		documentation: "/api/docs",
	});
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);
app.set("io", io); // Make io available in controllers

const server = httpServer.listen(PORT, () => {
	console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🍽️  Smart Restaurant API Server                    ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV?.toUpperCase() || "DEVELOPMENT"
		}                              ║
║   Port: ${PORT}                                        ║
║   URL: http://localhost:${PORT}                        ║
║   Socket.IO: ✅ Enabled                                ║
║   URL: http://localhost:${PORT}                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
	console.error("❌ Unhandled Rejection:", err);
	server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("❌ Uncaught Exception:", err);
	process.exit(1);
});

export default app;
