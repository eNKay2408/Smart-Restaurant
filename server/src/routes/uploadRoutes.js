import express from 'express';
import { upload, uploadMenuItemImage } from '../controllers/uploadController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Upload menu item image
router.post(
    '/menu-items',
    protect,
    authorize('admin', 'super_admin'),
    upload.single('image'),
    uploadMenuItemImage
);

export default router;
