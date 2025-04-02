/**
 * Application configuration
 * No hardcoded values should be used in the application code.
 * All configurable values should be defined here.
 */

// Base path for storing images and folders
export const DATA_PATH = process.env.DATA_PATH || "./data";

// File types
export const ALLOWED_FILE_TYPES = [
  // JPEG
  "image/jpeg",
  "image/jpg",
  
  // PNG
  "image/png",
  
  // GIF
  "image/gif",
  
  // WebP
  "image/webp",
  
  // SVG
  "image/svg+xml",
  "image/svg",
  
  // BMP
  "image/bmp",
  
  // TIFF
  "image/tiff",
  
  // HEIC/HEIF (Apple devices)
  "image/heic",
  "image/heif",
  
  // Allow generic types that some browsers might use
  "application/octet-stream",
  "image/*"
];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Thumbnail settings
export const THUMBNAIL_DIMENSIONS = {
  width: 200,
  height: 200,
};

// UI Settings
export const UI_CONFIG = {
  itemsPerPage: 50,
  gridColumns: {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
  defaultView: "grid" as "grid" | "list",
};

// Sort options
export const SORT_OPTIONS = [
  { label: "Name (A-Z)", value: "name-asc" },
  { label: "Name (Z-A)", value: "name-desc" },
  { label: "Date (Newest)", value: "date-desc" },
  { label: "Date (Oldest)", value: "date-asc" },
  { label: "Size (Largest)", value: "size-desc" },
  { label: "Size (Smallest)", value: "size-asc" },
]; 