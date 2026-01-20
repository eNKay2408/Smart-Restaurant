import express from "express";
import {
	upload,
	avatarUpload,
	uploadMenuItemImage,
	uploadAvatar,
} from "../controllers/uploadController.js";
import {
	cloudinaryMenuUpload,
	cloudinaryAvatarUpload,
	uploadMenuItemImageToCloudinary,
	uploadAvatarToCloudinary,
	deleteImageFromCloudinary,
} from "../controllers/cloudinaryUploadController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Check if Cloudinary is configured
const useCloudinary = !!(
	process.env.CLOUDINARY_CLOUD_NAME &&
	process.env.CLOUDINARY_API_KEY &&
	process.env.CLOUDINARY_API_SECRET
);

console.log(`📸 Upload mode: ${useCloudinary ? "Cloudinary (Production)" : "Local Disk (Development)"}`);

// Upload menu item image - Use Cloudinary in production, local in development
router.post(
	"/menu-items",
	protect,
	authorize("admin", "super_admin"),
	useCloudinary ? cloudinaryMenuUpload.single("image") : upload.single("image"),
	useCloudinary ? uploadMenuItemImageToCloudinary : uploadMenuItemImage
);

// Upload user avatar
router.post(
	"/avatar",
	protect,
	useCloudinary ? cloudinaryAvatarUpload.single("avatar") : avatarUpload.single("avatar"),
	useCloudinary ? uploadAvatarToCloudinary : uploadAvatar
);

// Delete image from Cloudinary (production only)
if (useCloudinary) {
	router.delete(
		"/delete",
		protect,
		authorize("admin", "super_admin"),
		deleteImageFromCloudinary
	);
}

export default router;
