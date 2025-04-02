/**
 * Core type definitions for the application
 */

// File/Folder item type
export interface FileItem {
  name: string;
  path: string;
  type: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: Date;
  url?: string;
}

// Directory contents type
export interface DirectoryContents {
  path: string;
  items: FileItem[];
  parent: string | null;
}

// Operation result type
export interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
}

// File upload type
export interface FileUpload {
  file: File;
  progress: number;
  error?: string;
  completed: boolean;
}

// Sort option type
export interface SortOption {
  label: string;
  value: string;
}

// View mode type
export type ViewMode = "grid" | "list";

// Sort function type
export type SortFunction = (a: FileItem, b: FileItem) => number;

// Filter function type
export type FilterFunction = (item: FileItem) => boolean;

// File action type
export interface FileAction {
  type: string;
  payload: any;
}

// Path segments type for breadcrumb
export interface PathSegment {
  name: string;
  path: string;
}

// Dialog state for modals
export interface DialogState {
  isOpen: boolean;
  type: "create" | "rename" | "delete" | "move" | null;
  item?: FileItem;
  path?: string;
} 