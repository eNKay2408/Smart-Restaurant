/**
 * Get full image URL from relative path
 * @param relativePath - Relative path from database (e.g. "/uploads/menu-items/beef-steak-1.jpg")
 * @returns Full URL (e.g. "http://localhost:5000/uploads/menu-items/beef-steak-1.jpg")
 */
export const getImageUrl = (relativePath: string | undefined | null): string => {
    if (!relativePath) {
        return '';
    }

    // If already a full URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }

    // Get base URL from environment or default to localhost
    const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

    // Remove /api from base URL since static files are served from root
    const serverURL = baseURL.replace('/api', '');

    // Ensure relativePath starts with /
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    return `${serverURL}${path}`;
};

/**
 * Get primary image URL from menu item
 * @param images - Array of image paths
 * @param primaryImageIndex - Index of primary image
 * @returns Full URL of primary image
 */
export const getPrimaryImageUrl = (
    images: string[] | undefined | null,
    primaryImageIndex?: number
): string => {
    if (!images || images.length === 0) {
        return '';
    }

    const index = primaryImageIndex || 0;
    const imagePath = images[index] || images[0];

    return getImageUrl(imagePath);
};

/**
 * Get category image URL
 * @param imagePath - Category image path
 * @returns Full URL
 */
export const getCategoryImageUrl = (imagePath: string | undefined | null): string => {
    return getImageUrl(imagePath);
};
