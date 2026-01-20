import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for menu items
const menuItemCloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "smart-restaurant/menu-items",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
});

// Cloudinary storage for avatars
const avatarCloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "smart-restaurant/avatars",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
    },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
        file.originalname.toLowerCase().split(".").pop()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"));
    }
};

// Create multer upload instances for Cloudinary
export const cloudinaryMenuUpload = multer({
    storage: menuItemCloudinaryStorage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

export const cloudinaryAvatarUpload = multer({
    storage: avatarCloudinaryStorage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
});

/**
 * Upload menu item image to Cloudinary
 */
export const uploadMenuItemImageToCloudinary = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        // Cloudinary URL is available in req.file
        const imageUrl = req.file.path; // Cloudinary URL

        console.log("📸 Menu item image uploaded to Cloudinary:", imageUrl);

        res.json({
            success: true,
            message: "Image uploaded successfully to Cloudinary",
            data: {
                filename: req.file.filename,
                url: imageUrl,
                cloudinaryId: req.file.filename, // public_id for deletion
            },
        });
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading image to Cloudinary",
            error: error.message,
        });
    }
};

/**
 * Upload avatar to Cloudinary
 */
export const uploadAvatarToCloudinary = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const avatarUrl = req.file.path; // Cloudinary URL

        console.log("👤 Avatar uploaded to Cloudinary:", avatarUrl);

        res.json({
            success: true,
            message: "Avatar uploaded successfully to Cloudinary",
            data: {
                filename: req.file.filename,
                url: avatarUrl,
                cloudinaryId: req.file.filename,
            },
        });
    } catch (error) {
        console.error("Cloudinary avatar upload error:", error);
        res.status(500).json({
            success: false,
            message: "Error uploading avatar to Cloudinary",
            error: error.message,
        });
    }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImageFromCloudinary = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: "Public ID is required",
            });
        }

        const result = await cloudinary.uploader.destroy(publicId);

        console.log("🗑️ Image deleted from Cloudinary:", publicId);

        res.json({
            success: true,
            message: "Image deleted successfully",
            data: result,
        });
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting image from Cloudinary",
            error: error.message,
        });
    }
};

export default {
    cloudinaryMenuUpload,
    cloudinaryAvatarUpload,
    uploadMenuItemImageToCloudinary,
    uploadAvatarToCloudinary,
    deleteImageFromCloudinary,
};
