import express from "express";
import {
	upload,
	avatarUpload,
	uploadMenuItemImage,
	uploadAvatar,
} from "../controllers/uploadController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Upload menu item image
router.post(
	"/menu-items",
	protect,
	authorize("admin", "super_admin"),
	upload.single("image"),
	uploadMenuItemImage,
);

// Upload user avatar
router.post("/avatar", protect, avatarUpload.single("avatar"), uploadAvatar);

export default router;
