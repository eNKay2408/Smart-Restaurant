import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directories exist
const menuUploadsDir = path.join(__dirname, "../../public/images/menu-items");
const avatarUploadsDir = path.join(__dirname, "../../public/images/avatars");

if (!fs.existsSync(menuUploadsDir)) {
	fs.mkdirSync(menuUploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarUploadsDir)) {
	fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

// Configure multer storage for menu items
const menuItemStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, menuUploadsDir);
	},
	filename: (req, file, cb) => {
		// Get menu item name from request body
		const itemName = req.body.itemName || "item";

		// Sanitize item name (replace spaces with hyphens, remove special chars)
		const sanitizedName = itemName
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");

		// Get file extension
		const ext = path.extname(file.originalname);

		// Find next available filename
		let filename = `${sanitizedName}${ext}`;
		let counter = 1;

		while (fs.existsSync(path.join(menuUploadsDir, filename))) {
			filename = `${sanitizedName}-${counter}${ext}`;
			counter++;
		}

		cb(null, filename);
	},
});

// Configure multer storage for avatars
const avatarStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, avatarUploadsDir);
	},
	filename: (req, file, cb) => {
		// Use user ID for avatar filename
		const userId = req.user?.id || req.user?._id || "user";
		const ext = path.extname(file.originalname);
		const timestamp = Date.now();
		const filename = `avatar-${userId}-${timestamp}${ext}`;
		cb(null, filename);
	},
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|gif|webp/;
	const extname = allowedTypes.test(
		path.extname(file.originalname).toLowerCase(),
	);
	const mimetype = allowedTypes.test(file.mimetype);

	if (extname && mimetype) {
		cb(null, true);
	} else {
		cb(new Error("Only image files are allowed!"));
	}
};

// Create multer upload instances
export const upload = multer({
	storage: menuItemStorage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

export const avatarUpload = multer({
	storage: avatarStorage,
	fileFilter,
	limits: {
		fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
	},
});

// Upload controller for menu items
export const uploadMenuItemImage = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "No file uploaded",
			});
		}

		// Return the image URL
		const imageUrl = `/images/menu-items/${req.file.filename}`;

		res.json({
			success: true,
			message: "Image uploaded successfully",
			data: {
				filename: req.file.filename,
				url: imageUrl,
				path: req.file.path,
			},
		});
	} catch (error) {
		console.error("Upload error:", error);
		res.status(500).json({
			success: false,
			message: "Error uploading image",
			error: error.message,
		});
	}
};

// Upload controller for avatars
export const uploadAvatar = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: "No file uploaded",
			});
		}

		// Return the avatar URL
		const avatarUrl = `/images/avatars/${req.file.filename}`;

		res.json({
			success: true,
			message: "Avatar uploaded successfully",
			data: {
				filename: req.file.filename,
				url: avatarUrl,
				path: req.file.path,
			},
		});
	} catch (error) {
		console.error("Avatar upload error:", error);
		res.status(500).json({
			success: false,
			message: "Error uploading avatar",
			error: error.message,
		});
	}
};
