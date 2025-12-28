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

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:5173",
		credentials: true,
	})
);

// Rate limiting
const limiter = rateLimit({
	windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
	max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
	message: "Too many requests from this IP, please try again later",
});
app.use("/api/", limiter);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

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
		message: "API connection successful! Frontend and Backend are connected properly.",
		timestamp: new Date().toISOString(),
		server: "Smart Restaurant API",
		version: "1.0.0"
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
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

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
