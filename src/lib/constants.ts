/**
 * Application constants
 * Common values used throughout the application
 */

// File types with their display names and icons
export const FILE_TYPE_ICONS = {
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/gif": "🎞️",
  "image/webp": "🖼️",
  "image/svg+xml": "📊",
  "image/bmp": "🖼️",
  "image/tiff": "🖼️",
  "folder": "📁",
  "unknown": "📄",
};

// Action types for file operations
export const FILE_ACTIONS = {
  CREATE_FOLDER: "CREATE_FOLDER",
  RENAME_ITEM: "RENAME_ITEM",
  DELETE_ITEM: "DELETE_ITEM",
  MOVE_ITEM: "MOVE_ITEM",
  UPLOAD_FILES: "UPLOAD_FILES",
};

// Error messages
export const ERROR_MESSAGES = {
  ITEM_EXISTS: "An item with this name already exists",
  INVALID_NAME: "The name contains invalid characters",
  INVALID_FILE_TYPE: "This file type is not supported",
  FILE_TOO_LARGE: "The file is too large",
  OPERATION_FAILED: "The operation failed",
  ITEM_NOT_FOUND: "The item was not found",
  ACCESS_DENIED: "Access denied",
  SERVER_ERROR: "Server error",
};

// Success messages
export const SUCCESS_MESSAGES = {
  FOLDER_CREATED: "Folder created successfully",
  ITEM_RENAMED: "Item renamed successfully",
  ITEM_DELETED: "Item deleted successfully",
  ITEM_MOVED: "Item moved successfully",
  FILES_UPLOADED: "Files uploaded successfully",
};

// Route constants
export const ROUTES = {
  HOME: "/",
  FOLDER: (path: string) => `/${path}`,
};

// Local storage keys
export const STORAGE_KEYS = {
  VIEW_MODE: "image-manager-view-mode",
  SORT_ORDER: "image-manager-sort-order",
}; 